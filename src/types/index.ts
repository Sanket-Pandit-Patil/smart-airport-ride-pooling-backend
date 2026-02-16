export interface LatLng {
  lat: number;
  lng: number;
}

export interface BookingInput {
  passengerId: string;
  pickup: LatLng;
  dropoff: LatLng;
  luggageCount: number;
}

export interface BookingRecord {
  id: string;
  passenger_id: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  luggage_count: number;
  status: string;
  ride_id: string | null;
  version: number;
}

export interface RideRecord {
  id: string;
  cab_id: string;
  total_distance_km: number | null;
  total_fare: number | null;
  status: string;
}

export interface CabRecord {
  id: string;
  seats: number;
  luggage_capacity: number;
}

export interface Waypoint {
  lat: number;
  lng: number;
  bookingId: string;
  type: 'PICKUP' | 'DROPOFF';
  sequence: number;
}

export interface PoolingCandidate {
  booking: BookingRecord;
  directDistanceKm: number;
  detourDistanceKm: number;
  detourFactor: number;
}
