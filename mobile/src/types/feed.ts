export type Route = {
  id: string;
  shortName: string;
  longName: string;
  type: number | null;
};

export type Stop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

export type Trip = {
  id: string;
  routeId: string;
  serviceId: string;
  headsign: string;
  directionId: number | null;
  shapeId: string;
};

export type StopTime = {
  stopId: string;
  arrival: string | null;
  departure: string | null;
  seq: number;
};

export type StopTimeAtStop = {
  tripId: string;
  arrival: string | null;
  departure: string | null;
  seq: number;
};

export type RouteTrips = Record<string, string[]>;
export type StopTimesByTrip = Record<string, StopTime[]>;
export type StopTimesByStop = Record<string, StopTimeAtStop[]>;

export type Services = {
  calendar: Array<{
    serviceId: string;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    startDate: string;
    endDate: string;
  }>;
  calendarDates: Array<{
    serviceId: string;
    date: string;
    exceptionType: number | null;
  }>;
};

export type ShapesById = Record<string, Array<[number, number]>>;