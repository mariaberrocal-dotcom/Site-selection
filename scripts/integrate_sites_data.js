#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");

const XLSX_PATH = "data/sites_data_20260306.xlsx";
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

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toBoolean(value) {
  if (value === "1" || value === 1 || value === true) return true;
  if (value === "0" || value === 0 || value === false) return false;
  return null;
}

function normalizeKey(key) {
  const normalized = String(key || "").trim();
  const map = {
    id: "id",
    name: "name",
    state: "state",
    country: "country",
    Country: "country",
    Region: "region",
    BusinessUnit: "businessUnit",
    Commodity: "commodity",
    Supplier: "supplier",
    FacilityType: "facilityType",
    Hydrobasin5: "hydrobasin5",
    Hydrobasin7: "hydrobasin7",
    siteGroupTag: "siteGroupTag",
    latitude: "latitude",
    longitude: "longitude",
    checked: "checked",
    isGroup: "isGroup"
  };
  return map[normalized] || normalized;
}

function parseXlsxRows(xlsxPath) {
  const xml = execSync(`unzip -p "${xlsxPath}" xl/worksheets/sheet1.xml`, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
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
      const value = decodeXml(v || "");
      cells[col] = value;
    }
    rows.push(cells);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((h) => normalizeKey(h));
  return rows.slice(1).map((cells) => {
    const item = {};
    headers.forEach((header, index) => {
      const raw = cells[index] ?? "";
      item[header] = raw === "" ? null : raw;
    });

    item.latitude = toNumber(item.latitude);
    item.longitude = toNumber(item.longitude);
    item.hydrobasin5 = toNumber(item.hydrobasin5);
    item.hydrobasin7 = toNumber(item.hydrobasin7);
    item.checked = toBoolean(item.checked);
    item.isGroup = toBoolean(item.isGroup);
    return item;
  });
}

function columnToIndex(col) {
  let value = 0;
  for (let i = 0; i < col.length; i += 1) {
    value = value * 26 + (col.charCodeAt(i) - 64);
  }
  return value - 1;
}

function main() {
  const sourceRows = parseXlsxRows(XLSX_PATH);
  const byId = new Map(sourceRows.filter((r) => r.id).map((r) => [r.id, r]));
  const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));

  let merged = 0;
  let missing = 0;

  for (const feature of geojson.features || []) {
    const props = feature.properties || {};
    const incoming = byId.get(props.id);
    if (!incoming) {
      missing += 1;
      continue;
    }

    merged += 1;
    props.name = incoming.name ?? props.name ?? null;
    props.state = incoming.state ?? props.state ?? null;
    props.country = incoming.country ?? props.country ?? null;
    props.region = incoming.region ?? props.region ?? null;
    props.businessUnit = incoming.businessUnit ?? props.businessUnit ?? null;
    props.commodity = incoming.commodity ?? props.commodity ?? null;
    props.supplier = incoming.supplier ?? props.supplier ?? null;
    props.facilityType = incoming.facilityType ?? props.facilityType ?? null;
    props.hydrobasin5 = incoming.hydrobasin5 ?? props.hydrobasin5 ?? null;
    props.hydrobasin7 = incoming.hydrobasin7 ?? props.hydrobasin7 ?? null;
    props.siteGroupTag = incoming.siteGroupTag ?? props.siteGroupTag ?? null;
    props.checked = incoming.checked ?? props.checked ?? null;
    props.isGroup = incoming.isGroup ?? props.isGroup ?? null;

    if (
      Number.isFinite(incoming.longitude) &&
      Number.isFinite(incoming.latitude) &&
      feature.geometry?.type === "Point"
    ) {
      feature.geometry.coordinates = [incoming.longitude, incoming.latitude];
    }
  }

  fs.writeFileSync(GEOJSON_PATH, JSON.stringify(geojson));
  console.log(`Integrated rows from sites_data: ${merged} matched, ${missing} unmatched features.`);
}

main();
