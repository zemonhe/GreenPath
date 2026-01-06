
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Bike {
  model: string;
  batteryCapacity: number; // Wh
  currentBattery: number; // Percentage
  efficiency: number; // Wh/km
  range: number; // km
}

export interface RouteOption {
  id: string;
  name: string;
  distance: number; // km
  duration: number; // minutes
  batteryImpact: number; // Percentage
  elevationGain: number; // m
  weatherImpact: 'clear' | 'warning' | 'rain';
  isRecommended?: boolean;
  smartSummary?: string;
  requiresChargingStop?: boolean;
  suggestedStation?: ChargingStation;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface ChargingStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  availableConnectors: number;
  totalConnectors: number;
  power: number; // kW
  price: number; // €/kWh
  status: 'available' | 'busy' | 'offline';
}
