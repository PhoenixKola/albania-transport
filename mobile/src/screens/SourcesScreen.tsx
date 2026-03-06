import React from "react";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
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

  const disclaimer = lang === "sq" ? DATA_SOURCES.disclaimerSq : DATA_SOURCES.disclaimerEn;

  const open = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert(
          lang === "sq" ? "Nuk hapet linku" : "Can't open link",
          lang === "sq"
            ? "Linku nuk mund te hapet tani. Provo perseri me vone."
            : "This link can't be opened right now. Please try again later."
        );
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        lang === "sq" ? "Gabim" : "Error",
        lang === "sq"
          ? "Ndodhi nje gabim gjate hapjes se linkut."
          : "Something went wrong while opening the link."
      );
    }
  };

  const Card = ({
    title,
    url,
    subtitle
  }: {
    title: string;
    url: string;
    subtitle?: string;
  }) => (
    <Pressable
      onPress={() => open(url)}
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
          <Text style={{ color: UI.text, fontWeight: "900", fontSize: 16 }}>{title}</Text>
          {subtitle ? (
            <Text style={{ marginTop: 6, color: UI.muted }}>{subtitle}</Text>
          ) : null}
          <Text style={{ marginTop: subtitle ? 6 : 6, color: UI.muted }} numberOfLines={1}>
            {url}
          </Text>
        </View>
        <Ionicons name="open-outline" size={18} color={UI.text} />
      </View>
    </Pressable>
  );

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

        <Card
          title={lang === "sq" ? "Bashkia e Tiranes (linjat urbane)" : "Municipality of Tirana (urban lines)"}
          subtitle={lang === "sq" ? "Burim zyrtar (faqe web)" : "Official source (web page)"}
          url={DATA_SOURCES.municipality}
        />

        <Card
          title={lang === "sq" ? "Portali i transportit publik" : "Public transport portal"}
          subtitle={lang === "sq" ? "Burim zyrtar (faqe web)" : "Official source (web page)"}
          url={DATA_SOURCES.portal}
        />

        <Card
          title={lang === "sq" ? "Feed GTFS" : "GTFS feed"}
          subtitle={lang === "sq" ? "Dataset i shkarkueshem" : "Downloadable dataset"}
          url={DATA_SOURCES.gtfsZip}
        />
      </ScrollView>
    </SafeAreaView>
  );
}