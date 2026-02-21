import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { readCachedJson } from "../feed/FeedService";
import type { Route, Services, Stop, StopTimesByStop, Trip } from "../types/feed";
import { isServiceActiveOnDate, minutesToLabel, upcomingOccurrencesForTime } from "../utils/schedule";
import { getFavorites, toggleFavoriteStop } from "../storage/favorites";
import { useLang } from "../hooks/useLang";
import { I18N } from "../i18n";

type DepartureRow = {
  label: string;
  inMinutes: number;
  headsign: string;
  routeLabel: string;
  tripId: string;
};

export default function StopScreen({ route, navigation }: any) {
  const { lang } = useLang();
  const t = I18N[lang];

  const stopId: string = route.params.stopId;

  const [loading, setLoading] = useState(true);
  const [stop, setStop] = useState<Stop | null>(null);
  const [rows, setRows] = useState<DepartureRow[]>([]);
  const [routeChips, setRouteChips] = useState<Array<{ id: string; label: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    (async () => {
      const f = await getFavorites();
      setIsFav(f.stops.includes(stopId));
    })();
  }, [stopId]);

  useEffect(() => {
    (async () => {
      try {
        const now = new Date();

        const stops = await readCachedJson<Stop[]>("stops.json");
        const trips = await readCachedJson<Trip[]>("trips.json");
        const routes = await readCachedJson<Route[]>("routes.json");
        const services = await readCachedJson<Services>("services.json");
        const stopTimesByStop = await readCachedJson<StopTimesByStop>("stop_times_by_stop.json");

        const s = stops.find((x) => x.id === stopId) || null;
        setStop(s);

        const times = stopTimesByStop[stopId] || [];
        if (!times.length) {
          setError(lang === "sq" ? "Nuk u gjetën nisje të planifikuara për këtë stacion." : "No scheduled departures found for this stop.");
          return;
        }

        const tripsMap: Record<string, Trip> = {};
        for (const tt of trips) tripsMap[tt.id] = tt;

        const routesMap: Record<string, Route> = {};
        for (const rr of routes) routesMap[rr.id] = rr;

        const routeSet = new Set<string>();
        for (const tt of times) {
          const trip = tripsMap[tt.tripId];
          if (!trip) continue;
          routeSet.add(trip.routeId);
        }
        const chips = Array.from(routeSet)
          .map((id) => {
            const rr = routesMap[id];
            const label = (rr?.shortName || rr?.longName || id).trim();
            return { id, label };
          })
          .sort((a, b) => a.label.localeCompare(b.label));
        setRouteChips(chips);

        const out: DepartureRow[] = [];

        for (const tt of times) {
          const trip = tripsMap[tt.tripId];
          if (!trip) continue;
          if (!isServiceActiveOnDate(services, trip.serviceId, now)) continue;

          const time = (tt.departure || tt.arrival || "").trim();
          if (!time) continue;

          const occ = upcomingOccurrencesForTime(time, now);
          const departureMins = occ.minutes;
          const nowMins = now.getHours() * 60 + now.getMinutes();
          const diff =
            occ.dayOffset === 0
              ? departureMins - nowMins
              : 24 * 60 - nowMins + (departureMins % (24 * 60));
          if (diff < 0) continue;

          const rr = routesMap[trip.routeId];
          const routeLabel = (rr?.shortName || rr?.longName || trip.routeId).trim();
          const headsign = trip.headsign || (rr?.longName ?? "");

          const label = minutesToLabel(departureMins);
          out.push({
            label: occ.dayOffset === 1 ? `${label} (${lang === "sq" ? "nesër" : "tomorrow"})` : label,
            inMinutes: diff,
            headsign,
            routeLabel,
            tripId: trip.id
          });
        }

        out.sort((a, b) => a.inMinutes - b.inMinutes);
        setRows(out.slice(0, 20));
      } catch (e: any) {
        setError(e?.message || (lang === "sq" ? "Dështoi ngarkimi i stacionit." : "Failed to load stop."));
      } finally {
        setLoading(false);
      }
    })();
  }, [stopId, lang]);

  const title = useMemo(() => stop?.name || t.stop, [stop, t.stop]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>{t.back}</Text>
        </Pressable>

        <Text style={{ marginTop: 10, color: "white", fontSize: 20, fontWeight: "800" }}>{title}</Text>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <Pressable
            onPress={async () => {
              const next = await toggleFavoriteStop(stopId);
              setIsFav(next.stops.includes(stopId));
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
            <Text style={{ color: "white", fontWeight: "700" }}>
              {isFav ? t.favorited : t.favorite}
            </Text>
          </Pressable>
        </View>

        {routeChips.length ? (
          <View style={{ marginTop: 14 }}>
            <Text style={{ color: "rgba(255,255,255,0.65)", marginBottom: 10 }}>{t.routesServingStop}</Text>
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              {routeChips.slice(0, 20).map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => navigation.navigate("Route", { routeId: c.id })}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)"
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={{ marginTop: 16, color: "rgba(255,255,255,0.65)" }}>{t.nextDepartures}</Text>
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
          data={rows}
          keyExtractor={(x) => `${x.tripId}-${x.label}`}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 14,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)"
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>{item.label}</Text>
                <Text style={{ color: "rgba(255,255,255,0.75)" }}>{item.inMinutes} min</Text>
              </View>

              <Text style={{ marginTop: 6, color: "rgba(255,255,255,0.9)", fontWeight: "700" }}>
                {item.routeLabel}
                {item.headsign ? ` • ${item.headsign}` : ""}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}