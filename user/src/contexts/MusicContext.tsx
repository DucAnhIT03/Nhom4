import { createContext, useContext, useState, useRef, type ReactNode } from 'react';

export interface Song {
  title: string;
  artist: string;
  image: string;
  audioUrl: string;
  id?: number;
  type?: 'FREE' | 'PREMIUM';
  artistId?: number | null;
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
  stopAllAudio: (except?: HTMLAudioElement) => void;
  registerAudio: (audio: HTMLAudioElement | null) => void;
  unregisterAudio: (audio: HTMLAudioElement | null) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [currentlyPlayingSongState, setCurrentlyPlayingSongState] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const shuffledQueueRef = useRef<Song[]>([]);
  const originalQueueRef = useRef<Song[]>([]);
  const audioElementsRef = useRef<Set<HTMLAudioElement>>(new Set());

  // Dừng tất cả audio elements đang phát (bao gồm cả các audio không đăng ký)
  const stopAllAudio = (except?: HTMLAudioElement) => {
    // Dừng tất cả audio đã đăng ký
    audioElementsRef.current.forEach((audio) => {
      if (audio && audio !== except && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    // Dừng TẤT CẢ audio elements trong document để đảm bảo không có audio nào khác phát
    const allAudios = document.querySelectorAll('audio');
    allAudios.forEach((audio) => {
      if (audio && audio !== except && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  };

  // Wrapper cho setCurrentlyPlayingSong để tự động dừng audio khác
  const setCurrentlyPlayingSong = (song: Song | null) => {
    if (song) {
      // Dừng tất cả audio khi chuyển sang bài mới
      stopAllAudio();
    }
    setCurrentlyPlayingSongState(song);
  };

  const currentlyPlayingSong = currentlyPlayingSongState;

  const playNext = async () => {
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

    // Tìm bài hát tiếp theo có thể phát (bỏ qua premium nếu chưa có subscription)
    const findNextPlayableSong = async (startIndex: number, direction: 'forward' | 'backward' = 'forward'): Promise<number | null> => {
      const { isSongOwner } = await import('../utils/premiumCheck');
      const userSubscription = localStorage.getItem('userSubscription');
      const isPremium = userSubscription === 'PREMIUM' || userSubscription === 'premium';

      let checkedCount = 0;
      let currentCheckIndex = startIndex;

      while (checkedCount < currentQueue.length) {
        if (direction === 'forward') {
          currentCheckIndex = (currentCheckIndex + 1) % currentQueue.length;
        } else {
          currentCheckIndex = (currentCheckIndex - 1 + currentQueue.length) % currentQueue.length;
        }

        const song = currentQueue[currentCheckIndex];
        
        // Nếu là premium, kiểm tra quyền phát
        if (song.type === 'PREMIUM') {
          const isOwner = isSongOwner(song.artistId);
          if (!isOwner && !isPremium) {
            // Bỏ qua bài premium nếu không có quyền
            checkedCount++;
            continue;
          }
        }

        // Tìm thấy bài có thể phát
        return currentCheckIndex;
      }

      return null; // Không tìm thấy bài nào có thể phát
    };

    if (validIndex < currentQueue.length - 1) {
      const nextPlayableIndex = await findNextPlayableSong(validIndex, 'forward');
      if (nextPlayableIndex !== null) {
        nextIndex = nextPlayableIndex;
      } else {
        // Không tìm thấy bài nào có thể phát, dừng lại
        return;
      }
    } else {
      // Hết danh sách
      if (repeatMode === 'all') {
        const nextPlayableIndex = await findNextPlayableSong(validIndex, 'forward');
        if (nextPlayableIndex !== null) {
          nextIndex = nextPlayableIndex;
        } else {
          return; // Không tìm thấy bài nào có thể phát
        }
      } else {
        return; // Dừng lại
      }
    }

    setCurrentIndex(nextIndex);
    setCurrentlyPlayingSong(currentQueue[nextIndex]);
  };

  const playPrevious = async () => {
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

    // Tìm bài hát trước đó có thể phát (bỏ qua premium nếu chưa có subscription)
    const findPreviousPlayableSong = async (startIndex: number): Promise<number | null> => {
      const { isSongOwner } = await import('../utils/premiumCheck');
      const userSubscription = localStorage.getItem('userSubscription');
      const isPremium = userSubscription === 'PREMIUM' || userSubscription === 'premium';

      let checkedCount = 0;
      let currentCheckIndex = startIndex;

      while (checkedCount < currentQueue.length) {
        currentCheckIndex = (currentCheckIndex - 1 + currentQueue.length) % currentQueue.length;

        const song = currentQueue[currentCheckIndex];
        
        // Nếu là premium, kiểm tra quyền phát
        if (song.type === 'PREMIUM') {
          const isOwner = isSongOwner(song.artistId);
          if (!isOwner && !isPremium) {
            // Bỏ qua bài premium nếu không có quyền
            checkedCount++;
            continue;
          }
        }

        // Tìm thấy bài có thể phát
        return currentCheckIndex;
      }

      return null; // Không tìm thấy bài nào có thể phát
    };

    if (validIndex > 0) {
      const prevPlayableIndex = await findPreviousPlayableSong(validIndex);
      if (prevPlayableIndex !== null) {
        prevIndex = prevPlayableIndex;
      } else {
        // Không tìm thấy bài nào có thể phát, dừng lại
        return;
      }
    } else {
      // Ở đầu danh sách
      if (repeatMode === 'all') {
        const prevPlayableIndex = await findPreviousPlayableSong(validIndex);
        if (prevPlayableIndex !== null) {
          prevIndex = prevPlayableIndex;
        } else {
          return; // Không tìm thấy bài nào có thể phát
        }
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

  // Đăng ký audio element
  const registerAudio = (audio: HTMLAudioElement | null) => {
    if (audio) {
      audioElementsRef.current.add(audio);
    }
  };

  // Hủy đăng ký audio element
  const unregisterAudio = (audio: HTMLAudioElement | null) => {
    if (audio) {
      audioElementsRef.current.delete(audio);
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
      stopAllAudio,
      registerAudio,
      unregisterAudio,
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

