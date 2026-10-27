import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppMode, Podcast, Episode } from '../api/types';
import { KidsTheme, FullTheme } from '../constants/theme';

interface AppContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => Promise<void>;
  theme: typeof KidsTheme;
  favorites: Podcast[];
  isFavorite: (podcastId: number) => boolean;
  toggleFavorite: (podcast: Podcast) => Promise<void>;
  history: Episode[];
  addToHistory: (episode: Episode) => Promise<void>;
  parentLockEnabled: boolean;
  setParentLockEnabled: (enabled: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  MODE: '@podcastim_app_mode',
  FAVORITES: '@podcastim_favorites',
  HISTORY: '@podcastim_history',
  PARENT_LOCK: '@podcastim_parent_lock',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode>('kids');
  const [favorites, setFavorites] = useState<Podcast[]>([]);
  const [history, setHistory] = useState<Episode[]>([]);
  const [parentLockEnabled, setParentLockState] = useState<boolean>(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.MODE);
      if (savedMode === 'full' || savedMode === 'kids') {
        setModeState(savedMode);
      }
      const savedFavs = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
      const savedHist = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      if (savedHist) {
        setHistory(JSON.parse(savedHist));
      }
      const savedLock = await AsyncStorage.getItem(STORAGE_KEYS.PARENT_LOCK);
      if (savedLock !== null) {
        setParentLockState(savedLock === 'true');
      }
    } catch (e) {
      console.warn('Failed to load settings from storage', e);
    }
  };

  const setMode = async (newMode: AppMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MODE, newMode);
    } catch (e) {
      console.warn('Failed to persist mode', e);
    }
  };

  const isFavorite = (podcastId: number) => {
    return favorites.some((f) => f.id === podcastId);
  };

  const toggleFavorite = async (podcast: Podcast) => {
    try {
      let updated: Podcast[];
      if (isFavorite(podcast.id)) {
        updated = favorites.filter((f) => f.id !== podcast.id);
      } else {
        updated = [podcast, ...favorites];
      }
      setFavorites(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save favorite', e);
    }
  };

  const addToHistory = async (episode: Episode) => {
    try {
      const filtered = history.filter((e) => e.id !== episode.id);
      const updated = [episode, ...filtered].slice(0, 30); // Keep last 30
      setHistory(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save history', e);
    }
  };

  const setParentLockEnabled = async (enabled: boolean) => {
    setParentLockState(enabled);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PARENT_LOCK, String(enabled));
    } catch (e) {
      console.warn('Failed to save parent lock preference', e);
    }
  };

  const theme = mode === 'kids' ? KidsTheme : (FullTheme as unknown as typeof KidsTheme);

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        theme,
        favorites,
        isFavorite,
        toggleFavorite,
        history,
        addToHistory,
        parentLockEnabled,
        setParentLockEnabled,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
