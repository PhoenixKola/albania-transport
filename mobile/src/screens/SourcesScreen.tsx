import React from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { DATA_SOURCES } from "../utils/sources";

export default function SourcesScreen() {
  const open = (url: string) => Linking.openURL(url);

  return (
    <View style={{ flex: 1, backgroundColor: "#0b1220" }}>
      <View style={{ padding: 16, paddingTop: 24 }}>
        <Text style={{ color: "rgba(255,255,255,0.92)", fontSize: 20, fontWeight: "700" }}>
          Data sources
        </Text>
        <Text style={{ marginTop: 8, color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 20 }}>
          {DATA_SOURCES.disclaimerEn}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 14
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.92)", fontSize: 16, fontWeight: "600" }}>
            GTFS feed (routes, stops, shapes)
          </Text>
          <Pressable onPress={() => open(DATA_SOURCES.gtfsZip)} style={{ marginTop: 8 }}>
            <Text style={{ color: "rgba(59,130,246,1)", fontSize: 14 }}>{DATA_SOURCES.gtfsZip}</Text>
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 14
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.92)", fontSize: 16, fontWeight: "600" }}>
            Public transport info portal
          </Text>
          <Pressable onPress={() => open(DATA_SOURCES.portal)} style={{ marginTop: 8 }}>
            <Text style={{ color: "rgba(59,130,246,1)", fontSize: 14 }}>{DATA_SOURCES.portal}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}