import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Lang } from "../i18n";

const LANG_KEY = "prefs:lang:v1";

export async function getLang(): Promise<Lang> {
  const raw = await AsyncStorage.getItem(LANG_KEY);
  return raw === "sq" ? "sq" : "en";
}

export async function setLang(lang: Lang) {
  await AsyncStorage.setItem(LANG_KEY, lang);
}

export async function toggleLang() {
  const cur = await getLang();
  const next: Lang = cur === "en" ? "sq" : "en";
  await setLang(next);
  return next;
}