import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { readCachedJson } from "../feed/FeedService";
import type { Stop } from "../types/feed";
import { haversineMeters } from "../utils/geo";
import { useLang } from "../hooks/useLang";
import { I18N } from "../i18n";

import { UI } from "../ui/ui";
import { AnimatedPressable } from "../ui/ui";
import { TopBar, ListItem, EmptyState } from "../ui/components";

export default function NearbyStopsScreen({ navigation }: any) {
  const { lang } = useLang();
  const t = I18N[lang];

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);

  const load = async () => {
    setLoading(true);
    setErr(null);
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
      setErr(e?.message || (lang === "sq" ? "Dështoi marrja e lokacionit." : "Failed to get location."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [t.locationDenied]);

  const nearby = useMemo(() => {
    if (!me) return [];
    return stops
      .map((s) => ({ s, d: haversineMeters(me.lat, me.lon, s.lat, s.lon) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 30);
  }, [me, stops]);

  const headerRight = (
    <AnimatedPressable
      onPress={load}
      disabled={loading}
      style={{ opacity: loading ? 0.7 : 1 }}
      contentStyle={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: UI.accent
      }}
      scaleIn={0.98}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="refresh" size={18} color="#fff" />}
    </AnimatedPressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.bg0 }} edges={["top", "left", "right"]}>
      <TopBar title={t.nearby} subtitle={t.closestStops} leftLabel={t.back} onBack={() => navigation.goBack()} right={headerRight} />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ marginTop: 12, color: UI.muted, fontWeight: "800" }}>{t.loading}</Text>
        </View>
      ) : err ? (
        <EmptyState
          icon="warning-outline"
          title={err}
          subtitle={lang === "sq" ? "Kontrollo lejet e lokacionit dhe provo përsëri." : "Check location permission and try again."}
          cta={lang === "sq" ? "Provo përsëri" : "Try again"}
          onPress={load}
        />
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          data={nearby}
          keyExtractor={(x) => x.s.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={<EmptyState icon="location-outline" title={t.noStops ?? "No stops"} subtitle={t.closestStops} />}
          renderItem={({ item }) => (
            <ListItem
              onPress={() => navigation.navigate("Stop", { stopId: item.s.id })}
              title={item.s.name}
              subtitle={`${Math.round(item.d)} m`}
              icon="navigate-outline"
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}