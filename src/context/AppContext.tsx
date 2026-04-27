import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, doc, onSnapshot, setDoc, OperationType, handleFirestoreError, getDocs, addDoc, collection, serverTimestamp } from '../lib/firebase';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { UserSettings } from '../types';

interface AppContextType {
  user: User | null;
  settings: UserSettings | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: UserSettings = {
  email: '',
  homeAddress: '',
  autoEmailLogs: false,
  darkMode: true,
  notifications: true,
  locationTracking: true,
  textSize: 'Normal',
  colorTheme: 'Red (High Contrast)',
  cardDensity: 'Normal',
  showPhoneButtons: true,
  showNavigateButtons: true,
  enableAnimations: true,
  compactMode: false,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setSettings(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const settingsRef = doc(db, 'userSettings', user.uid);
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as UserSettings);
      } else {
        // Initialize default settings for new user
        const initialSettings = { ...defaultSettings, email: user.email || '' };
        setDoc(settingsRef, initialSettings).catch(err => handleFirestoreError(err, OperationType.WRITE, `userSettings/${user.uid}`));
        setSettings(initialSettings);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `userSettings/${user.uid}`);
      setLoading(false);
    });

    return () => unsubscribeSettings();
  }, [user]);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Sign-in error:", error);
      alert(`Sign in failed: ${error.message}. If you are in a preview, you may need to open the app in a new tab.`);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const seedData = async () => {
    try {
      const farmsCol = collection(db, 'farms');
      const farmSnap = await getDocs(farmsCol);
      if (farmSnap.empty) {
        const sampleFarms = [
          { name: 'Sunnyside Farm', address: '123 Chicken Lane, Hatchery, GA 30101', phone: '5550101', notes: 'Main hub', lat: 33.7490, lng: -84.3880 },
          { name: 'Green Valley Poultry', address: '456 Valley Road, Meadows, GA 30102', phone: '5550102', notes: 'Back gate only', lat: 33.8121, lng: -84.4101 },
          { name: 'Heritage Hatchery', address: '789 Heritage Dr, Roostville, GA 30103', phone: '5550103', notes: 'Call ahead', lat: 33.6890, lng: -84.3501 },
          { name: 'Big Bird Basin', address: '101 Basin St, Lowland, GA 30104', phone: '5550104', notes: 'Wet roads', lat: 33.7210, lng: -84.4501 },
          { name: 'Alpha Acres', address: '202 Alpha Way, Primary, GA 30105', phone: '5550105', notes: 'Quiet hours 10pm-6am', lat: 33.7650, lng: -84.3201 }
        ];
        for (const farm of sampleFarms) {
          await addDoc(farmsCol, { ...farm, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
      }

      const vehiclesCol = collection(db, 'vehicles');
      const vehicleSnap = await getDocs(vehiclesCol);
      if (vehicleSnap.empty) {
        const sampleVehicles = [
          { name: 'Dodge Ram 3500', isActive: true },
          { name: 'Ford F-250', isActive: true },
          { name: 'International Truck', isActive: true }
        ];
        for (const vehicle of sampleVehicles) {
          await addDoc(vehiclesCol, { ...vehicle, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
      }
    } catch (err) {
      console.error("Seeding failed", err);
    }
  };

  useEffect(() => {
    if (user) {
      seedData();
    }
  }, [user]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;
    const settingsRef = doc(db, 'userSettings', user.uid);
    try {
      await setDoc(settingsRef, { ...settings, ...newSettings }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `userSettings/${user.uid}`);
    }
  };

  return (
    <AppContext.Provider value={{ user, settings, loading, signIn, logout, updateSettings }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
