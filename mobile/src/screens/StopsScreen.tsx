import React, { useEffect, useMemo, useState } from "react";
import { SectionList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { readCachedJson } from "../feed/FeedService";
import type { Stop } from "../types/feed";
import type { Lang } from "../i18n";
import { I18N } from "../i18n";

import { UI } from "../ui/ui";
import { TopBar, ListItem, EmptyState, SearchInput } from "../ui/components";

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
    const filtered = s ? stops.filter((x) => x.name.toLowerCase().includes(s)) : stops;

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

    return keys.map((k) => ({
      title: k,
      data: map[k].sort((a, b) => a.name.localeCompare(b.name))
    }));
  }, [stops, q]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.bg0 }} edges={["top", "left", "right"]}>
      <TopBar title={t.stopList} subtitle={t.searchStops} leftLabel={t.back} onBack={() => navigation.goBack()} />

      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <SearchInput value={q} onChangeText={setQ} placeholder={t.searchStops} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        SectionSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderSectionHeader={({ section }) => (
          <View style={{ paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="pricetag-outline" size={14} color={UI.muted2} />
            <Text style={{ color: UI.muted, fontWeight: "900" }}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            <ListItem onPress={() => navigation.navigate("Stop", { stopId: item.id })} title={item.name} icon="location-outline" />
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="location-outline" title={t.noStops} subtitle={t.searchStops} />}
      />
    </SafeAreaView>
  );
}