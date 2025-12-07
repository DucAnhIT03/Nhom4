import { createContext, useContext, useState, useRef, type ReactNode } from 'react';

export interface Song {
  title: string;
  artist: string;
  image: string;
  audioUrl: string;
  id?: number;
}

interface MusicContextType {
  currentlyPlayingSong: Song | null;
  setCurrentlyPlayingSong: (song: Song | null) => void;
  queue: Song[];
  setQueue: (songs: Song[]) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isShuffle: boolean;
  setIsShuffle: (shuffle: boolean) => void;
  repeatMode: 'off' | 'all' | 'one';
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  playNext: () => void;
  playPrevious: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [currentlyPlayingSong, setCurrentlyPlayingSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const shuffledQueueRef = useRef<Song[]>([]);
  const originalQueueRef = useRef<Song[]>([]);

  const playNext = () => {
    if (queue.length === 0) {
      console.log('Queue is empty');
      return;
    }

    let nextIndex: number;
    const currentQueue = isShuffle ? shuffledQueueRef.current : queue;

    if (repeatMode === 'one') {
      // Lặp lại bài hiện tại
      if (currentlyPlayingSong) {
        setCurrentlyPlayingSong(currentlyPlayingSong);
        return;
      }
    }

    // Nếu currentIndex không hợp lệ, tìm bài hiện tại trong queue
    let validIndex = currentIndex;
    if (currentIndex < 0 || currentIndex >= currentQueue.length) {
      if (currentlyPlayingSong) {
        validIndex = currentQueue.findIndex(
          s => s.audioUrl === currentlyPlayingSong.audioUrl
        );
        if (validIndex === -1) validIndex = 0;
      } else {
        validIndex = 0;
      }
    }

    if (validIndex < currentQueue.length - 1) {
      nextIndex = validIndex + 1;
    } else {
      // Hết danh sách
      if (repeatMode === 'all') {
        nextIndex = 0; // Quay lại đầu
      } else {
        return; // Dừng lại
      }
    }

    setCurrentIndex(nextIndex);
    setCurrentlyPlayingSong(currentQueue[nextIndex]);
  };

  const playPrevious = () => {
    if (queue.length === 0) {
      console.log('Queue is empty');
      return;
    }

    let prevIndex: number;
    const currentQueue = isShuffle ? shuffledQueueRef.current : queue;

    // Nếu currentIndex không hợp lệ, tìm bài hiện tại trong queue
    let validIndex = currentIndex;
    if (currentIndex < 0 || currentIndex >= currentQueue.length) {
      if (currentlyPlayingSong) {
        validIndex = currentQueue.findIndex(
          s => s.audioUrl === currentlyPlayingSong.audioUrl
        );
        if (validIndex === -1) validIndex = 0;
      } else {
        validIndex = 0;
      }
    }

    if (validIndex > 0) {
      prevIndex = validIndex - 1;
    } else {
      // Ở đầu danh sách
      if (repeatMode === 'all') {
        prevIndex = currentQueue.length - 1; // Quay lại cuối
      } else {
        return; // Dừng lại
      }
    }

    setCurrentIndex(prevIndex);
    setCurrentlyPlayingSong(currentQueue[prevIndex]);
  };

  // Khi queue thay đổi, tạo shuffled queue
  const handleSetQueue = (songs: Song[]) => {
    setQueue(songs);
    originalQueueRef.current = [...songs];
    // Tạo shuffled queue
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    shuffledQueueRef.current = shuffled;
  };

  // Khi shuffle thay đổi, cập nhật index
  const handleSetShuffle = (shuffle: boolean) => {
    setIsShuffle(shuffle);
    if (currentlyPlayingSong) {
      const currentQueue = shuffle ? shuffledQueueRef.current : originalQueueRef.current;
      const index = currentQueue.findIndex(
        s => s.audioUrl === currentlyPlayingSong.audioUrl
      );
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  };

  return (
    <MusicContext.Provider value={{ 
      currentlyPlayingSong, 
      setCurrentlyPlayingSong,
      queue,
      setQueue: handleSetQueue,
      currentIndex,
      setCurrentIndex,
      isShuffle,
      setIsShuffle: handleSetShuffle,
      repeatMode,
      setRepeatMode,
      playNext,
      playPrevious,
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

