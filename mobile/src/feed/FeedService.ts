import * as FileSystem from "expo-file-system/legacy";
import { FEED_BASE_URL } from "../config";

const DIR = `${FileSystem.documentDirectory}feed/`;
const META_PATH = `${DIR}meta.json`;

type Latest = {
  updatedAt: string;
  source: string;
  hash: string;
  files: Record<string, string>;
  counts: Record<string, number>;
};

type Meta = {
  hash: string;
  updatedAt: string;
  files: Record<string, string>;
};

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

async function readMeta(): Promise<Meta | null> {
  const info = await FileSystem.getInfoAsync(META_PATH);
  if (!info.exists) return null;
  const txt = await FileSystem.readAsStringAsync(META_PATH);
  return JSON.parse(txt) as Meta;
}

async function writeMeta(meta: Meta) {
  await FileSystem.writeAsStringAsync(META_PATH, JSON.stringify(meta));
}

async function downloadJson(url: string, localPath: string) {
  const res = await fetch(url, { cache: "no-store" as any });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  const txt = await res.text();
  await FileSystem.writeAsStringAsync(localPath, txt);
}

async function fileExists(name: string) {
  const info = await FileSystem.getInfoAsync(`${DIR}${name}`);
  return info.exists;
}

export async function syncFeed(): Promise<{ latest: Latest; updated: boolean; mode: "online" | "offline" }> {
  await ensureDir();

  const cached = await readMeta();

  let latest: Latest | null = null;
  try {
    const latestRes = await fetch(`${FEED_BASE_URL}/latest.json?t=${Date.now()}`, { cache: "no-store" as any });
    if (!latestRes.ok) throw new Error(`Failed latest.json: ${latestRes.status}`);
    latest = (await latestRes.json()) as Latest;
  } catch {
    if (!cached) throw new Error("Failed to load feed and no cached data exists.");
    const offlineLatest: Latest = {
      updatedAt: cached.updatedAt,
      source: "",
      hash: cached.hash,
      files: cached.files,
      counts: {}
    };
    return { latest: offlineLatest, updated: false, mode: "offline" };
  }

  const requiredFiles = Object.values(latest.files);
  const missing: string[] = [];
  for (const f of requiredFiles) {
    if (!(await fileExists(f))) missing.push(f);
  }

  const alreadyHave = cached?.hash === latest.hash && missing.length === 0;

  if (alreadyHave) {
    return { latest, updated: false, mode: "online" };
  }

  const entries = Object.entries(latest.files);
  for (const [, fileName] of entries) {
    await downloadJson(`${FEED_BASE_URL}/${fileName}`, `${DIR}${fileName}`);
  }

  await writeMeta({ hash: latest.hash, updatedAt: latest.updatedAt, files: latest.files });

  return { latest, updated: true, mode: "online" };
}

export async function readCachedJson<T>(fileName: string): Promise<T> {
  await ensureDir();
  const p = `${DIR}${fileName}`;
  const info = await FileSystem.getInfoAsync(p);
  if (!info.exists) throw new Error(`Missing cached file: ${fileName}`);
  const txt = await FileSystem.readAsStringAsync(p);
  return JSON.parse(txt) as T;
}