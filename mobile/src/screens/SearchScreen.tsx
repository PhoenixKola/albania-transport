import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { readCachedJson } from "../feed/FeedService";
import type { Route, Stop } from "../types/feed";
import { useLang } from "../hooks/useLang";
import { I18N } from "../i18n";

import { UI } from "../ui/ui";
import { TopBar, ListItem, EmptyState, SearchInput } from "../ui/components";

type Row =
  | { k: string; kind: "header"; title: string }
  | { k: string; kind: "route"; r: Route }
  | { k: string; kind: "stop"; s: Stop };

export default function SearchScreen({ navigation }: any) {
  const { lang } = useLang();
  const t = I18N[lang];

  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setRoutes(await readCachedJson<Route[]>("routes.json"));
      setStops(await readCachedJson<Stop[]>("stops.json"));
    })();
  }, []);

  const rows = useMemo<Row[]>(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [{ k: "h1", kind: "header", title: t.typeToSearch }];

    const routeHits = routes
      .filter((r) => `${r.shortName} ${r.longName}`.toLowerCase().includes(s))
      .slice(0, 25);

    const stopHits = stops.filter((st) => st.name.toLowerCase().includes(s)).slice(0, 25);

    return [
      { k: "hr", kind: "header", title: `${t.routesCount} (${routeHits.length})` },
      ...routeHits.map((r) => ({ k: `r:${r.id}`, kind: "route" as const, r })),
      { k: "hs", kind: "header", title: `${t.stopsCount} (${stopHits.length})` },
      ...stopHits.map((st) => ({ k: `s:${st.id}`, kind: "stop" as const, s: st }))
    ];
  }, [q, routes, stops, t]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.bg0 }} edges={["top", "left", "right"]}>
      <TopBar title={t.search} subtitle={t.typeToSearch} leftLabel={t.back} onBack={() => navigation.goBack()} />

      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <SearchInput value={q} onChangeText={setQ} placeholder={`${t.search}…`} autoFocus />
      </View>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={rows}
        keyExtractor={(x) => x.k}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          if (item.kind === "header") {
            return (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
                <Ionicons name="information-circle-outline" size={16} color={UI.muted2} />
                <Text style={{ color: UI.muted, fontWeight: "900" }}>{item.title}</Text>
              </View>
            );
          }

          if (item.kind === "route") {
            const r = item.r;
            return (
              <ListItem
                onPress={() => navigation.navigate("Route", { routeId: r.id })}
                title={`${(r.shortName || "—").trim()}${r.longName ? ` • ${r.longName}` : ""}`}
                icon="bus-outline"
              />
            );
          }

          const st = item.s;
          return <ListItem onPress={() => navigation.navigate("Stop", { stopId: st.id })} title={st.name} icon="location-outline" />;
        }}
        ListEmptyComponent={
          <EmptyState icon="search" title={t.noResults ?? "No results"} subtitle={t.typeToSearch} />
        }
      />
    </SafeAreaView>
  );
}