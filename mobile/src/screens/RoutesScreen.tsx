import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { readCachedJson, syncFeed } from "../feed/FeedService";
import type { Route } from "../types/feed";
import { getFavorites } from "../storage/favorites";
import { getLang, toggleLang } from "../storage/prefs";
import type { Lang } from "../i18n";
import { I18N } from "../i18n";

import { UI } from "../ui/ui";
import { TopBar, ListItem, EmptyState, SearchInput } from "../ui/components";
import { AnimatedPressable } from "../ui/ui";

export default function RoutesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [lang, setLang] = useState<Lang>("en");
  const t = I18N[lang];

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<string>("");
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
    } catch {
      setMode("offline");
      setStatus(t.offlineMode);
      const f = await getFavorites();
      setFavRouteIds(f.routes);
      const routesData = await readCachedJson<Route[]>("routes.json");
      setRoutes(routesData);
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
    const list = s ? routes.filter((r) => `${r.shortName} ${r.longName}`.toLowerCase().includes(s)) : routes;

    const favSet = new Set(favRouteIds);
    const fav = list.filter((r) => favSet.has(r.id));
    const rest = list.filter((r) => !favSet.has(r.id));
    return [...fav, ...rest];
  }, [routes, q, favRouteIds]);

  const headerRight = (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
      <AnimatedPressable
        onPress={async () => {
          const next = await toggleLang();
          setLang(next);
        }}
        style={{}}
        contentStyle={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 16,
          backgroundColor: UI.card2,
          borderWidth: 1,
          borderColor: UI.border
        }}
        scaleIn={0.98}
      >
        <Ionicons name="globe-outline" size={16} color={UI.text} />
        <Text style={{ color: UI.text, fontWeight: "900" }}>{lang.toUpperCase()}</Text>
      </AnimatedPressable>

      <AnimatedPressable
        onPress={load}
        disabled={syncing}
        style={{ opacity: syncing ? 0.7 : 1 }}
        contentStyle={{
          width: 44,
          height: 44,
          borderRadius: 16,
          backgroundColor: UI.accent,
          alignItems: "center",
          justifyContent: "center"
        }}
        scaleIn={0.98}
      >
        {syncing ? <ActivityIndicator color="#fff" /> : <Ionicons name="refresh" size={18} color="#fff" />}
      </AnimatedPressable>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.bg0 }} edges={["top", "left", "right"]}>
      <View style={{ paddingTop: insets.top }}>
        <TopBar
          title={t.appTitle}
          subtitle={mode === "offline" ? t.offlineMode : status || t.loading}
          // leftLabel=""
          // onBack={undefined}
          right={headerRight}
        />

        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            <AnimatedPressable
              onPress={() => navigation.navigate("Search")}
              style={{}}
              contentStyle={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: UI.accent
              }}
              scaleIn={0.98}
            >
              <Ionicons name="search" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "900" }}>{t.search}</Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => navigation.navigate("Stops", { lang })}
              style={{}}
              contentStyle={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: UI.card2,
                borderWidth: 1,
                borderColor: UI.border
              }}
              scaleIn={0.98}
            >
              <Ionicons name="list" size={16} color={UI.text} />
              <Text style={{ color: UI.text, fontWeight: "900" }}>{t.stops}</Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => navigation.navigate("Nearby")}
              style={{}}
              contentStyle={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: UI.card2,
                borderWidth: 1,
                borderColor: UI.border
              }}
              scaleIn={0.98}
            >
              <Ionicons name="navigate" size={16} color={UI.text} />
              <Text style={{ color: UI.text, fontWeight: "900" }}>{t.nearby}</Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => navigation.navigate("Favorites")}
              style={{}}
              contentStyle={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: UI.card2,
                borderWidth: 1,
                borderColor: UI.border
              }}
              scaleIn={0.98}
            >
              <Ionicons name="star" size={16} color={UI.text} />
              <Text style={{ color: UI.text, fontWeight: "900" }}>{t.favorites}</Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => navigation.navigate("Sources")}
              style={{}}
              contentStyle={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: UI.card2,
                borderWidth: 1,
                borderColor: UI.border
              }}
              scaleIn={0.98}
            >
              <Ionicons name="information-circle-outline" size={16} color={UI.text} />
              <Text style={{ color: UI.text, fontWeight: "900" }}>{t.sources}</Text>
            </AnimatedPressable>
          </View>

          <SearchInput value={q} onChangeText={setQ} placeholder={t.searchRoutes} />

          {mode === "offline" ? (
            <View
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 18,
                backgroundColor: UI.warnSoft,
                borderWidth: 1,
                borderColor: UI.warnBorder,
                flexDirection: "row",
                gap: 10,
                alignItems: "center"
              }}
            >
              <Ionicons name="cloud-offline-outline" size={18} color="rgba(255,255,255,0.9)" />
              <Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: "900" }}>{t.offlineMode}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ marginTop: 12, color: UI.muted, fontWeight: "800" }}>{t.loading}</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <EmptyState
              icon="bus-outline"
              title={t.noRoutes ?? "No routes"}
              subtitle={t.typeToSearch ?? "Try searching"}
              cta={t.refresh}
              onPress={load}
            />
          }
          renderItem={({ item }) => {
            const fav = favRouteIds.includes(item.id);
            const title = `${fav ? "★ " : ""}${(item.shortName || "—").trim()}${item.longName ? ` • ${item.longName}` : ""}`;

            return (
              <ListItem
                onPress={() => navigation.navigate("Route", { routeId: item.id })}
                title={title}
                subtitle={`Type: ${item.type ?? "—"}`}
                icon={fav ? "star" : "bus-outline"}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}