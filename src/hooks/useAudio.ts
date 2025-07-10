import { useState, useRef, useEffect } from 'react';

interface UseAudioReturn {
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: number;
  progress: number;
  error: string | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
}

export const useAudio = (url: string): UseAudioReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!url) {
      console.log('useAudio: No URL provided');
      return;
    }

    console.log('useAudio: Creating audio element for URL:', url);
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    audioRef.current = audio;
    setIsLoading(true);
    setError(null);

    const handleLoadStart = () => {
      console.log('useAudio: Load started');
    };

    const handleLoadedMetadata = () => {
      console.log('useAudio: Metadata loaded, duration:', audio.duration);
    };

    const handleLoadedData = () => {
      console.log('useAudio: Data loaded, setting duration:', audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      console.log('useAudio: Audio ended');
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: Event) => {
      const errorTarget = e.target as HTMLAudioElement;
      let errorMessage = 'Failed to load audio';
      
      if (errorTarget.error) {
        switch (errorTarget.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio loading was aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading audio';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio decode error';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported or CORS error';
            break;
          default:
            errorMessage = 'Unknown audio error';
        }
      }
      
      console.error('useAudio: Error occurred:', errorMessage, errorTarget.error);
      setError(errorMessage);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      console.log('useAudio: Can play audio');
      setIsLoading(false);
    };

    const handleProgress = () => {
      console.log('useAudio: Download progress');
    };

    const handleStalled = () => {
      console.log('useAudio: Download stalled');
    };

    const handleSuspend = () => {
      console.log('useAudio: Download suspended');
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('suspend', handleSuspend);

    // Set the source after adding event listeners
    console.log('useAudio: Setting audio source to:', url);
    audio.src = url;

    return () => {
      console.log('useAudio: Cleaning up audio element');
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('suspend', handleSuspend);
      audio.pause();
      audio.src = '';
    };
  }, [url]);

  const play = () => {
    if (audioRef.current && !error) {
      console.log('useAudio: Attempting to play audio');
      audioRef.current.play()
        .then(() => {
          console.log('useAudio: Audio play successful');
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('useAudio: Play failed:', err);
          setError(`Failed to play audio: ${err.message}`);
        });
    } else {
      console.log('useAudio: Cannot play - no audio ref or error exists:', { hasAudio: !!audioRef.current, error });
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return {
    isPlaying,
    isLoading,
    duration,
    currentTime,
    progress,
    error,
    play,
    pause,
    stop,
    setVolume,
  };
};