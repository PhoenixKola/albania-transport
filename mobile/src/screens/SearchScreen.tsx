import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { readCachedJson } from "../feed/FeedService";
import type { Route, Stop } from "../types/feed";
import { useLang } from "../hooks/useLang";
import { I18N } from "../i18n";

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
      .filter(r => `${r.shortName} ${r.longName}`.toLowerCase().includes(s))
      .slice(0, 25);

    const stopHits = stops
      .filter(st => st.name.toLowerCase().includes(s))
      .slice(0, 25);

    return [
      { k: "hr", kind: "header", title: `${t.routesCount} (${routeHits.length})` },
      ...routeHits.map(r => ({ k: `r:${r.id}`, kind: "route" as const, r })),
      { k: "hs", kind: "header", title: `${t.stopsCount} (${stopHits.length})` },
      ...stopHits.map(st => ({ k: `s:${st.id}`, kind: "stop" as const, s: st }))
    ];
  }, [q, routes, stops, t]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>{t.back}</Text>
        </Pressable>

        <Text style={{ marginTop: 10, color: "white", fontSize: 20, fontWeight: "800" }}>{t.search}</Text>

        <View style={{ marginTop: 12, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={`${t.search}…`}
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={{ paddingHorizontal: 14, paddingVertical: 12, color: "white", fontSize: 16 }}
            autoFocus
          />
        </View>
      </View>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={rows}
        keyExtractor={(x) => x.k}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          if (item.kind === "header") return <Text style={{ color: "rgba(255,255,255,0.65)" }}>{item.title}</Text>;

          if (item.kind === "route") {
            const r = item.r;
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

          const st = item.s;
          return (
            <Pressable
              onPress={() => navigation.navigate("Stop", { stopId: st.id })}
              style={{ padding: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{st.name}</Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}