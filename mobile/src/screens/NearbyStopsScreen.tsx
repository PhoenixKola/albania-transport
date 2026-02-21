import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { readCachedJson } from "../feed/FeedService";
import type { Stop } from "../types/feed";
import { haversineMeters } from "../utils/geo";
import { useLang } from "../hooks/useLang";
import { I18N } from "../i18n";

export default function NearbyStopsScreen({ navigation }: any) {
  const { lang } = useLang();
  const t = I18N[lang];

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErr(t.locationDenied);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        setMe({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStops(await readCachedJson<Stop[]>("stops.json"));
      } catch (e: any) {
        setErr(e?.message || "Failed to get location.");
      } finally {
        setLoading(false);
      }
    })();
  }, [t.locationDenied]);

  const nearby = useMemo(() => {
    if (!me) return [];
    return stops
      .map(s => ({ s, d: haversineMeters(me.lat, me.lon, s.lat, s.lon) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 30);
  }, [me, stops]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>{t.back}</Text>
        </Pressable>
        <Text style={{ marginTop: 10, color: "white", fontSize: 20, fontWeight: "800" }}>{t.nearby}</Text>
        <Text style={{ marginTop: 6, color: "rgba(255,255,255,0.65)" }}>{t.closestStops}</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="white" />
          <Text style={{ marginTop: 12, color: "rgba(255,255,255,0.7)" }}>{t.loading}</Text>
        </View>
      ) : err ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "rgba(255,255,255,0.8)" }}>{err}</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          data={nearby}
          keyExtractor={(x) => x.s.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("Stop", { stopId: item.s.id })}
              style={{ padding: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{item.s.name}</Text>
              <Text style={{ marginTop: 6, color: "rgba(255,255,255,0.65)" }}>{Math.round(item.d)} m</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}