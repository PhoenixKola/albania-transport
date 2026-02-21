import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import { readCachedJson } from "../feed/FeedService";
import type { Route, RouteTrips, ShapesById, Stop, StopTimesByTrip, Trip } from "../types/feed";
import { useLang } from "../hooks/useLang";
import { I18N } from "../i18n";

export default function RouteMapScreen({ route, navigation }: any) {
  const { lang } = useLang();
  const t = I18N[lang];

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

        setR(routes.find((x) => x.id === routeId) || null);

        const tripIds = routeTrips[routeId] || [];
        if (!tripIds.length) {
          setErr(lang === "sq" ? "S’ka udhëtime për këtë linjë." : "No trips for this route.");
          return;
        }
        const trip = trips.find((tt) => tt.id === tripIds[0]) || null;
        if (!trip) {
          setErr(lang === "sq" ? "Udhëtimi mungon për këtë linjë." : "Trip missing for this route.");
          return;
        }

        const stopsMap: Record<string, Stop> = {};
        for (const s of stops) stopsMap[s.id] = s;

        const times = stopTimesByTrip[tripIds[0]] || [];
        const stopIds = times.map((x) => x.stopId);
        const ms = stopIds
          .map((id) => stopsMap[id])
          .filter(Boolean)
          .map((s) => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon }));
        setMarkers(ms);

        let pts: Array<[number, number]> = [];
        if (trip.shapeId && shapes[trip.shapeId] && shapes[trip.shapeId].length) {
          pts = shapes[trip.shapeId];
        } else {
          pts = ms.map((m) => [m.lat, m.lon]);
        }

        if (!pts.length) {
          setErr(lang === "sq" ? "Nuk ka të dhëna harte për këtë linjë." : "No map data for this route.");
          return;
        }

        setPoly(pts.map(([lat, lon]) => ({ latitude: lat, longitude: lon })));
      } catch (e: any) {
        setErr(e?.message || (lang === "sq" ? "Dështoi ngarkimi i hartës." : "Failed to load map."));
      } finally {
        setLoading(false);
      }
    })();
  }, [routeId, lang]);

  const title = useMemo(() => {
    if (!r) return t.map;
    const left = (r.shortName || "—").trim();
    return r.longName ? `${left} • ${r.longName}` : left;
  }, [r, t.map]);

  const initial = poly[0] || { latitude: 41.3275, longitude: 19.8187 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>{t.back}</Text>
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
        <MapView style={{ flex: 1 }} initialRegion={{ ...initial, latitudeDelta: 0.06, longitudeDelta: 0.06 }}>
          <Polyline coordinates={poly} strokeWidth={4} />
          {markers.map((m) => (
            <Marker key={m.id} coordinate={{ latitude: m.lat, longitude: m.lon }} title={m.name} />
          ))}
        </MapView>
      )}
    </SafeAreaView>
  );
}