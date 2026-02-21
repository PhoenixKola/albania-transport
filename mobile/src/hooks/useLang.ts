import { useEffect, useState } from "react";
import type { Lang } from "../i18n";
import { getLang } from "../storage/prefs";

export function useLang() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    (async () => {
      setLang(await getLang());
    })();
  }, []);

  return { lang, setLang };
}