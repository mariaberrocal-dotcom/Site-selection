#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");

const ASSETS_XLSX_PATH = "data/operational_assets_data_20260306.xlsx";
const SITES_GEOJSON_PATH = "data/sites.geojson";
const OUTPUT_ASSETS_GEOJSON_PATH = "data/operational_assets.geojson";
const OUTPUT_LINKS_GEOJSON_PATH = "data/operational_asset_links.geojson";

const NEAR_SITE_THRESHOLD_METERS = 320;
const SCHEMATIC_BASE_OFFSET_METERS = 180;
const SCHEMATIC_RING_STEP_METERS = 90;
const SCHEMATIC_PER_RING = 8;

function decodeXml(text) {
  if (text == null) return "";
  return String(text)
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function columnToIndex(col) {
  let value = 0;
  for (let i = 0; i < col.length; i += 1) {
    value = value * 26 + (col.charCodeAt(i) - 64);
  }
  return value - 1;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseSheetRows(xlsxPath) {
  const xml = execSync(`unzip -p "${xlsxPath}" xl/worksheets/sheet1.xml`, {
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024
  });

  const rows = [];
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(xml))) {
    const rowXml = rowMatch[1];
    const cells = [];
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowXml))) {
      const attrs = cellMatch[1] || "";
      const body = cellMatch[2] || "";
      const ref = (attrs.match(/\br="([A-Z]+)\d+"/) || [])[1];
      const col = ref ? columnToIndex(ref) : cells.length;
      const v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      const inline = (body.match(/<is>\s*<t[^>]*>([\s\S]*?)<\/t>\s*<\/is>/) || [])[1];
      const rawValue = v ?? inline ?? "";
      cells[col] = decodeXml(rawValue);
    }
    rows.push(cells);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((h) => String(h || "").trim());
  return rows.slice(1).map((cells) => {
    const row = {};
    headers.forEach((header, index) => {
      const value = cells[index];
      row[header] = value == null || value === "" ? null : String(value).trim();
    });
    return row;
  });
}

function getAssetIconId(assetType, waterSourceType) {
  const type = String(assetType || "").toLowerCase().trim();
  const source = String(waterSourceType || "").toLowerCase().trim();

  if (type === "withdrawals") {
    if (source === "groundwater") return "oa-withdrawal-groundwater";
    if (source === "municipal") return "oa-withdrawal-municipal";
    if (source === "rainwater") return "oa-withdrawal-rainwater";
    if (source === "recycled") return "oa-withdrawal-recycled";
    if (source === "surface_water_withdrawal") return "oa-withdrawal-surface-water";
    return "oa-withdrawal-generic";
  }

  if (type === "discharges") {
    if (source === "recharge") return "oa-discharge-recharge";
    if (source === "sewer") return "oa-discharge-sewer";
    if (source === "surface_water_discharge") return "oa-discharge-surface";
    if (source === "treatment") return "oa-discharge-treatment";
    return "oa-discharge-generic";
  }

  return "oa-withdrawal-generic";
}

