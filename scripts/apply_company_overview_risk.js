#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");

const COMPANY_XLSX_PATH = "data/company-overview-table-1772823926996.xlsx";
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

function parseSheetRows(xlsxPath) {
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
  const headers = rows[0].map((h) => String(h || "").trim());

  return rows.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] == null || cells[idx] === "" ? null : cells[idx];
    });
    return obj;
  });
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

function buildKey(name, country, state) {
  return `${normalizeText(name)}|${normalizeText(country)}|${normalizeText(state)}`;
}

function toRisk(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  return rounded >= 1 && rounded <= 5 ? rounded : null;
}

function main() {
  const companyRows = parseSheetRows(COMPANY_XLSX_PATH);
  const byFullKey = new Map();
  const byName = new Map();

  for (const row of companyRows) {
    const name = row["Site Name"];
    const country = row.country;
    const state = row.state;
    const overallRisk = toRisk(row.overallRisk);
    if (!name || overallRisk == null) continue;

    byFullKey.set(buildKey(name, country, state), overallRisk);
    byName.set(normalizeText(name), overallRisk);
  }

  const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, "utf8"));
  let matchedFull = 0;
  let matchedName = 0;
  let unmatched = 0;

  for (const feature of geojson.features || []) {
    const props = feature.properties || {};
    const fullKey = buildKey(props.name, props.country, props.state);
    const nameKey = normalizeText(props.name);
    let risk = byFullKey.get(fullKey);
    if (risk != null) {
      matchedFull += 1;
    } else {
      risk = byName.get(nameKey);
      if (risk != null) {
        matchedName += 1;
      }
    }

    if (risk == null) {
      unmatched += 1;
      continue;
    }

    props.overallRisk = risk;
  }

  fs.writeFileSync(GEOJSON_PATH, JSON.stringify(geojson));
  console.log(
    `Applied overallRisk from company-overview-table: full=${matchedFull}, name=${matchedName}, unmatched=${unmatched}, total=${(geojson.features || []).length}`
  );
}

main();
