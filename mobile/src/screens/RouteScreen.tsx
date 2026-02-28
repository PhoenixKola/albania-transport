import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { readCachedJson } from "../feed/FeedService";
import type { Route, RouteTrips, Stop, StopTimesByTrip, Trip } from "../types/feed";
import { getFavorites, toggleFavoriteRoute } from "../storage/favorites";
import { useLang } from "../hooks/useLang";
import { I18N } from "../i18n";

import { UI } from "../ui/ui";
import { AnimatedPressable } from "../ui/ui";
import { TopBar, ListItem, EmptyState } from "../ui/components";

export default function RouteScreen({ route, navigation }: any) {
  const { lang } = useLang();
  const t = I18N[lang];

  const routeId: string = route.params.routeId;

  const [loading, setLoading] = useState(true);
  const [r, setR] = useState<Route | null>(null);
  const [stopsMap, setStopsMap] = useState<Record<string, Stop>>({});
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stopIdsOrdered, setStopIdsOrdered] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    (async () => {
      const f = await getFavorites();
      setIsFav(f.routes.includes(routeId));
    })();
  }, [routeId]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const routes = await readCachedJson<Route[]>("routes.json");
        const stops = await readCachedJson<Stop[]>("stops.json");
        const trips = await readCachedJson<Trip[]>("trips.json");
        const routeTrips = await readCachedJson<RouteTrips>("route_trips.json");
        const stopTimesByTrip = await readCachedJson<StopTimesByTrip>("stop_times_by_trip.json");

        const rr = routes.find((x) => x.id === routeId) || null;
        setR(rr);

        const map: Record<string, Stop> = {};
        for (const s of stops) map[s.id] = s;
        setStopsMap(map);

        const tripIds = routeTrips[routeId] || [];
        if (!tripIds.length) {
          setError(lang === "sq" ? "S’u gjetën udhëtime për këtë linjë." : "No trips found for this route.");
          return;
        }

        const tt = trips.find((x) => x.id === tripIds[0]) || null;
        setTrip(tt);

        const times = stopTimesByTrip[tripIds[0]] || [];
        if (!times.length) {
          setError(lang === "sq" ? "S’u gjetën orare për këtë linjë." : "No stop times found for this route.");
          return;
        }

        setStopIdsOrdered(times.map((x) => x.stopId));
      } catch (e: any) {
        setError(e?.message || (lang === "sq" ? "Dështoi ngarkimi i linjës." : "Failed to load route."));
      } finally {
        setLoading(false);
      }
    })();
  }, [routeId, lang]);

  const title = useMemo(() => {
    if (!r) return t.route;
    const left = (r.shortName || "—").trim();
    return r.longName ? `${left} • ${r.longName}` : left;
  }, [r, t.route]);

  const headerRight = (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <AnimatedPressable
        onPress={async () => {
          const next = await toggleFavoriteRoute(routeId);
          setIsFav(next.routes.includes(routeId));
        }}
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
        <Ionicons name={isFav ? "star" : "star-outline"} size={16} color={UI.text} />
        <Text style={{ color: UI.text, fontWeight: "900" }}>{isFav ? t.favorited : t.favorite}</Text>
      </AnimatedPressable>

      <AnimatedPressable
        onPress={() => navigation.navigate("RouteMap", { routeId })}
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
        <Ionicons name="map-outline" size={16} color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "900" }}>{t.map}</Text>
      </AnimatedPressable>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.bg0 }} edges={["top", "left", "right"]}>
      <TopBar title={title} subtitle={trip?.headsign ? `${lang === "sq" ? "Destinacioni: " : "Headsign: "}${trip.headsign}` : undefined} leftLabel={t.back} onBack={() => navigation.goBack()} right={headerRight} />

      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name="location-outline" size={16} color={UI.muted2} />
          <Text style={{ color: UI.muted, fontWeight: "900" }}>{t.stopsTitle}</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : error ? (
        <EmptyState icon="warning-outline" title={error} subtitle={lang === "sq" ? "Provo rifreskimin." : "Try refreshing."} cta={t.refresh} onPress={() => navigation.goBack()} />
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          data={stopIdsOrdered}
          keyExtractor={(id, idx) => `${id}-${idx}`}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item, index }) => {
            const s = stopsMap[item];
            return (
              <ListItem
                onPress={() => navigation.navigate("Stop", { stopId: item })}
                title={s?.name || item}
                subtitle={`${lang === "sq" ? "Stacioni " : "Stop "}${index + 1}`}
                icon="pin-outline"
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}