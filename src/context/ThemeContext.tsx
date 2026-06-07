import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  themePreference: ThemePreference;
  activeTheme: 'light' | 'dark';
  setThemePreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const THEME_PREF_KEY = '@apron_theme_preference';

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePref] = useState<ThemePreference>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadThemePref = async () => {
      try {
        const storedPref = await AsyncStorage.getItem(THEME_PREF_KEY);
        if (storedPref === 'light' || storedPref === 'dark' || storedPref === 'system') {
          setThemePref(storedPref as ThemePreference);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      } finally {
        setIsReady(true);
      }
    };
    loadThemePref();
  }, []);

  const setThemePreference = async (pref: ThemePreference) => {
    try {
      await AsyncStorage.setItem(THEME_PREF_KEY, pref);
      setThemePref(pref);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const activeTheme = themePreference === 'system' 
    ? (systemColorScheme === 'dark' ? 'dark' : 'light') 
    : themePreference;

  if (!isReady) {
    return null; // Or a loading state, but this resolves extremely fast
  }

  return (
    <ThemeContext.Provider value={{ themePreference, activeTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
};
