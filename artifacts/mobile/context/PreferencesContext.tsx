import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserPreferences {
  userId: string;
  name: string;
  favoriteTeams: string[];
  favoriteLeagues: string[];
  favoritePlayers: string[];
  rivals: string[];
  darkMode: boolean;
  notifications: boolean;
  onboardingComplete: boolean;
}

const DEFAULT_PREFS: UserPreferences = {
  userId: `user_${Date.now()}`,
  name: "Sports Fan",
  favoriteTeams: [],
  favoriteLeagues: [],
  favoritePlayers: [],
  rivals: [],
  darkMode: true,
  notifications: true,
  onboardingComplete: false,
};

const STORAGE_KEY = "@fourth_quarter_prefs";

interface PreferencesContextType {
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  savePreferences: (prefs: UserPreferences) => Promise<void>;
  isLoaded: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error("Failed to load preferences:", e);
    } finally {
      setIsLoaded(true);
    }
  };

  const setPreferences = (prefs: Partial<UserPreferences>) => {
    setPrefs(prev => {
      const updated = { ...prev, ...prefs };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const savePreferences = async (prefs: UserPreferences) => {
    const updated = { ...prefs };
    setPrefs(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    try {
      await fetch(`${process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : ""}/api/user/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
    } catch (e) {
    }
  };

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences, savePreferences, isLoaded }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
