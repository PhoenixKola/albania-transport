import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";

const GTFS_URL =
  process.env.GTFS_URL?.trim() ||
  "https://example.com/gtfs.zip";

const ROOT = path.resolve(process.cwd(), "..");
const DATA_DIR = path.join(ROOT, "data");
const TMP_DIR = path.join(ROOT, ".tmp");

type Latest = {
  updatedAt: string;
  source: string;
  hash: string;
  files: { routes: string; stops: string };
  counts: { routes: number; stops: number };
};

type Route = {
  id: string;
  shortName: string;
  longName: string;
  type: number | null;
};

type Stop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function sha256(buf: Buffer) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

function readCsvFromZip(zip: AdmZip, fileName: string): any[] {
  const entry = zip.getEntry(fileName);
  if (!entry) throw new Error(`Missing GTFS file: ${fileName}`);
  const text = zip.readAsText(entry);
  return parse(text, { columns: true, skip_empty_lines: true, bom: true });
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function main() {
  ensureDir(DATA_DIR);
  ensureDir(TMP_DIR);

  const zipBuf = await download(GTFS_URL);
  const hash = `sha256:${sha256(zipBuf)}`;

  const zipPath = path.join(TMP_DIR, "gtfs.zip");
  fs.writeFileSync(zipPath, zipBuf);

  const zip = new AdmZip(zipPath);

  const routesRows = readCsvFromZip(zip, "routes.txt");
  const stopsRows = readCsvFromZip(zip, "stops.txt");

  const routes: Route[] = routesRows.map((r: any) => ({
    id: String(r.route_id ?? ""),
    shortName: String(r.route_short_name ?? ""),
    longName: String(r.route_long_name ?? ""),
    type: r.route_type !== undefined && r.route_type !== "" ? Number(r.route_type) : null
  }))
  .filter(r => r.id);

  const stops: Stop[] = stopsRows.map((s: any) => ({
    id: String(s.stop_id ?? ""),
    name: String(s.stop_name ?? ""),
    lat: Number(s.stop_lat),
    lon: Number(s.stop_lon)
  }))
  .filter(s => s.id && Number.isFinite(s.lat) && Number.isFinite(s.lon));

  routes.sort((a, b) => (a.shortName || a.longName).localeCompare(b.shortName || b.longName));
  stops.sort((a, b) => a.name.localeCompare(b.name));

  const routesFile = path.join(DATA_DIR, "routes.json");
  const stopsFile = path.join(DATA_DIR, "stops.json");
  writeJson(routesFile, routes);
  writeJson(stopsFile, stops);

  const now = new Date().toISOString();

  const latest: Latest = {
    updatedAt: now,
    source: GTFS_URL,
    hash,
    files: { routes: "routes.json", stops: "stops.json" },
    counts: { routes: routes.length, stops: stops.length }
  };

  writeJson(path.join(DATA_DIR, "latest.json"), latest);

  const history = readJson<any[]>(path.join(DATA_DIR, "history.json"), []);
  history.unshift({ updatedAt: now, hash, counts: latest.counts });
  writeJson(path.join(DATA_DIR, "history.json"), history.slice(0, 60));

  console.log("Done:");
  console.log(`- routes: ${routes.length}`);
  console.log(`- stops: ${stops.length}`);
  console.log(`- latest hash: ${hash}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});