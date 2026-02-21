import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { readCachedJson } from "../feed/FeedService";
import type { Route, Services, Stop, StopTimesByStop, Trip } from "../types/feed";
import { isServiceActiveOnDate, minutesToLabel, upcomingOccurrencesForTime } from "../utils/schedule";

type DepartureRow = {
  label: string;
  inMinutes: number;
  headsign: string;
  tripId: string;
  dayOffset: number;
};

export default function StopScreen({ route, navigation }: any) {
  const stopId: string = route.params.stopId;

  const [loading, setLoading] = useState(true);
  const [stop, setStop] = useState<Stop | null>(null);
  const [rows, setRows] = useState<DepartureRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const now = new Date();

        const stops = await readCachedJson<Stop[]>("stops.json");
        const trips = await readCachedJson<Trip[]>("trips.json");
        const routes = await readCachedJson<Route[]>("routes.json");
        const services = await readCachedJson<Services>("services.json");
        const stopTimesByStop = await readCachedJson<StopTimesByStop>("stop_times_by_stop.json");

        const s = stops.find(x => x.id === stopId) || null;
        setStop(s);

        const times = stopTimesByStop[stopId] || [];
        if (!times.length) {
          setError("No scheduled departures found for this stop.");
          return;
        }

        const tripsMap: Record<string, Trip> = {};
        for (const t of trips) tripsMap[t.id] = t;

        const routesMap: Record<string, Route> = {};
        for (const r of routes) routesMap[r.id] = r;

        const out: DepartureRow[] = [];

        for (const t of times) {
          const trip = tripsMap[t.tripId];
          if (!trip) continue;

          if (!isServiceActiveOnDate(services, trip.serviceId, now)) continue;

          const time = (t.departure || t.arrival || "").trim();
          if (!time) continue;

          const occ = upcomingOccurrencesForTime(time, now);
          const departureMins = occ.minutes;
          const nowMins = now.getHours() * 60 + now.getMinutes();
          const diff = occ.dayOffset === 0 ? departureMins - nowMins : (24 * 60 - nowMins) + (departureMins % (24 * 60));

          if (diff < 0) continue;

          const label = minutesToLabel(departureMins);
          const headsign = trip.headsign || (routesMap[trip.routeId]?.longName ?? "");

          out.push({
            label: occ.dayOffset === 1 ? `${label} (tomorrow)` : label,
            inMinutes: diff,
            headsign,
            tripId: trip.id,
            dayOffset: occ.dayOffset
          });
        }

        out.sort((a, b) => a.inMinutes - b.inMinutes);

        setRows(out.slice(0, 12));
      } catch (e: any) {
        setError(e?.message || "Failed to load stop.");
      } finally {
        setLoading(false);
      }
    })();
  }, [stopId]);

  const title = useMemo(() => stop?.name || "Stop", [stop]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>← Back</Text>
        </Pressable>

        <Text style={{ marginTop: 10, color: "white", fontSize: 20, fontWeight: "800" }}>{title}</Text>
        <Text style={{ marginTop: 6, color: "rgba(255,255,255,0.65)" }}>Next departures (scheduled)</Text>
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
              {item.headsign ? (
                <Text style={{ marginTop: 6, color: "rgba(255,255,255,0.65)" }}>{item.headsign}</Text>
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}