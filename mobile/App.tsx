import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RoutesScreen from "./src/screens/RoutesScreen";
import RouteScreen from "./src/screens/RouteScreen";
import StopScreen from "./src/screens/StopScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0b1220" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Routes" component={RoutesScreen} />
          <Stack.Screen name="Route" component={RouteScreen} />
          <Stack.Screen name="Stop" component={StopScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}