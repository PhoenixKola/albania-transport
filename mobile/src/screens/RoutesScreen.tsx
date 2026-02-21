import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { readCachedJson, syncFeed } from "../feed/FeedService";
import type { Route } from "../types/feed";

export default function RoutesScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState("Loading…");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    setSyncing(true);
    try {
      const { latest, updated } = await syncFeed();
      setStatus(
        updated
          ? `Updated • ${new Date(latest.updatedAt).toLocaleString()}`
          : `Up to date • ${new Date(latest.updatedAt).toLocaleString()}`
      );

      const routesData = await readCachedJson<Route[]>("routes.json");
      setRoutes(routesData);
    } catch (e: any) {
      setStatus(e?.message || "Failed to load feed");
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return routes;
    return routes.filter((r) => `${r.shortName} ${r.longName}`.toLowerCase().includes(s));
  }, [routes, q]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "800" }}>Tirana Transport</Text>
            <Text style={{ marginTop: 6, color: "rgba(255,255,255,0.7)" }}>{status}</Text>
          </View>

          <Pressable
            onPress={load}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: "rgba(59,130,246,0.9)"
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>{syncing ? "…" : "Refresh"}</Text>
          </Pressable>
        </View>

        <View
          style={{
            marginTop: 14,
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)"
          }}
        >
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search routes…"
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={{ paddingHorizontal: 14, paddingVertical: 12, color: "white", fontSize: 16 }}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="white" />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("Route", { routeId: item.id })}
              style={{
                padding: 14,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)"
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                {(item.shortName || "—").trim()}
                {item.longName ? ` • ${item.longName}` : ""}
              </Text>
              <Text style={{ marginTop: 6, color: "rgba(255,255,255,0.65)" }}>Type: {item.type ?? "—"}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}