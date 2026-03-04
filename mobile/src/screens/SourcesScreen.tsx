import React from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DATA_SOURCES } from "../utils/sources";
import { UI } from "../ui/ui";
import { TopBar } from "../ui/components";
import type { Lang } from "../i18n";
import { I18N } from "../i18n";

export default function SourcesScreen({ navigation, route }: any) {
  const lang: Lang = route.params?.lang || "en";
  const t = I18N[lang];

  const open = (url: string) => Linking.openURL(url);

  const disclaimer = lang === "sq" ? DATA_SOURCES.disclaimerSq : DATA_SOURCES.disclaimerEn;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: UI.bg0 }} edges={["top", "left", "right"]}>
      <TopBar title={t.sources} subtitle={t.sourcesSubtitle} leftLabel={t.back} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}>
        <View
          style={{
            padding: 14,
            borderRadius: 18,
            backgroundColor: UI.card2,
            borderWidth: 1,
            borderColor: UI.border
          }}
        >
          <Text style={{ color: UI.text, fontWeight: "900", fontSize: 16 }}>{t.disclaimer}</Text>
          <Text style={{ marginTop: 8, color: UI.muted, lineHeight: 20 }}>{disclaimer}</Text>
        </View>

        <Pressable
          onPress={() => open(DATA_SOURCES.gtfsZip)}
          style={{
            padding: 14,
            borderRadius: 18,
            backgroundColor: UI.card2,
            borderWidth: 1,
            borderColor: UI.border
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: UI.text, fontWeight: "900", fontSize: 16 }}>
                {lang === "sq" ? "Feed GTFS" : "GTFS feed"}
              </Text>
              <Text style={{ marginTop: 6, color: UI.muted }} numberOfLines={1}>
                {DATA_SOURCES.gtfsZip}
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color={UI.text} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => open(DATA_SOURCES.portal)}
          style={{
            padding: 14,
            borderRadius: 18,
            backgroundColor: UI.card2,
            borderWidth: 1,
            borderColor: UI.border
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: UI.text, fontWeight: "900", fontSize: 16 }}>
                {lang === "sq" ? "Portali i transportit publik" : "Public transport portal"}
              </Text>
              <Text style={{ marginTop: 6, color: UI.muted }} numberOfLines={1}>
                {DATA_SOURCES.portal}
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color={UI.text} />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}