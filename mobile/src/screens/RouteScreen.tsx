import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { readCachedJson } from "../feed/FeedService";
import type { Route, RouteTrips, Stop, StopTimesByTrip, Trip } from "../types/feed";
import { getFavorites, toggleFavoriteRoute } from "../storage/favorites";
import { useLang } from "../hooks/useLang";
import { I18N } from "../i18n";

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>{t.back}</Text>
        </Pressable>

        <Text style={{ marginTop: 10, color: "white", fontSize: 20, fontWeight: "800" }}>{title}</Text>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          <Pressable
            onPress={async () => {
              const next = await toggleFavoriteRoute(routeId);
              setIsFav(next.routes.includes(routeId));
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.10)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)"
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>{isFav ? t.favorited : t.favorite}</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("RouteMap", { routeId })}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: "rgba(59,130,246,0.9)"
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>{t.map}</Text>
          </Pressable>
        </View>

        {trip?.headsign ? (
          <Text style={{ marginTop: 10, color: "rgba(255,255,255,0.65)" }}>
            {lang === "sq" ? "Destinacioni: " : "Headsign: "}
            {trip.headsign}
          </Text>
        ) : null}

        <Text style={{ marginTop: 10, color: "rgba(255,255,255,0.65)" }}>{t.stopsTitle}</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="white" />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "rgba(255,255,255,0.8)" }}>{error}</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          data={stopIdsOrdered}
          keyExtractor={(id, idx) => `${id}-${idx}`}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item, index }) => {
            const s = stopsMap[item];
            return (
              <Pressable
                onPress={() => navigation.navigate("Stop", { stopId: item })}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)"
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>
                  {lang === "sq" ? "Stacioni " : "Stop "}
                  {index + 1}
                </Text>
                <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{s?.name || item}</Text>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}