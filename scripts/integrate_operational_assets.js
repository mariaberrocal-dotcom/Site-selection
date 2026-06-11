#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");

const ASSETS_XLSX_PATH = "data/operational_assets_data_20260306.xlsx";
const GEOJSON_PATH = "data/sites.geojson";

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
      const value = decodeXml(rawValue);
      cells[col] = value;
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

function buildSiteTargets(relatedSitesRaw, idSet, nameSet) {
  const raw = String(relatedSitesRaw || "").trim();
  if (!raw) return [];

  const targets = new Set();

  if (idSet.has(raw) || nameSet.has(normalizeText(raw))) {
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
  const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
  const features = geojson.features || [];

  const bySiteId = new Map();
  const bySiteName = new Map();

  for (const feature of features) {
    const props = feature.properties || {};
    const siteId = String(props.id || "").trim();
    const siteNameKey = normalizeText(props.name);

    if (siteId) bySiteId.set(siteId, feature);
    if (siteNameKey) bySiteName.set(siteNameKey, feature);

    props.operationalAssetCount = 0;
    props.operationalAssetTypes = null;
    props.operationalAssetsJson = "[]";
  }

  const siteIds = new Set(bySiteId.keys());
  const siteNameKeys = new Set(bySiteName.keys());

  let linkedById = 0;
  let linkedByName = 0;
  let linkedBySplit = 0;
  let unmatchedAssets = 0;

  for (const row of rows) {
    const asset = {
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
      additionalNotes: row.additionalNotes ?? null
    };

    const relatedSites = buildSiteTargets(
      row.relatedSites,
      siteIds,
      siteNameKeys
    );

    let assetLinked = false;

    for (const target of relatedSites) {
      const byId = bySiteId.get(target);
      if (byId) {
        const props = byId.properties || {};
        const list = JSON.parse(props.operationalAssetsJson || "[]");
        list.push(asset);
        props.operationalAssetsJson = JSON.stringify(list);
        linkedById += 1;
        assetLinked = true;
        continue;
      }

      const byName = bySiteName.get(normalizeText(target));
      if (byName) {
        const props = byName.properties || {};
        const list = JSON.parse(props.operationalAssetsJson || "[]");
        list.push(asset);
        props.operationalAssetsJson = JSON.stringify(list);
        if (relatedSites.length > 1) {
          linkedBySplit += 1;
        } else {
          linkedByName += 1;
        }
        assetLinked = true;
      }
    }

    if (!assetLinked) {
      unmatchedAssets += 1;
    }
  }

  for (const feature of features) {
    const props = feature.properties || {};
    const list = JSON.parse(props.operationalAssetsJson || "[]");
    const typeSet = new Set(list.map((item) => item.assetType).filter(Boolean));
    props.operationalAssetCount = list.length;
    props.operationalAssetTypes = typeSet.size ? Array.from(typeSet).join(", ") : null;
  }

  fs.writeFileSync(GEOJSON_PATH, JSON.stringify(geojson));
  console.log(
    `Integrated operational assets: rows=${rows.length}, linkedById=${linkedById}, linkedByName=${linkedByName}, linkedBySplit=${linkedBySplit}, unmatched=${unmatchedAssets}, sites=${features.length}`
  );
}

main();
