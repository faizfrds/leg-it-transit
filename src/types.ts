export type Location = {
  address: string;
  placeId?: string;
  lat: number;
  lng: number;
};

export interface RouteStep {
  mode: 'WALKING' | 'TRANSIT';
  duration: string;
  instruction: string;
  lineName?: string;
  lineColor?: string;
  vehicleType?: string;
  departureStop?: string;
  arrivalStop?: string;
  numStops?: number;
}

export interface RouteOption {
  id: string;
  totalTime: string;
  durationSeconds: number;
  transitTime: number;
  walkTime: number;
  type: 'fastest' | 'active';
  label: string;
  description: string;
  fare: string;
  routeData: google.maps.DirectionsRoute;
  steps: RouteStep[];
}
