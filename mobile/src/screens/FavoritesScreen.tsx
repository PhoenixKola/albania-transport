import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { readCachedJson } from "../feed/FeedService";
import type { Route, Stop } from "../types/feed";
import { getFavorites } from "../storage/favorites";
import { useLang } from "../hooks/useLang";
import { I18N } from "../i18n";

export default function FavoritesScreen({ navigation }: any) {
  const { lang } = useLang();
  const t = I18N[lang];

  const [tab, setTab] = useState<"routes" | "stops">("routes");
  const [favRoutes, setFavRoutes] = useState<string[]>([]);
  const [favStops, setFavStops] = useState<string[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    (async () => {
      const f = await getFavorites();
      setFavRoutes(f.routes);
      setFavStops(f.stops);
      setRoutes(await readCachedJson<Route[]>("routes.json"));
      setStops(await readCachedJson<Stop[]>("stops.json"));
    })();
  }, []);

  const routeItems = useMemo(() => routes.filter(r => favRoutes.includes(r.id)), [routes, favRoutes]);
  const stopItems = useMemo(() => stops.filter(s => favStops.includes(s.id)), [stops, favStops]);

  const data = tab === "routes" ? routeItems.map(r => ({ k: `r:${r.id}`, r })) : stopItems.map(s => ({ k: `s:${s.id}`, s }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>{t.back}</Text>
        </Pressable>

        <Text style={{ marginTop: 10, color: "white", fontSize: 20, fontWeight: "800" }}>{t.favorites}</Text>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          <Pressable
            onPress={() => setTab("routes")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: tab === "routes" ? "rgba(59,130,246,0.9)" : "rgba(255,255,255,0.10)",
              borderWidth: tab === "routes" ? 0 : 1,
              borderColor: "rgba(255,255,255,0.12)"
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>{t.routes}</Text>
          </Pressable>

          <Pressable
            onPress={() => setTab("stops")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: tab === "stops" ? "rgba(59,130,246,0.9)" : "rgba(255,255,255,0.10)",
              borderWidth: tab === "stops" ? 0 : 1,
              borderColor: "rgba(255,255,255,0.12)"
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>{t.stops}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={data}
        keyExtractor={(x: any) => x.k}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>{t.noFavorites}</Text>
          </View>
        }
        renderItem={({ item }: any) => {
          if (item.r) {
            const r = item.r as Route;
            return (
              <Pressable
                onPress={() => navigation.navigate("Route", { routeId: r.id })}
                style={{ padding: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                  {(r.shortName || "—").trim()}
                  {r.longName ? ` • ${r.longName}` : ""}
                </Text>
              </Pressable>
            );
          }

          const s = item.s as Stop;
          return (
            <Pressable
              onPress={() => navigation.navigate("Stop", { stopId: s.id })}
              style={{ padding: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{s.name}</Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}