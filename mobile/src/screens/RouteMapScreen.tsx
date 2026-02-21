import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import { readCachedJson } from "../feed/FeedService";
import type { Route, RouteTrips, ShapesById, Stop, StopTimesByTrip, Trip } from "../types/feed";

export default function RouteMapScreen({ route, navigation }: any) {
  const routeId: string = route.params.routeId;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [r, setR] = useState<Route | null>(null);
  const [poly, setPoly] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [markers, setMarkers] = useState<Array<{ id: string; name: string; lat: number; lon: number }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const routes = await readCachedJson<Route[]>("routes.json");
        const trips = await readCachedJson<Trip[]>("trips.json");
        const routeTrips = await readCachedJson<RouteTrips>("route_trips.json");
        const stopTimesByTrip = await readCachedJson<StopTimesByTrip>("stop_times_by_trip.json");
        const stops = await readCachedJson<Stop[]>("stops.json");
        const shapes = await readCachedJson<ShapesById>("shapes.json");

        setR(routes.find(x => x.id === routeId) || null);

        const tripIds = routeTrips[routeId] || [];
        if (!tripIds.length) {
          setErr("No trips for this route.");
          return;
        }
        const trip = trips.find(t => t.id === tripIds[0]) || null;
        if (!trip || !trip.shapeId) {
          setErr("No shape for this route.");
          return;
        }

        const pts = shapes[trip.shapeId] || [];
        if (!pts.length) {
          setErr("Shape points missing.");
          return;
        }

        setPoly(pts.map(([lat, lon]) => ({ latitude: lat, longitude: lon })));

        const stopsMap: Record<string, Stop> = {};
        for (const s of stops) stopsMap[s.id] = s;
        const times = stopTimesByTrip[tripIds[0]] || [];
        const stopIds = times.map(x => x.stopId);

        const ms = stopIds
          .map(id => stopsMap[id])
          .filter(Boolean)
          .map(s => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon }));

        setMarkers(ms);
      } catch (e: any) {
        setErr(e?.message || "Failed to load map.");
      } finally {
        setLoading(false);
      }
    })();
  }, [routeId]);

  const title = useMemo(() => {
    if (!r) return "Map";
    const left = (r.shortName || "—").trim();
    return r.longName ? `${left} • ${r.longName}` : left;
  }, [r]);

  const initial = poly[0] || { latitude: 41.3275, longitude: 19.8187 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>← Back</Text>
        </Pressable>
        <Text style={{ marginTop: 10, color: "white", fontSize: 18, fontWeight: "800" }}>{title}</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="white" />
        </View>
      ) : err ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "rgba(255,255,255,0.8)" }}>{err}</Text>
        </View>
      ) : (
        <MapView style={{ flex: 1 }} initialRegion={{ ...initial, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
          <Polyline coordinates={poly} strokeWidth={4} />
          {markers.map(m => (
            <Marker key={m.id} coordinate={{ latitude: m.lat, longitude: m.lon }} title={m.name} />
          ))}
        </MapView>
      )}
    </SafeAreaView>
  );
}