function distanceMeters(lon1, lat1, lon2, lat2) {
  const rad = Math.PI / 180;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;
  const dPhi = (lat2 - lat1) * rad;
  const dLambda = (lon2 - lon1) * rad;
  const a =
    Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

function offsetLonLat(lon, lat, meters, angleRad) {
  const metersPerDegLat = 111320;
  const metersPerDegLon = Math.max(20000, 111320 * Math.cos((lat * Math.PI) / 180));
  const dLon = (Math.cos(angleRad) * meters) / metersPerDegLon;
  const dLat = (Math.sin(angleRad) * meters) / metersPerDegLat;
  return [lon + dLon, lat + dLat];
}

function buildSiteTargets(relatedSitesRaw, siteIdSet, siteNameKeySet) {
  const raw = String(relatedSitesRaw || "").trim();
  if (!raw) return [];

  const targets = new Set();
  const rawKey = normalizeText(raw);
  if (siteIdSet.has(raw) || siteNameKeySet.has(rawKey)) {
    targets.add(raw);
    return Array.from(targets);
  }

  for (const token of raw.split(/[;,|]/)) {
    const part = token.trim();
    if (!part) continue;
    targets.add(part);
  }

  return Array.from(targets);
}

function main() {
  const rows = parseSheetRows(ASSETS_XLSX_PATH);
  const sites = JSON.parse(fs.readFileSync(SITES_GEOJSON_PATH, "utf8")).features || [];

  const bySiteId = new Map();
  const bySiteName = new Map();
  for (const feature of sites) {
    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const site = {
      id: String(props.id || "").trim(),
      name: String(props.name || "").trim(),
      nameKey: normalizeText(props.name),
      coordinates: [Number(coords[0]), Number(coords[1])]
    };
    if (site.id) bySiteId.set(site.id, site);
    if (site.nameKey) bySiteName.set(site.nameKey, site);
  }

  const siteIdSet = new Set(bySiteId.keys());
  const siteNameKeySet = new Set(bySiteName.keys());
  const linkedBySite = new Map();
  let unmatched = 0;

  for (const row of rows) {
    const lat = toNumber(row.latitude);
    const lon = toNumber(row.longitude);
    if (lat == null || lon == null) continue;

    const targets = buildSiteTargets(row.relatedSites, siteIdSet, siteNameKeySet);
    let linkedAny = false;

    for (const target of targets) {
      const site = bySiteId.get(target) || bySiteName.get(normalizeText(target));
      if (!site) continue;

      linkedAny = true;
      const list = linkedBySite.get(site.id || site.nameKey) || [];
      list.push({
        site,
        rawCoordinates: [lon, lat],
        row
      });
      linkedBySite.set(site.id || site.nameKey, list);
    }

    if (!linkedAny) unmatched += 1;
  }

  const assetFeatures = [];
  const linkFeatures = [];
  let schematized = 0;

  for (const group of linkedBySite.values()) {
    const near = [];
    const far = [];

    for (const item of group) {
      const [siteLon, siteLat] = item.site.coordinates;
      const [assetLon, assetLat] = item.rawCoordinates;
      const dist = distanceMeters(siteLon, siteLat, assetLon, assetLat);
      if (dist <= NEAR_SITE_THRESHOLD_METERS) {
        near.push(item);
      } else {
        far.push(item);
      }
    }

    near.forEach((item, index) => {
      const ring = Math.floor(index / SCHEMATIC_PER_RING);
      const indexInRing = index % SCHEMATIC_PER_RING;
      const countInRing = Math.min(SCHEMATIC_PER_RING, near.length - ring * SCHEMATIC_PER_RING);
      const angle = (Math.PI * 2 * indexInRing) / countInRing;
      const meters = SCHEMATIC_BASE_OFFSET_METERS + ring * SCHEMATIC_RING_STEP_METERS;
      item.displayCoordinates = offsetLonLat(item.site.coordinates[0], item.site.coordinates[1], meters, angle);
      schematized += 1;
    });

    far.forEach((item) => {
      item.displayCoordinates = item.rawCoordinates;
    });

    const merged = near.concat(far);
    for (const item of merged) {
      const row = item.row;
      const [displayLon, displayLat] = item.displayCoordinates;
      const [siteLon, siteLat] = item.site.coordinates;

      assetFeatures.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [displayLon, displayLat] },
        properties: {
          id: row.id ?? null,
          name: row.name ?? null,
          assetType: row.assetType ?? null,
          waterSourceType: row.waterSourceType ?? null,
          waterSourceName: row.waterSourceName ?? null,
          ownershipType: row.ownershipType ?? null,
          assetStatus: row.assetStatus ?? null,
          address: row.address ?? null,
          country: row.country ?? null,
          state: row.state ?? null,
          relatedSites: row.relatedSites ?? null,
          additionalNotes: row.additionalNotes ?? null,
          iconId: getAssetIconId(row.assetType, row.waterSourceType),
          linkedSiteId: item.site.id || null,
          linkedSiteName: item.site.name || null,
          rawLongitude: item.rawCoordinates[0],
          rawLatitude: item.rawCoordinates[1]
        }
      });

      linkFeatures.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [[siteLon, siteLat], [displayLon, displayLat]] },
        properties: {
          assetId: row.id ?? null,
          linkedSiteId: item.site.id || null,
          linkedSiteName: item.site.name || null
        }
      });
    }
  }

  fs.writeFileSync(
    OUTPUT_ASSETS_GEOJSON_PATH,
    JSON.stringify({ type: "FeatureCollection", features: assetFeatures })
  );
  fs.writeFileSync(
    OUTPUT_LINKS_GEOJSON_PATH,
    JSON.stringify({ type: "FeatureCollection", features: linkFeatures })
  );

  console.log(
    `Wrote operational assets: assets=${assetFeatures.length}, links=${linkFeatures.length}, schematized=${schematized}, unmatched=${unmatched}`
  );
}

main();
