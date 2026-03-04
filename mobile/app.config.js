module.exports = ({ config }) => ({
  ...config,
  name: "Tirana Transport",
  slug: "tirana-transport",
  version: "1.0.4",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  owner: "phoenixkola",
  platforms: ["ios", "android"],
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: {
    supportsTablet: true
  },
  android: {
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.phoenixkola.tiranatransport",
    versionCode: 5,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    config: {
      ...(config.android?.config ?? {}),
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY
      }
    }
  },
  extra: {
    eas: {
      projectId: "1952e30d-f7be-4da2-83ac-59afafe969f5"
    }
  }
});