export interface Farm {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  phone?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Vehicle {
  id: string;
  name: string;
  plate?: string;
  status?: string;
  notes?: string;
  isActive: boolean;
  maxCapacity?: number; // Total bird/crate capacity
  currentLoad?: number;
  lastOdometer?: number;
  lastFuelGallons?: number;
  createdAt: any;
  updatedAt: any;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  truckNumber: string;
  trailerNumber: string;
  color: string;
  gallonsPumped: number;
  odometerReading: number;
  meterReading: string;
  photoUrl?: string;
  signatureUrl?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  userId: string;
  timestamp: any;
}

export interface CatchLog {
  id: string;
  vehicleId: string;
  farmId: string;
  vehicleName: string;
  farmName: string;
  birdType: 'Rooster' | 'Hen';
  totalBirds: number;
  loads: Array<{
    id: string;
    type: string;
    birds: number;
    placement: string;
  }>;
  metrics?: any;
  signatureUrl?: string;
  userId: string;
  timestamp: any;
}

export interface UserSettings {
  email: string;
  homeAddress: string;
  autoEmailLogs: boolean;
  darkMode: boolean;
  notifications: boolean;
  locationTracking: boolean;
  textSize: 'Small' | 'Normal' | 'Large' | 'Extra Large';
  colorTheme: string;
  cardDensity: 'Compact' | 'Normal' | 'Comfortable';
  showPhoneButtons: boolean;
  showNavigateButtons: boolean;
  enableAnimations: boolean;
  compactMode: boolean;
}
