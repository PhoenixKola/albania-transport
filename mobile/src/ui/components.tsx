import React from "react";
import { Text, View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UI, SHADOW, AnimatedPressable } from "./ui";

export function TopBar({ title, subtitle, leftLabel, onBack, right }: any) {
  const showBack = typeof onBack === "function";

  return (
    <View style={s.topWrap}>
      <View style={s.topRow}>
        {showBack ? (
          <AnimatedPressable onPress={onBack} style={{}} contentStyle={s.backBtn} scaleIn={0.98}>
            <Ionicons name="chevron-back" size={18} color={UI.text} />
            <Text style={s.backTxt}>{leftLabel ?? "Back"}</Text>
          </AnimatedPressable>
        ) : (
          <View style={{ width: 44, height: 44 }} />
        )}

        <View style={{ flex: 1 }} />
        {right ? right : null}
      </View>

      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Tabs({
  value,
  onChange,
  items
}: {
  value: string;
  onChange: (v: string) => void;
  items: Array<{ key: string; label: string; icon: any }>;
}) {
  return (
    <View style={s.tabs}>
      {items.map((it) => {
        const active = value === it.key;
        return (
          <AnimatedPressable
            key={it.key}
            onPress={() => onChange(it.key)}
            style={{ flex: 1 }}
            contentStyle={[s.tabBtn, active ? s.tabBtnActive : null]}
            scaleIn={0.98}
          >
            <Ionicons name={it.icon} size={16} color={active ? "#fff" : UI.muted} style={{ marginRight: 8 }} />
            <Text style={[s.tabTxt, active ? s.tabTxtActive : null]}>{it.label}</Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

export function Card({
  children,
  style
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function ListItem({
  title,
  subtitle,
  icon,
  right,
  onPress
}: {
  title: string;
  subtitle?: string;
  icon?: any;
  right?: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable onPress={onPress} style={{}} contentStyle={s.item} scaleIn={0.985}>
      {icon ? (
        <View style={s.itemIcon}>
          <Ionicons name={icon} size={18} color={UI.accent} />
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text style={s.itemTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? <Text style={s.itemSub}>{subtitle}</Text> : null}
      </View>

      {right ? right : <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />}
    </AnimatedPressable>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  cta,
  onPress
}: {
  icon: any;
  title: string;
  subtitle?: string;
  cta?: string;
  onPress?: () => void;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon} size={18} color={UI.accent} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={s.emptySub}>{subtitle}</Text> : null}
      {cta && onPress ? (
        <AnimatedPressable onPress={onPress} style={{ marginTop: 12 }} contentStyle={s.emptyBtn} scaleIn={0.98}>
          <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={s.emptyBtnTxt}>{cta}</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

export function SearchInput({
  value,
  onChangeText,
  placeholder,
  autoFocus
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  return (
    <View style={s.searchWrap}>
      <Ionicons name="search" size={16} color={UI.muted2} style={{ marginRight: 10 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.45)"
        style={s.search}
        autoFocus={autoFocus}
      />
      {value ? (
        <AnimatedPressable onPress={() => onChangeText("")} contentStyle={s.clearBtn} scaleIn={0.92}>
          <Ionicons name="close" size={16} color={UI.text} />
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  topWrap: { padding: 16, paddingBottom: 10 },
  topRow: { flexDirection: "row", alignItems: "center" },

  backBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14, backgroundColor: UI.card2, borderWidth: 1, borderColor: UI.border },
  backTxt: { marginLeft: 4, color: UI.muted, fontWeight: "800" },

  title: { marginTop: 10, color: UI.text, fontSize: 20, fontWeight: "900" },
  subtitle: { marginTop: 6, color: UI.muted, fontWeight: "800" },

  tabs: { flexDirection: "row", gap: 10, marginTop: 12 },
  tabBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 16, backgroundColor: UI.card2, borderWidth: 1, borderColor: UI.border },
  tabBtnActive: { backgroundColor: UI.accent, borderColor: "rgba(59,130,246,0.35)" },
  tabTxt: { color: UI.text, fontWeight: "900", opacity: 0.85 },
  tabTxtActive: { color: "#fff", opacity: 1 },

  card: { backgroundColor: UI.card, borderRadius: 18, borderWidth: 1, borderColor: UI.border, padding: 14, ...SHADOW },

  item: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, backgroundColor: UI.card, borderWidth: 1, borderColor: UI.border, ...SHADOW },
  itemIcon: { width: 38, height: 38, borderRadius: 16, backgroundColor: UI.accentSoft, borderWidth: 1, borderColor: "rgba(59,130,246,0.25)", alignItems: "center", justifyContent: "center" },
  itemTitle: { color: UI.text, fontSize: 16, fontWeight: "900" },
  itemSub: { marginTop: 6, color: UI.muted, fontWeight: "800" },

  empty: { paddingHorizontal: 16, paddingTop: 24, alignItems: "center" },
  emptyIcon: { width: 46, height: 46, borderRadius: 18, backgroundColor: UI.accentSoft, borderWidth: 1, borderColor: "rgba(59,130,246,0.25)", alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 10, color: UI.text, fontWeight: "900" },
  emptySub: { marginTop: 6, color: UI.muted, fontWeight: "800", textAlign: "center" },
  emptyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: UI.accent },
  emptyBtnTxt: { color: "#fff", fontWeight: "900" },

  searchWrap: { marginTop: 12, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, backgroundColor: UI.card2, borderWidth: 1, borderColor: UI.border },
  search: { flex: 1, color: UI.text, fontSize: 16, fontWeight: "800" },
  clearBtn: { width: 34, height: 34, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: UI.border, alignItems: "center", justifyContent: "center" }
});