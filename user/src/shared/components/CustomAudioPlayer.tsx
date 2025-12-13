import { useEffect, useRef, useState } from "react";
import {
  IoPlaySharp,
  IoPauseSharp,
  IoPlaySkipBackSharp,
  IoPlaySkipForwardSharp,
  IoShuffleOutline,
  IoRepeatOutline,
} from "react-icons/io5";
import { useMusic } from "../../contexts/MusicContext";

interface CustomAudioPlayerProps {
  src: string;
  onPlay?: () => void;
  className?: string;
  songType?: 'FREE' | 'PREMIUM';
  songArtistId?: number | null;
  // Thông tin bài hát để set vào MusicContext
  songId?: number;
  songTitle?: string;
  songArtist?: string;
  songImage?: string;
  // Danh sách tất cả bài hát để set queue (tùy chọn)
  allSongs?: Array<{
    id: number;
    title: string;
    artist: string;
    fileUrl?: string;
    coverImage?: string;
    type?: 'FREE' | 'PREMIUM';
    artistId?: number | null;
  }>;
}

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "0:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const CustomAudioPlayer = ({ 
  src, 
  onPlay, 
  className = "", 
  songType, 
  songArtistId,
  songId,
  songTitle,
  songArtist,
  songImage,
  allSongs
}: CustomAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { 
    stopAllAudio, 
    registerAudio, 
    unregisterAudio, 
    currentlyPlayingSong,
    setCurrentlyPlayingSong,
    setQueue,
    setCurrentIndex,
    queue,
    playNext,
    repeatMode
  } = useMusic();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Đăng ký audio element và dừng khi có bài mới được phát từ MusicPlayerBar
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      registerAudio(audio);
      
      return () => {
        unregisterAudio(audio);
      };
    }
  }, [registerAudio, unregisterAudio]);

  // Dừng audio này khi có bài mới được phát từ MusicPlayerBar
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentlyPlayingSong) {
      // Nếu có bài đang phát từ MusicPlayerBar và không phải bài này, dừng lại
      if (currentlyPlayingSong.audioUrl !== src) {
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = 0;
      }
    }
  }, [currentlyPlayingSong, src]);

  // Lắng nghe sự kiện play từ audio element này để dừng các audio khác
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      // Khi audio này phát, dừng tất cả các audio khác
      stopAllAudio(audio);
    };

    audio.addEventListener('play', handlePlay);
    
    return () => {
      audio.removeEventListener('play', handlePlay);
    };
  }, [stopAllAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const updateDuration = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      
      // Nếu có queue và có bài tiếp theo, tự động chuyển bài
      if (queue.length > 0) {
        // Kiểm tra repeatMode từ context
        if (repeatMode === 'one') {
          // Lặp lại bài hiện tại
          audio.currentTime = 0;
          audio.play().catch(console.error);
        } else {
          // Tự động chuyển sang bài tiếp theo
          setTimeout(() => {
            playNext();
          }, 100);
        }
      } else {
        // Không có queue, chỉ dừng lại hoặc lặp lại bài hiện tại
        if (repeatMode === "one") {
          audio.currentTime = 0;
          audio.play().catch(console.error);
        }
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [queue, playNext, repeatMode]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      // Kiểm tra premium trước khi phát
      if (songType === 'PREMIUM') {
        const { canPlayPremiumSong, isSongOwner } = await import('../../utils/premiumCheck');
        
        // Kiểm tra nếu user là chủ sở hữu
        const isOwner = isSongOwner(songArtistId);
        
        if (!isOwner) {
          const checkResult = await canPlayPremiumSong(
            { type: songType, artistId: songArtistId }
          );
          
          if (!checkResult.canPlay) {
            alert(checkResult.reason || 'Bài hát này yêu cầu tài khoản Premium.');
            // Redirect đến trang upgrade nếu user muốn
            if (window.confirm(checkResult.reason + '\n\nBạn có muốn nâng cấp tài khoản không?')) {
              window.location.href = '/upgrade';
            }
            return;
          }
        }
      }

      // Dừng tất cả audio khác trước khi phát (bao gồm MusicPlayerBar và các CustomAudioPlayer khác)
      stopAllAudio(audio);
      
      // Đảm bảo dừng tất cả audio khác (bao gồm cả audio không đăng ký)
      const allAudios = document.querySelectorAll('audio');
      allAudios.forEach((otherAudio) => {
        if (otherAudio !== audio && !otherAudio.paused) {
          otherAudio.pause();
          otherAudio.currentTime = 0;
        }
      });
      
      // Nếu có đủ thông tin bài hát, set vào MusicContext để hiển thị thanh player ở cuối trang
      if (songId && songTitle && src) {
        const musicSong = {
          id: songId,
          title: songTitle,
          artist: songArtist || "Unknown Artist",
          image: songImage || './slide/Song1.jpg',
          audioUrl: src,
          type: songType,
          artistId: songArtistId,
        };
        
        // Set bài hát đang phát
        setCurrentlyPlayingSong(musicSong);
        
        // Set queue: nếu có allSongs thì dùng allSongs, nếu không thì chỉ bài hát hiện tại
        if (allSongs && allSongs.length > 0) {
          const queue = allSongs
            .filter(s => s.fileUrl) // Chỉ lấy bài hát có fileUrl
            .map(s => ({
              id: s.id,
              title: s.title,
              artist: s.artist || "Unknown Artist",
              image: s.coverImage || songImage || './slide/Song1.jpg',
              audioUrl: s.fileUrl || '',
              type: s.type,
              artistId: s.artistId,
            }));
          
          // Tìm index của bài hát hiện tại trong queue
          const currentIndex = queue.findIndex(s => s.id === songId || s.audioUrl === src);
          setQueue(queue);
          setCurrentIndex(currentIndex >= 0 ? currentIndex : 0);
        } else {
          // Chỉ có bài hát hiện tại
          setQueue([musicSong]);
          setCurrentIndex(0);
        }
      }
      
      audio.play();
      if (onPlay) onPlay();
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    const audio = audioRef.current;

    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleSkipBack = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const handleSkipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Controls */}
      <div className="flex items-center gap-3 text-gray-400">
        <button 
          className="hover:text-gray-300 transition cursor-not-allowed opacity-50" 
          title="Shuffle (Not available for individual songs)"
          disabled
          onClick={(e) => e.stopPropagation()}
        >
          <IoShuffleOutline className="text-lg" />
        </button>
        <button 
          className="hover:text-gray-300 transition" 
          onClick={(e) => {
            e.stopPropagation();
            handleSkipBack();
          }} 
          title="Rewind 10s"
        >
          <IoPlaySkipBackSharp className="text-lg" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePlayPause();
          }}
          className="bg-white text-black rounded-full w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition shadow-md"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <IoPauseSharp className="text-base font-bold" />
          ) : (
            <IoPlaySharp className="text-base ml-0.5 font-bold" />
          )}
        </button>
        
        <button 
          className="hover:text-gray-300 transition" 
          onClick={(e) => {
            e.stopPropagation();
            handleSkipForward();
          }} 
          title="Forward 10s"
        >
          <IoPlaySkipForwardSharp className="text-lg" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            // Repeat mode được quản lý bởi MusicContext, không cần local state
            // Button này chỉ để hiển thị, logic repeat được xử lý trong handleEnded
          }}
          className={`hover:text-gray-300 transition ${repeatMode === "one" ? "text-[#3BC8E7]" : ""}`}
          title={repeatMode === "one" ? "Repeat one (on)" : "Repeat off"}
          disabled
        >
          <IoRepeatOutline className="text-lg" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 w-full">
        <span className="text-xs text-gray-400 min-w-[45px] text-right font-mono">{formatTime(currentTime)}</span>
        
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleProgressChange}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3BC8E7 0%, #3BC8E7 ${(currentTime / (duration || 1)) * 100}%, rgba(107, 114, 128, 0.5) ${(currentTime / (duration || 1)) * 100}%, rgba(107, 114, 128, 0.5) 100%)`,
          }}
        />
        
        <span className="text-xs text-gray-400 min-w-[45px] font-mono">{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default CustomAudioPlayer;

