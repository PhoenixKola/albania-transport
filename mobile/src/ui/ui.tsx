import { Animated, Easing, Platform } from "react-native";

export const UI = {
  bg0: "#0b1220",
  bg1: "#0f1730",
  card: "rgba(255,255,255,0.08)",
  card2: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.70)",
  muted2: "rgba(255,255,255,0.55)",
  accent: "#3b82f6",
  accentSoft: "rgba(59,130,246,0.18)",
  warnSoft: "rgba(245,158,11,0.16)",
  warnBorder: "rgba(245,158,11,0.30)"
};

export const SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 }
  },
  android: { elevation: 2 },
  default: {}
});

export function AnimatedPressable({
  children,
  style,
  contentStyle,
  onPress,
  disabled,
  hitSlop,
  scaleIn = 0.97
}: {
  children: React.ReactNode;
  style?: any;
  contentStyle?: any;
  onPress?: () => void;
  disabled?: boolean;
  hitSlop?: any;
  scaleIn?: number;
}) {
  const scale = new Animated.Value(1);
  const PressableAny = require("react-native").Pressable;

  const pressIn = () => {
    if (disabled) return;
    Animated.timing(scale, { toValue: scaleIn, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };

  const pressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <PressableAny
        onPress={onPress}
        disabled={disabled}
        hitSlop={hitSlop}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={contentStyle}
      >
        {children}
      </PressableAny>
    </Animated.View>
  );
}