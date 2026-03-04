import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RoutesScreen from "./src/screens/RoutesScreen";
import StopsScreen from "./src/screens/StopsScreen";
import SearchScreen from "./src/screens/SearchScreen";
import RouteScreen from "./src/screens/RouteScreen";
import StopScreen from "./src/screens/StopScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import NearbyStopsScreen from "./src/screens/NearbyStopsScreen";
import RouteMapScreen from "./src/screens/RouteMapScreen";
import SourcesScreen from "./src/screens/SourcesScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0b1220" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Routes" component={RoutesScreen} />
          <Stack.Screen name="Stops" component={StopsScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Route" component={RouteScreen} />
          <Stack.Screen name="Stop" component={StopScreen} />
          <Stack.Screen name="Favorites" component={FavoritesScreen} />
          <Stack.Screen name="Nearby" component={NearbyStopsScreen} />
          <Stack.Screen name="RouteMap" component={RouteMapScreen} />
          <Stack.Screen name="Sources" component={SourcesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}