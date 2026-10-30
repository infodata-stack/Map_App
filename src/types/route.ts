export type PriorityLevel = 'normal' | 'urgent' | 'low';
export type StopStatus = 'pending' | 'visited' | 'skipped';

export interface LocationPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  contactPerson?: string;
  notes?: string;
  priority?: PriorityLevel;
  status: StopStatus;
  visitedAt?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  verifiedNotes?: string;
  distanceFromStartKm?: number;
  durationFromStartMinutes?: number;
  legDistanceKm?: number;
  legDurationMinutes?: number;
  orderIndex?: number;
}

export interface RouteOptimizationOptions {
  startType: 'gps' | 'custom';
  customStart?: LocationPoint;
  roundTrip: boolean; // Return to origin
  vehicleType: 'motorcycle' | 'car' | 'truck' | 'walking';
  speedKmH: number;
  fuelEfficiencyKmPerLiter: number;
  fuelPricePerLiter: number;
}

export interface RouteSummary {
  totalDistanceKm: number;
  totalDurationMinutes: number;
  stopCount: number;
  nearestStopId?: string;
  nearestStopDistanceKm?: number;
  estimatedFuelLiters: number;
  estimatedCostInr: number;
  completedStops: number;
}

export interface SavedRoute {
  id: string;
  title: string;
  createdAt: string;
  startPoint: LocationPoint;
  stops: LocationPoint[];
  summary: RouteSummary;
}

export type AppTab = 'quick_compare' | 'planner' | 'tracker' | 'history' | 'settings';
export type Language = 'hi' | 'en';
