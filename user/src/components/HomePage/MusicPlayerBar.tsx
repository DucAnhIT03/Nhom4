import { useEffect, useRef, useState } from "react";
import {
  IoPlaySharp,
  IoPauseSharp,
  IoPlaySkipBackSharp,
  IoPlaySkipForwardSharp,
  IoVolumeHighSharp,
  IoVolumeMuteSharp,
  IoShuffleOutline,
  IoRepeatOutline,
  IoRepeat,
  IoCloseSharp,
  IoCloudDownloadOutline,
  IoCheckmarkDoneSharp,
} from "react-icons/io5";
import { useMusic, type Song } from "../../contexts/MusicContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { addHistory } from "../../services/history.service";
import { incrementSongViews } from "../../services/song.service";
import { getCurrentUser } from "../../services/auth.service";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { toggleWishlist, getWishlistSongIds } from "../../services/wishlist.service";
import { addDownload, getDownloads } from "../../services/download.service";
import { saveSongToCache, getCachedSongUrl } from "../../utils/downloadCache.ts";

interface MusicPlayerBarProps {
  song: Song | null;
}

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "0:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const MusicPlayerBar = ({ song: songProp }: MusicPlayerBarProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    currentlyPlayingSong: contextSong,
    setCurrentlyPlayingSong,
    isShuffle,
    setIsShuffle,
    repeatMode,
    setRepeatMode,
    playNext,
    playPrevious,
    stopAllAudio,
    registerAudio,
    unregisterAudio,
  } = useMusic();
  const { t } = useLanguage();

  // Ưu tiên sử dụng song từ context, nếu không có thì dùng từ props
  const song = contextSong || songProp;

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const isDraggingRef = useRef(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const historyAddedRef = useRef<Set<number>>(new Set()); // Track các bài hát đã thêm vào lịch sử trong session này

  // Load userId
  useEffect(() => {
    const loadUserId = async () => {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(parseInt(storedUserId));
      } else {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const user = await getCurrentUser();
            if (user.id) {
              setUserId(user.id);
              localStorage.setItem('userId', user.id.toString());
            }
          } catch (error) {
            console.error('Error loading user:', error);
          }
        }
      }
    };
    loadUserId();
  }, []);

  // Load wishlist status khi song thay đổi
  useEffect(() => {
    const loadWishlistStatus = async () => {
      if (!song?.id || !userId) {
        setIsLiked(false);
        setIsDownloaded(false);
        return;
      }

      try {
        const wishlistSongIds = await getWishlistSongIds(userId);
        setIsLiked(wishlistSongIds.includes(song.id));

        const downloads = await getDownloads(userId);
        setIsDownloaded(downloads.some(d => d.song.id === song.id));
      } catch (error) {
        console.error('Error loading wishlist/download status:', error);
        setIsLiked(false);
        setIsDownloaded(false);
      }
    };

    loadWishlistStatus();
  }, [song?.id, userId]);

  // Đăng ký audio element khi mount
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      registerAudio(audio);
      return () => {
        unregisterAudio(audio);
      };
    }
  }, [registerAudio, unregisterAudio]);

  // Cập nhật volume riêng biệt để không reload audio
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audio.src) {
      audio.muted = isMuted;
      if (!isMuted) {
        audio.volume = volume;
      }
    }
  }, [volume, isMuted]);

  // Load bài mới + auto play
  useEffect(() => {
    if (!song || !song.audioUrl) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Kiểm tra premium trước khi phát
    const checkPremiumAndPlay = async (): Promise<(() => void) | void> => {
      if (song.type === 'PREMIUM') {
        const { canPlayPremiumSong, isSongOwner } = await import('../../utils/premiumCheck');
        const songArtistId = song.artistId;
        
        // Kiểm tra nếu user là chủ sở hữu
        const isOwner = isSongOwner(songArtistId);
        
        if (!isOwner) {
          const checkResult = await canPlayPremiumSong(
            { type: song.type, artistId: songArtistId }
          );
          
          if (!checkResult.canPlay) {
            // Không có quyền phát, tự động chuyển sang bài tiếp theo
            console.log('Skipping premium song:', song.title);
            playNext();
            return;
          }
        }
      }

      // Dừng tất cả audio khác trước khi phát bài mới
      stopAllAudio(audio);

      // Nếu đang phát cùng một bài thì không reload (tránh reload không cần thiết)
      const currentSrc = audio.src || '';
      const newSrc = song.audioUrl;
      
      // So sánh URL đơn giản - chỉ reload nếu URL thay đổi
      if (currentSrc && currentSrc === newSrc) {
        // Nếu đang phát cùng bài, không làm gì cả (volume đã được xử lý ở useEffect riêng)
        return;
      }

      // Reset state
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      
      // Reset history tracking khi chuyển sang bài mới
      historyAddedRef.current.clear();

      // Ưu tiên dùng file đã cache để phát offline
      const cachedUrl = song.id ? await getCachedSongUrl(song.id) : null;
      const newSource = cachedUrl || song.audioUrl;

      if (!newSource) {
        alert(t('alerts.unknownError') || 'Không tìm thấy file audio.');
        return;
      }

      if (!cachedUrl && !navigator.onLine) {
        alert(t('alerts.offlinePlaybackNotAvailable') || 'Không có kết nối Internet và chưa tải sẵn bài hát.');
        playNext();
        return;
      }

      audio.src = newSource;
      audio.load();

      // Cần chờ metadata để lấy duration
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      // Update current time (chỉ khi không đang kéo)
      const updateTime = () => {
        if (!isDraggingRef.current) {
          setCurrentTime(audio.currentTime);
        }
      };

      // Handle play/pause state
      const handlePlay = async () => {
        setIsPlaying(true);
        
        // Tự động thêm vào lịch sử và tăng lượt nghe khi bài hát bắt đầu phát (chỉ một lần)
        if (song.id && !historyAddedRef.current.has(song.id)) {
          historyAddedRef.current.add(song.id);
          
          try {
            // Lấy userId
            const storedUserId = localStorage.getItem('userId');
            let userId: number | null = null;
            
            if (storedUserId) {
              userId = parseInt(storedUserId);
            } else {
              const token = localStorage.getItem('token');
              if (token) {
                try {
                  const user = await getCurrentUser();
                  if (user.id) {
                    userId = user.id;
                    localStorage.setItem('userId', user.id.toString());
                  }
                } catch (error) {
                  console.error('Error loading user:', error);
                }
              }
            }
            
            // Tăng lượt nghe và thêm vào lịch sử
            if (userId) {
              await Promise.all([
                incrementSongViews(song.id),
                addHistory(userId, song.id)
              ]);
            } else {
              // Vẫn tăng lượt nghe ngay cả khi chưa đăng nhập
              await incrementSongViews(song.id);
            }
          } catch (error) {
            console.error('Error updating history/views:', error);
            // Nếu lỗi, xóa khỏi set để có thể thử lại
            historyAddedRef.current.delete(song.id);
          }
        }
      };
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        // Tự động chuyển bài tiếp theo khi hết
        if (repeatMode === 'one') {
          // Lặp lại bài hiện tại
          audio.currentTime = 0;
          audio.play().catch(console.error);
        } else {
          // Chuyển sang bài tiếp theo
          // Sử dụng setTimeout để đảm bảo state đã được cập nhật
          setTimeout(() => {
            playNext();
          }, 100);
        }
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("ended", handleEnded);

      audio.muted = isMuted;
      audio.volume = volume;
      audio.play().catch((error) => {
        console.error("Lỗi phát nhạc:", error);
        setIsPlaying(false);
      });
      setIsPlaying(true);

      // Return cleanup function
      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("timeupdate", updateTime);
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("ended", handleEnded);
      };
    };

    let cleanupHandlers: (() => void) | undefined;

    checkPremiumAndPlay().then((cleanup) => {
      if (cleanup) {
        cleanupHandlers = cleanup;
      }
    });

    // Cleanup function
    return () => {
      if (cleanupHandlers) {
        cleanupHandlers();
      }
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [song, repeatMode, playNext, stopAllAudio]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        // setIsPlaying sẽ được cập nhật bởi event listener 'pause'
      } else {
        await audio.play();
        // setIsPlaying sẽ được cập nhật bởi event listener 'play'
      }
    } catch (error) {
      console.error("Lỗi khi play/pause:", error);
      setIsPlaying(false);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    const audio = audioRef.current;

    if (!audio || !audio.src) return;
    
    // Cập nhật thời gian của audio
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: any) => {
    const v = Number(e.target.value);
    const audio = audioRef.current;

    setVolume(v);
    if (audio) audio.volume = v;
    if (v > 0) setIsMuted(false);
  };

  const handleToggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleClose = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setCurrentlyPlayingSong(null);
  };

  const handleDownload = async () => {
    if (!song?.id || !song.audioUrl) {
      alert(t('alerts.unknownError'));
      return;
    }

    if (!userId) {
      alert(t('alerts.pleaseLogin'));
      return;
    }

    // Chặn tải bài Premium nếu chưa nâng cấp
    if (song.type === 'PREMIUM') {
      const { canPlayPremiumSong, isSongOwner } = await import('../../utils/premiumCheck');
      const isOwner = isSongOwner(song.artistId);
      if (!isOwner) {
        const result = await canPlayPremiumSong({ type: song.type, artistId: song.artistId });
        if (!result.canPlay) {
          alert(result.reason || 'Bài hát này yêu cầu tài khoản Premium để tải.');
          return;
        }
      }
    }

    try {
      setIsDownloading(true);
      await addDownload(userId, song.id);
      await saveSongToCache(song.id, song.audioUrl);
      setIsDownloaded(true);
      alert(t('downloads.downloaded') || 'Đã lưu vào Tải xuống');
    } catch (error) {
      console.error('Error downloading song:', error);
      alert('Có lỗi khi tải bài hát. Vui lòng thử lại.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleToggleLike = async () => {
    if (!song?.id || !userId) {
      alert(t('alerts.pleaseLogin'));
      return;
    }

    try {
      const response = await toggleWishlist(userId, song.id);
      setIsLiked(response.isFavorite);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert(t('alerts.unknownError'));
    }
  };

  if (!song) return null;

  return (
    <>
      <audio ref={audioRef} />

      <div className="fixed bottom-0 left-0 right-0 w-full bg-[#181C33] text-white h-[90px] px-6 py-3 grid grid-cols-3 gap-4 z-[9999] border-t border-[#252B4D]">

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          title={t('musicPlayer.close')}
        >
          <IoCloseSharp size={20} />
        </button>

        {/* Left */}
        <div className="flex items-center">
          <img src={song.image} className="w-[64px] h-[64px] rounded-md mr-4" />
          <div className="flex-1">
            <h4 className="font-bold">{song.title}</h4>
            <p className="text-[#DEDEDE] text-sm">{String(song.artist || t('common.unknownArtist'))}</p>
          </div>
          {song.id && (
            <button
              onClick={handleToggleLike}
              className="ml-4 text-2xl transition-colors hover:scale-110"
              title={isLiked ? t('wishlist.removeFromFavorites') : t('wishlist.addToFavorites')}
            >
              {isLiked ? (
                <FaHeart className="text-red-500" />
              ) : (
                <FaRegHeart className="text-gray-400 hover:text-red-500" />
              )}
            </button>
          )}
          {song.id && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="ml-2 text-2xl transition-colors hover:scale-110 disabled:opacity-50"
              title={
                isDownloaded
                  ? t('downloads.title')
                  : song.type === 'PREMIUM'
                    ? t('downloads.viewMore') || 'Yêu cầu Premium để tải'
                    : t('downloads.title')
              }
            >
              {isDownloaded ? (
                <IoCheckmarkDoneSharp className="text-[#3BC8E7]" />
              ) : (
                <IoCloudDownloadOutline className="text-gray-300 hover:text-white" />
              )}
            </button>
          )}
        </div>

        {/* Center */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-4 text-2xl text-gray-300">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`transition-colors ${isShuffle ? 'text-[#3BC8E7]' : 'text-gray-300 hover:text-white'}`}
              title={t('musicPlayer.shuffle')}
            >
              <IoShuffleOutline />
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Previous clicked');
                playPrevious();
              }}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer"
              title={t('musicPlayer.previous')}
            >
              <IoPlaySkipBackSharp />
            </button>

            <button
              onClick={handlePlayPause}
              className="bg-white text-black rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition-colors"
              title={isPlaying ? t('musicPlayer.pause') : t('musicPlayer.play')}
            >
              {isPlaying ? <IoPauseSharp /> : <IoPlaySharp />}
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Next clicked');
                playNext();
              }}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer"
              title={t('musicPlayer.next')}
            >
              <IoPlaySkipForwardSharp />
            </button>
            
            <button
              onClick={() => {
                if (repeatMode === 'off') setRepeatMode('all');
                else if (repeatMode === 'all') setRepeatMode('one');
                else setRepeatMode('off');
              }}
              className={`transition-colors ${
                repeatMode !== 'off' ? 'text-[#3BC8E7]' : 'text-gray-300 hover:text-white'
              }`}
              title={`${t('musicPlayer.repeat')}: ${repeatMode === 'off' ? t('musicPlayer.repeatOff') : repeatMode === 'all' ? t('musicPlayer.repeatAll') : t('musicPlayer.repeatOne')}`}
            >
              {repeatMode === 'one' ? <IoRepeat /> : <IoRepeatOutline />}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full mt-2">
            <span className="text-xs">{formatTime(currentTime)}</span>

            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleProgressChange}
              onMouseDown={() => {
                isDraggingRef.current = true;
              }}
              onMouseUp={() => {
                isDraggingRef.current = false;
                // Tiếp tục phát sau khi thả chuột nếu đang phát
                const audio = audioRef.current;
                if (audio && isPlaying) {
                  audio.play().catch(console.error);
                }
              }}
              className="w-full accent-[#3BC8E7] cursor-pointer"
            />

            <span className="text-xs">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-3">
          <button onClick={handleToggleMute} className="text-2xl">
            {isMuted || volume === 0 ? <IoVolumeMuteSharp /> : <IoVolumeHighSharp />}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-[120px] accent-[#3BC8E7]"
          />
        </div>
      </div>
    </>
  );
};

export default MusicPlayerBar;
