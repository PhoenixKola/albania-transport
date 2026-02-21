import React, { useEffect, useMemo, useState } from "react";
import { Pressable, SectionList, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { readCachedJson } from "../feed/FeedService";
import type { Stop } from "../types/feed";
import type { Lang } from "../i18n";
import { I18N } from "../i18n";

function groupKey(name: string) {
  const s = name.trim();
  if (!s) return "#";
  const c = s[0].toUpperCase();
  return c >= "A" && c <= "Z" ? c : "#";
}

export default function StopsScreen({ navigation, route }: any) {
  const lang: Lang = route.params?.lang || "en";
  const t = I18N[lang];

  const [stops, setStops] = useState<Stop[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setStops(await readCachedJson<Stop[]>("stops.json"));
    })();
  }, []);

  const sections = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = s ? stops.filter(x => x.name.toLowerCase().includes(s)) : stops;

    const map: Record<string, Stop[]> = {};
    for (const st of filtered) {
      const k = groupKey(st.name);
      (map[k] ||= []).push(st);
    }

    const keys = Object.keys(map).sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });

    return keys.map(k => ({
      title: k,
      data: map[k].sort((a, b) => a.name.localeCompare(b.name))
    }));
  }, [stops, q]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top", "left", "right"]}>
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>{t.back}</Text>
        </Pressable>

        <Text style={{ marginTop: 10, color: "white", fontSize: 20, fontWeight: "800" }}>{t.stopList}</Text>

        <View style={{ marginTop: 12, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t.searchStops}
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={{ paddingHorizontal: 14, paddingVertical: 12, color: "white", fontSize: 16 }}
          />
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        SectionSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderSectionHeader={({ section }) => (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontWeight: "800" }}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("Stop", { stopId: item.id })}
            style={{ padding: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", marginBottom: 10 }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{item.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>{t.noStops}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}