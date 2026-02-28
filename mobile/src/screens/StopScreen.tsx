import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { readCachedJson } from "../feed/FeedService";
import type { Route, Services, Stop, StopTimesByStop, Trip } from "../types/feed";
import { isServiceActiveOnDate, minutesToLabel, upcomingOccurrencesForTime } from "../utils/schedule";
import { getFavorites, toggleFavoriteStop } from "../storage/favorites";
import { useLang } from "../hooks/useLang";
import { I18N } from "../i18n";

import { UI } from "../ui/ui";
import { AnimatedPressable } from "../ui/ui";
import { TopBar, EmptyState, ListItem } from "../ui/components";

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
        setLoading(true);
        setError(null);

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
            occ.dayOffset === 0 ? departureMins - nowMins : 24 * 60 - nowMins + (departureMins % (24 * 60));
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

  const headerRight = (
    <AnimatedPressable
      onPress={async () => {
        const next = await toggleFavoriteStop(stopId);
        setIsFav(next.stops.includes(stopId));
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
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.bg0 }} edges={["top", "left", "right"]}>
      <TopBar title={title} subtitle={t.nextDepartures} leftLabel={t.back} onBack={() => navigation.goBack()} right={headerRight} />

      {routeChips.length ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <Text style={{ color: UI.muted, fontWeight: "900", marginBottom: 10 }}>{t.routesServingStop}</Text>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            {routeChips.slice(0, 20).map((c) => (
              <AnimatedPressable
                key={c.id}
                onPress={() => navigation.navigate("Route", { routeId: c.id })}
                contentStyle={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: UI.card2,
                  borderWidth: 1,
                  borderColor: UI.border
                }}
                scaleIn={0.98}
              >
                <Ionicons name="bus-outline" size={14} color={UI.text} />
                <Text style={{ color: UI.text, fontWeight: "900" }}>{c.label}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : error ? (
        <EmptyState icon="warning-outline" title={error} subtitle={lang === "sq" ? "Provo përsëri më vonë." : "Try again later."} />
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          data={rows}
          keyExtractor={(x) => `${x.tripId}-${x.label}`}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={<EmptyState icon="time-outline" title={t.noDepartures ?? "No departures"} subtitle={t.nextDepartures} />}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 14,
                borderRadius: 18,
                backgroundColor: UI.card,
                borderWidth: 1,
                borderColor: UI.border
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <Text style={{ color: UI.text, fontSize: 18, fontWeight: "900" }}>{item.label}</Text>
                <Text style={{ color: UI.muted, fontWeight: "900" }}>{item.inMinutes} min</Text>
              </View>

              <Text style={{ marginTop: 8, color: UI.text, fontWeight: "900" }}>
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