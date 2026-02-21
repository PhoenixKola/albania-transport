import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";

const GTFS_URL = "https://pt.tirana.al/gtfs/gtfs.zip";

const ROOT = path.resolve(process.cwd(), "..");
const DATA_DIR = path.join(ROOT, "data");
const TMP_DIR = path.join(ROOT, ".tmp");

type Latest = {
  updatedAt: string;
  source: string;
  hash: string;
  files: Record<string, string>;
  counts: Record<string, number>;
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

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function readCsvFromZip(zip: AdmZip, fileName: string): any[] {
  const entry = zip.getEntry(fileName);
  if (!entry) return [];
  const text = zip.readAsText(entry);
  return parse(text, { columns: true, skip_empty_lines: true, bom: true });
}

function toInt(v: any) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStr(v: any) {
  if (v === undefined || v === null) return "";
  return String(v);
}

function toTime(v: any) {
  const s = toStr(v).trim();
  return s || null;
}

async function main() {
  ensureDir(DATA_DIR);
  ensureDir(TMP_DIR);

  const zipBuf = await download(GTFS_URL);
  const hash = `sha256:${sha256(zipBuf)}`;

  const prevLatest = readJson<Latest | null>(path.join(DATA_DIR, "latest.json"), null);
  if (prevLatest?.hash === hash) {
    console.log("No change in gtfs.zip hash. Exiting.");
    return;
  }

  const zipPath = path.join(TMP_DIR, "gtfs.zip");
  fs.writeFileSync(zipPath, zipBuf);

  const zip = new AdmZip(zipPath);

  const routesRows = readCsvFromZip(zip, "routes.txt");
  const stopsRows = readCsvFromZip(zip, "stops.txt");
  const tripsRows = readCsvFromZip(zip, "trips.txt");
  const stopTimesRows = readCsvFromZip(zip, "stop_times.txt");
  const calendarRows = readCsvFromZip(zip, "calendar.txt");
  const calendarDatesRows = readCsvFromZip(zip, "calendar_dates.txt");
  const shapesRows = readCsvFromZip(zip, "shapes.txt");

  const routes = routesRows
    .map((r: any) => ({
      id: toStr(r.route_id),
      shortName: toStr(r.route_short_name),
      longName: toStr(r.route_long_name),
      type: toInt(r.route_type)
    }))
    .filter((r: any) => r.id);

  const stops = stopsRows
    .map((s: any) => ({
      id: toStr(s.stop_id),
      name: toStr(s.stop_name),
      lat: Number(s.stop_lat),
      lon: Number(s.stop_lon)
    }))
    .filter((s: any) => s.id && Number.isFinite(s.lat) && Number.isFinite(s.lon));

  const trips = tripsRows
    .map((t: any) => ({
      id: toStr(t.trip_id),
      routeId: toStr(t.route_id),
      serviceId: toStr(t.service_id),
      headsign: toStr(t.trip_headsign),
      directionId: toInt(t.direction_id),
      shapeId: toStr(t.shape_id)
    }))
    .filter((t: any) => t.id && t.routeId && t.serviceId);

  const stopTimesByTrip: Record<string, any[]> = {};
  const stopTimesByStop: Record<string, any[]> = {};

  for (const st of stopTimesRows) {
    const tripId = toStr(st.trip_id);
    const stopId = toStr(st.stop_id);
    const seq = Number(st.stop_sequence);

    if (!tripId || !stopId || !Number.isFinite(seq)) continue;

    const arrival = toTime(st.arrival_time);
    const departure = toTime(st.departure_time);

    (stopTimesByTrip[tripId] ||= []).push({ stopId, arrival, departure, seq });
    (stopTimesByStop[stopId] ||= []).push({ tripId, arrival, departure, seq });
  }

  for (const k of Object.keys(stopTimesByTrip)) {
    stopTimesByTrip[k] = stopTimesByTrip[k].sort((a, b) => a.seq - b.seq);
    if (!stopTimesByTrip[k].length) delete stopTimesByTrip[k];
  }

  for (const k of Object.keys(stopTimesByStop)) {
    stopTimesByStop[k] = stopTimesByStop[k].sort((a, b) => a.seq - b.seq);
    if (!stopTimesByStop[k].length) delete stopTimesByStop[k];
  }

  const routeTrips: Record<string, string[]> = {};
  for (const t of trips) (routeTrips[t.routeId] ||= []).push(t.id);

  const services = {
    calendar: calendarRows
      .map((c: any) => ({
        serviceId: toStr(c.service_id),
        monday: toInt(c.monday) === 1,
        tuesday: toInt(c.tuesday) === 1,
        wednesday: toInt(c.wednesday) === 1,
        thursday: toInt(c.thursday) === 1,
        friday: toInt(c.friday) === 1,
        saturday: toInt(c.saturday) === 1,
        sunday: toInt(c.sunday) === 1,
        startDate: toStr(c.start_date),
        endDate: toStr(c.end_date)
      }))
      .filter((x: any) => x.serviceId),
    calendarDates: calendarDatesRows
      .map((d: any) => ({
        serviceId: toStr(d.service_id),
        date: toStr(d.date),
        exceptionType: toInt(d.exception_type)
      }))
      .filter((x: any) => x.serviceId && x.date && (x.exceptionType === 1 || x.exceptionType === 2))
  };

  const shapesById: Record<string, Array<[number, number]>> = {};
  for (const s of shapesRows) {
    const shapeId = toStr(s.shape_id);
    const lat = Number(s.shape_pt_lat);
    const lon = Number(s.shape_pt_lon);
    const seq = Number(s.shape_pt_sequence);
    if (!shapeId || !Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(seq)) continue;
    (shapesById[shapeId] ||= []).push([seq, lat, lon] as any);
  }
  for (const k of Object.keys(shapesById)) {
    const pts = shapesById[k] as any[];
    pts.sort((a, b) => a[0] - b[0]);
    shapesById[k] = pts.map(p => [p[1], p[2]]);
    if (!shapesById[k].length) delete shapesById[k];
  }

  routes.sort((a, b) => (a.shortName || a.longName).localeCompare(b.shortName || b.longName));
  stops.sort((a, b) => a.name.localeCompare(b.name));

  writeJson(path.join(DATA_DIR, "routes.json"), routes);
  writeJson(path.join(DATA_DIR, "stops.json"), stops);
  writeJson(path.join(DATA_DIR, "trips.json"), trips);
  writeJson(path.join(DATA_DIR, "stop_times_by_trip.json"), stopTimesByTrip);
  writeJson(path.join(DATA_DIR, "stop_times_by_stop.json"), stopTimesByStop);
  writeJson(path.join(DATA_DIR, "route_trips.json"), routeTrips);
  writeJson(path.join(DATA_DIR, "services.json"), services);
  writeJson(path.join(DATA_DIR, "shapes.json"), shapesById);

  const now = new Date().toISOString();

  const latest: Latest = {
    updatedAt: now,
    source: GTFS_URL,
    hash,
    files: {
      routes: "routes.json",
      stops: "stops.json",
      trips: "trips.json",
      stopTimesByTrip: "stop_times_by_trip.json",
      stopTimesByStop: "stop_times_by_stop.json",
      routeTrips: "route_trips.json",
      services: "services.json",
      shapes: "shapes.json"
    },
    counts: {
      routes: routes.length,
      stops: stops.length,
      trips: trips.length,
      tripsWithStopTimes: Object.keys(stopTimesByTrip).length,
      stopsWithTimes: Object.keys(stopTimesByStop).length,
      shapes: Object.keys(shapesById).length
    }
  };

  writeJson(path.join(DATA_DIR, "latest.json"), latest);

  const history = readJson<any[]>(path.join(DATA_DIR, "history.json"), []);
  history.unshift({ updatedAt: now, hash, counts: latest.counts });
  writeJson(path.join(DATA_DIR, "history.json"), history.slice(0, 60));

  console.log("Built feed:", latest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});