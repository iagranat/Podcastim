import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer, AudioStatus } from 'expo-audio';
import { Episode } from '../api/types';
import { useApp } from './AppContext';

interface AudioPlayerContextType {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  isLoading: boolean;
  positionMs: number;
  durationMs: number;
  playbackRate: number;
  playlist: Episode[];
  isPlayerModalVisible: boolean;
  sleepTimerRemaining: number | null; // seconds
  sleepTimerOption: number | null; // minutes or null
  errorMessage: string | null;

  playEpisode: (episode: Episode, newPlaylist?: Episode[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  setPlaybackRate: (rate: number) => Promise<void>;
  setSleepTimer: (minutes: number | null) => void;
  cancelSleepTimer: () => void;
  openPlayerModal: () => void;
  closePlayerModal: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToHistory } = useApp();

  const playerRef = useRef<AudioPlayer | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [playlist, setPlaylist] = useState<Episode[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [positionMs, setPositionMs] = useState<number>(0);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [playbackRate, setPlaybackRateState] = useState<number>(1.0);
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sleep timer state
  const [sleepTimerOption, setSleepTimerOption] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const sleepTimerRef = useRef<any>(null);

  // Initialize audio mode for background playback
  useEffect(() => {
    async function initAudio() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'duckOthers',
        });
      } catch (e) {
        console.warn('Error setting audio mode', e);
      }
    }
    initAudio();

    return () => {
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    };
  }, []);

  // Sleep timer countdown effect
  useEffect(() => {
    if (sleepTimerRemaining === null) return;

    if (sleepTimerRemaining <= 0) {
      if (playerRef.current) {
        playerRef.current.pause();
      }
      setIsPlaying(false);
      setSleepTimerRemaining(null);
      setSleepTimerOption(null);
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }
      return;
    }

    sleepTimerRef.current = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (playerRef.current) {
            playerRef.current.pause();
          }
          setIsPlaying(false);
          setSleepTimerOption(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
        sleepTimerRef.current = null;
      }
    };
  }, [sleepTimerRemaining !== null]);

  const onPlaybackStatusUpdate = (status: AudioStatus) => {
    setIsPlaying(status.playing);
    setIsLoading(status.isBuffering && !status.playing);
    setPositionMs(Math.round((status.currentTime || 0) * 1000));
    setDurationMs(Math.round((status.duration || 0) * 1000));

    if (status.error) {
      setErrorMessage('שגיאה בטעינת הפרק. נסו שוב מאוחר יותר.');
      setIsLoading(false);
      setIsPlaying(false);
    }

    if (status.didJustFinish) {
      if (sleepTimerOption === 0) {
        cancelSleepTimer();
        setIsPlaying(false);
      } else {
        playNext();
      }
    }
  };

  const playEpisode = async (episode: Episode, newPlaylist?: Episode[]) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      if (newPlaylist && newPlaylist.length > 0) {
        setPlaylist(newPlaylist);
      } else if (!playlist.some((e) => e.id === episode.id)) {
        setPlaylist([episode]);
      }

      // Cleanup previous player instance
      if (playerRef.current) {
        playerRef.current.remove();
        playerRef.current = null;
      }

      setCurrentEpisode(episode);
      setPositionMs(0);
      setDurationMs(0);

      // Record to history
      addToHistory(episode);

      const newPlayer = createAudioPlayer(episode.src, {
        updateInterval: 500,
      });

      newPlayer.addListener('playbackStatusUpdate', onPlaybackStatusUpdate);
      newPlayer.setPlaybackRate(playbackRate);
      newPlayer.play();

      playerRef.current = newPlayer;
      setIsPlaying(true);
      setIsLoading(false);
    } catch (e: any) {
      console.warn('Playback error', e);
      setErrorMessage('לא ניתן להשמיע פרק זה כרגע. אנא נסו פרק אחר.');
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    if (!playerRef.current) {
      if (currentEpisode) {
        await playEpisode(currentEpisode, playlist);
      }
      return;
    }

    try {
      if (isPlaying) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else {
        playerRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('Error toggling play/pause', e);
    }
  };

  const seekTo = async (targetMs: number) => {
    if (!playerRef.current) return;
    try {
      const targetSec = Math.max(0, targetMs / 1000);
      await playerRef.current.seekTo(targetSec);
      setPositionMs(targetMs);
    } catch (e) {
      console.warn('Error seeking', e);
    }
  };

  const skipForward = async (seconds = 15) => {
    await seekTo(positionMs + seconds * 1000);
  };

  const skipBackward = async (seconds = 15) => {
    await seekTo(positionMs - seconds * 1000);
  };

  const playNext = async () => {
    if (!currentEpisode || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((e) => e.id === currentEpisode.id);
    if (currentIndex !== -1 && currentIndex + 1 < playlist.length) {
      await playEpisode(playlist[currentIndex + 1], playlist);
    }
  };

  const playPrevious = async () => {
    if (!currentEpisode || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((e) => e.id === currentEpisode.id);
    if (currentIndex > 0) {
      await playEpisode(playlist[currentIndex - 1], playlist);
    } else {
      await seekTo(0);
    }
  };

  const setPlaybackRate = async (rate: number) => {
    setPlaybackRateState(rate);
    if (playerRef.current) {
      try {
        playerRef.current.setPlaybackRate(rate);
      } catch (e) {
        console.warn('Error setting rate', e);
      }
    }
  };

  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerOption(minutes);
    if (minutes === null) {
      cancelSleepTimer();
    } else if (minutes === 0) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(minutes * 60);
    }
  };

  const cancelSleepTimer = () => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepTimerOption(null);
    setSleepTimerRemaining(null);
  };

  const openPlayerModal = () => setIsPlayerModalVisible(true);
  const closePlayerModal = () => setIsPlayerModalVisible(false);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentEpisode,
        isPlaying,
        isLoading,
        positionMs,
        durationMs,
        playbackRate,
        playlist,
        isPlayerModalVisible,
        sleepTimerRemaining,
        sleepTimerOption,
        errorMessage,
        playEpisode,
        togglePlayPause,
        seekTo,
        skipForward,
        skipBackward,
        playNext,
        playPrevious,
        setPlaybackRate,
        setSleepTimer,
        cancelSleepTimer,
        openPlayerModal,
        closePlayerModal,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
