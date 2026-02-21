import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { readCachedJson, syncFeed } from "../feed/FeedService";
import type { Route } from "../types/feed";
import { getFavorites } from "../storage/favorites";
import { getLang, toggleLang } from "../storage/prefs";
import type { Lang } from "../i18n";
import { I18N } from "../i18n";

export default function RoutesScreen({ navigation }: any) {
  const [lang, setLang] = useState<Lang>("en");
  const t = I18N[lang];

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<string>("Syncing…");
  const [mode, setMode] = useState<"online" | "offline">("online");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [favRouteIds, setFavRouteIds] = useState<string[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    setSyncing(true);
    try {
      const res = await syncFeed();
      setMode(res.mode);

      const label = res.updated ? t.updated : t.upToDate;
      setStatus(`${label} • ${new Date(res.latest.updatedAt).toLocaleString()}`);

      const f = await getFavorites();
      setFavRouteIds(f.routes);

      const routesData = await readCachedJson<Route[]>("routes.json");
      setRoutes(routesData);
    } catch (e: any) {
      setMode("offline");
      setStatus(t.offlineMode);
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLang(await getLang());
      await load();
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? routes.filter(r => `${r.shortName} ${r.longName}`.toLowerCase().includes(s)) : routes;

    const favSet = new Set(favRouteIds);
    const fav = list.filter(r => favSet.has(r.id));
    const rest = list.filter(r => !favSet.has(r.id));
    return [...fav, ...rest];
  }, [routes, q, favRouteIds]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "800" }}>{t.appTitle}</Text>
            <Text style={{ marginTop: 6, color: "rgba(255,255,255,0.7)" }}>
              {mode === "offline" ? t.offlineMode : status}
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <Pressable onPress={() => navigation.navigate("Search")} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(59,130,246,0.9)" }}>
                <Text style={{ color: "white", fontWeight: "700" }}>{t.search}</Text>
              </Pressable>

              <Pressable onPress={() => navigation.navigate("Stops", { lang })} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
                <Text style={{ color: "white", fontWeight: "700" }}>{t.stops}</Text>
              </Pressable>

              <Pressable onPress={() => navigation.navigate("Nearby")} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
                <Text style={{ color: "white", fontWeight: "700" }}>{t.nearby}</Text>
              </Pressable>

              <Pressable onPress={() => navigation.navigate("Favorites")} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
                <Text style={{ color: "white", fontWeight: "700" }}>{t.favorites}</Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  const next = await toggleLang();
                  setLang(next);
                }}
                style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
              >
                <Text style={{ color: "white", fontWeight: "800" }}>{lang.toUpperCase()}</Text>
              </Pressable>
            </View>
          </View>

          <Pressable onPress={load} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
            <Text style={{ color: "white", fontWeight: "700" }}>{syncing ? "…" : t.refresh}</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 14, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t.searchRoutes}
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={{ paddingHorizontal: 14, paddingVertical: 12, color: "white", fontSize: 16 }}
          />
        </View>

        {mode === "offline" ? (
          <View style={{ marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: "rgba(245,158,11,0.15)", borderWidth: 1, borderColor: "rgba(245,158,11,0.35)" }}>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: "700" }}>{t.offlineMode}</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="white" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const fav = favRouteIds.includes(item.id);
            return (
              <Pressable
                onPress={() => navigation.navigate("Route", { routeId: item.id })}
                style={{ padding: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                  {fav ? "★ " : ""}
                  {(item.shortName || "—").trim()}
                  {item.longName ? ` • ${item.longName}` : ""}
                </Text>
                <Text style={{ marginTop: 6, color: "rgba(255,255,255,0.65)" }}>Type: {item.type ?? "—"}</Text>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}