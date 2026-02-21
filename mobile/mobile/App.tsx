import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, Text, TextInput, View } from "react-native";
import { DATA_BASE_URL } from "./src/config";

type Latest = {
  updatedAt: string;
  files: { routes: string; stops: string };
  counts: { routes: number; stops: number };
};

type Route = {
  id: string;
  shortName: string;
  longName: string;
  type: number | null;
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState<Latest | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const latestRes = await fetch(`${DATA_BASE_URL}/latest.json`, { cache: "no-store" as any });
        const latestJson = (await latestRes.json()) as Latest;
        setLatest(latestJson);

        const routesRes = await fetch(`${DATA_BASE_URL}/${latestJson.files.routes}`, { cache: "no-store" as any });
        const routesJson = (await routesRes.json()) as Route[];
        setRoutes(routesJson);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return routes;
    return routes.filter(r =>
      `${r.shortName} ${r.longName}`.toLowerCase().includes(s)
    );
  }, [routes, q]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Loading routes…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Routes</Text>
      <Text style={{ marginTop: 6, opacity: 0.7 }}>
        Updated: {latest?.updatedAt ? new Date(latest.updatedAt).toLocaleString() : "—"}
      </Text>

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search route…"
        style={{
          marginTop: 12,
          borderWidth: 1,
          borderColor: "#ddd",
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 10
        }}
      />

      <FlatList
        style={{ marginTop: 12 }}
        data={filtered}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View style={{ padding: 14, borderWidth: 1, borderColor: "#eee", borderRadius: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              {item.shortName || "—"} {item.longName ? `• ${item.longName}` : ""}
            </Text>
            <Text style={{ marginTop: 6, opacity: 0.7 }}>Type: {item.type ?? "—"}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}