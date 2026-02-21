import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "favorites:v1";

export type FavoritesState = {
  routes: string[];
  stops: string[];
};

const empty: FavoritesState = { routes: [], stops: [] };

export async function getFavorites(): Promise<FavoritesState> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return empty;
  try {
    const v = JSON.parse(raw) as FavoritesState;
    return {
      routes: Array.isArray(v.routes) ? v.routes : [],
      stops: Array.isArray(v.stops) ? v.stops : []
    };
  } catch {
    return empty;
  }
}

export async function setFavorites(next: FavoritesState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function toggleFavoriteRoute(routeId: string) {
  const fav = await getFavorites();
  const has = fav.routes.includes(routeId);
  const routes = has ? fav.routes.filter(x => x !== routeId) : [routeId, ...fav.routes];
  const next = { ...fav, routes };
  await setFavorites(next);
  return next;
}

export async function toggleFavoriteStop(stopId: string) {
  const fav = await getFavorites();
  const has = fav.stops.includes(stopId);
  const stops = has ? fav.stops.filter(x => x !== stopId) : [stopId, ...fav.stops];
  const next = { ...fav, stops };
  await setFavorites(next);
  return next;
}