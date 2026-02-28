import React, { useEffect, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { readCachedJson } from "../feed/FeedService";
import type { Route, Stop } from "../types/feed";
import { getFavorites } from "../storage/favorites";
import { useLang } from "../hooks/useLang";
import { I18N } from "../i18n";

import { UI } from "../ui/ui";
import { TopBar, Tabs, ListItem, EmptyState } from "../ui/components";

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

  const routeItems = useMemo(() => routes.filter((r) => favRoutes.includes(r.id)), [routes, favRoutes]);
  const stopItems = useMemo(() => stops.filter((s) => favStops.includes(s.id)), [stops, favStops]);

  const data =
    tab === "routes"
      ? routeItems.map((r) => ({ k: `r:${r.id}`, r }))
      : stopItems.map((s) => ({ k: `s:${s.id}`, s }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.bg0 }} edges={["top", "left", "right"]}>
      <TopBar title={t.favorites} subtitle={tab === "routes" ? t.routes : t.stops} leftLabel={t.back} onBack={() => navigation.goBack()} />

      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as any)}
          items={[
            { key: "routes", label: t.routes, icon: "bus-outline" },
            { key: "stops", label: t.stops, icon: "location-outline" }
          ]}
        />
      </View>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={data}
        keyExtractor={(x: any) => x.k}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="star-outline"
            title={t.noFavorites}
            subtitle={tab === "routes" ? (lang === "sq" ? "Ruaj linjat që përdor shpesh." : "Save routes you use often.") : (lang === "sq" ? "Ruaj stacionet që përdor shpesh." : "Save stops you use often.")}
          />
        }
        renderItem={({ item }: any) => {
          if (item.r) {
            const r = item.r as Route;
            const title = `${(r.shortName || "—").trim()}${r.longName ? ` • ${r.longName}` : ""}`;

            return (
              <ListItem
                onPress={() => navigation.navigate("Route", { routeId: r.id })}
                title={title}
                subtitle={r.type ? `Type: ${r.type}` : undefined}
                icon="star"
                right={<Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />}
              />
            );
          }

          const s = item.s as Stop;
          return (
            <ListItem
              onPress={() => navigation.navigate("Stop", { stopId: s.id })}
              title={s.name}
              icon="star"
              right={<Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}