import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { readCachedJson } from "../feed/FeedService";
import type { Route, Stop } from "../types/feed";
import { getFavorites } from "../storage/favorites";

export default function FavoritesScreen({ navigation }: any) {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>← Back</Text>
        </Pressable>
        <Text style={{ marginTop: 10, color: "white", fontSize: 20, fontWeight: "800" }}>Favorites</Text>
      </View>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={[{ k: "routes" }, ...routeItems.map(r => ({ k: `r:${r.id}`, r })), { k: "stops" }, ...stopItems.map(s => ({ k: `s:${s.id}`, s }))]}
        keyExtractor={(x: any) => x.k}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }: any) => {
          if (item.k === "routes") return <Text style={{ color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Routes</Text>;
          if (item.k === "stops") return <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 10, marginBottom: 4 }}>Stops</Text>;

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