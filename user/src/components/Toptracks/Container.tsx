import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { Gem } from "lucide-react";
import { getTopTracksOfAllTime, getWeeklyTopTracks, type TrendingSong, incrementSongViews } from "../../services/song.service";
import { getAlbumById } from "../../services/album.service";
import { addHistory } from "../../services/history.service";
import { getCurrentUser } from "../../services/auth.service";
import { useMusic } from "../../contexts/MusicContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { FaComment } from "react-icons/fa";
import CommentModal from "../Comments/CommentModal";

interface TrendingSongWithAlbum extends TrendingSong {
  albumCover?: string;
  albumTitle?: string;
}

const Container = () => {
  const navigate = useNavigate();
  const [allTimeSongs, setAllTimeSongs] = useState<TrendingSongWithAlbum[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<TrendingSongWithAlbum[]>([]);
  const [songDurations, setSongDurations] = useState<Record<number, string>>({}); // Lưu duration đã load từ audio
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [userId, setUserId] = useState<number | null>(null);
  const [currentlyPlayingSong, setCurrentlyPlayingSong] = useState<{
    title: string;
    artist: string;
    image: string;
    audioUrl: string;
  } | null>(null);
  const { setQueue, setCurrentlyPlayingSong: setContextSong, setCurrentIndex: setContextIndex } = useMusic();
  const { t } = useLanguage();
  const [commentModal, setCommentModal] = useState<{ isOpen: boolean; songId: number; songTitle: string }>({
    isOpen: false,
    songId: 0,
    songTitle: '',
  });

  // Lấy userId
  useEffect(() => {
    const loadUserId = async () => {
      const storedUserId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (storedUserId) {
        setUserId(parseInt(storedUserId));
      } else if (token) {
        try {
          const user = await getCurrentUser();
          if (user.id) {
            setUserId(user.id);
            localStorage.setItem('userId', user.id.toString());
          }
        } catch (error) {
          console.error("Lỗi không lấy được thông tin user:", error);
        }
      }
    };
    loadUserId();
  }, []);

  // Load Top Tracks Of All Time và Trending Tracks
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        
        // Load cả hai API song song
        const [allTimeData, trendingData] = await Promise.all([
          getTopTracksOfAllTime(50).catch(() => []),
          getWeeklyTopTracks(4).catch(() => []), // Trending Tracks: top 4 bài hát tuần
        ]);
        
        // Load album info cho all-time tracks
        const allTimeWithAlbum = await Promise.all(
          allTimeData.map(async (item) => {
            // Ưu tiên sử dụng coverImage của bài hát
            let albumCover = item.song.coverImage || "./Toptracks/sing1.jpg";
            let albumTitle = "";
            
            if (item.song.albumId) {
              try {
                const album = await getAlbumById(item.song.albumId);
                albumTitle = album.title;
                // Chỉ dùng ảnh album nếu bài hát không có coverImage
                if (!item.song.coverImage && album.coverImage) {
                  albumCover = album.coverImage;
                }
              } catch (error) {
                console.error(`Error loading album ${item.song.albumId}:`, error);
              }
            }
            
            return { ...item, albumCover, albumTitle };
          })
        );

        // Load album info cho trending tracks
        const trendingWithAlbum = await Promise.all(
          trendingData.map(async (item) => {
            // Ưu tiên sử dụng coverImage của bài hát
            let albumCover = item.song.coverImage || "./TrendingTrack/D1.png";
            let albumTitle = "";
            
            if (item.song.albumId) {
              try {
                const album = await getAlbumById(item.song.albumId);
                albumTitle = album.title;
                // Chỉ dùng ảnh album nếu bài hát không có coverImage
                if (!item.song.coverImage && album.coverImage) {
                  albumCover = album.coverImage;
                }
              } catch (error) {
                console.error(`Error loading album ${item.song.albumId}:`, error);
              }
            }
            
            return { ...item, albumCover, albumTitle };
          })
        );

        setAllTimeSongs(allTimeWithAlbum);
        setTrendingTracks(trendingWithAlbum);
      } catch (error) {
        console.error("Lỗi không tải được top tracks:", error);
        setAllTimeSongs([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Load duration từ audio metadata cho Trending Tracks
  useEffect(() => {
    if (trendingTracks.length === 0) return;

    const loadDurationsFromAudio = async () => {
      const durationMap: Record<number, string> = {};
      
      await Promise.all(
        trendingTracks.map(async (song) => {
          const songDuration = song.song.duration;
          const hasValidDuration = songDuration && 
            songDuration !== '0:00' && 
            songDuration !== '00:00:00' && 
            parseFloat(songDuration) > 0;
          
          if (!hasValidDuration && song.song.fileUrl) {
            try {
              const audio = new Audio(song.song.fileUrl);
              await new Promise<void>((resolve) => {
                const handleLoadedMetadata = () => {
                  if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    const mins = Math.floor(audio.duration / 60);
                    const secs = Math.floor(audio.duration % 60);
                    durationMap[song.song.id] = `${mins}:${secs.toString().padStart(2, '0')}`;
                  }
                  audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                  audio.removeEventListener('error', handleError);
                  resolve();
                };
                
                const handleError = () => {
                  audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                  audio.removeEventListener('error', handleError);
                  resolve();
                };
                
                audio.addEventListener('loadedmetadata', handleLoadedMetadata);
                audio.addEventListener('error', handleError);
                audio.load();
                
                // Timeout sau 5 giây
                setTimeout(() => {
                  audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                  audio.removeEventListener('error', handleError);
                  resolve();
                }, 5000);
              });
            } catch (error) {
              console.error(`Error loading duration for trending track ${song.song.id}:`, error);
            }
          }
        })
      );
      
      if (Object.keys(durationMap).length > 0) {
        setSongDurations(prev => ({ ...prev, ...durationMap }));
      }
    };
    
    loadDurationsFromAudio();
  }, [trendingTracks]);

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSongClick = async (song: TrendingSongWithAlbum, sourceList: TrendingSongWithAlbum[]) => {
    if (!song.song.fileUrl) {
      alert(t('alerts.noAudioFile'));
      return;
    }

    // Kiểm tra premium trước khi phát
    if (song.song.type === 'PREMIUM') {
      const { canPlayPremiumSong, isSongOwner } = await import('../../utils/premiumCheck');
      const songArtistId = song.song.artistId || song.song.artist?.id;
      
      // Kiểm tra nếu user là chủ sở hữu
      const isOwner = isSongOwner(songArtistId);
      
      if (!isOwner) {
        const checkResult = await canPlayPremiumSong(
          { type: song.song.type, artistId: songArtistId }
        );
        
        if (!checkResult.canPlay) {
          alert(checkResult.reason || t('alerts.premiumRequired'));
          return;
        }
      }
    }

    const artistName = song.song.artist?.artistName || t('common.unknownArtist');
    const songData = {
      title: song.song.title,
      artist: artistName,
      image: song.albumCover || "./Toptracks/sing1.jpg",
      audioUrl: song.song.fileUrl,
      id: song.song.id,
      type: song.song.type,
      artistId: song.song.artistId,
    };
    
    setCurrentlyPlayingSong(songData);
    setContextSong(songData);

    // Set queue với tất cả bài hát từ sourceList
    const queue = sourceList.map(i => ({
      title: i.song.title,
      artist: i.song.artist?.artistName || "Unknown Artist",
      image: i.albumCover || "./Toptracks/sing1.jpg",
      audioUrl: i.song.fileUrl || "",
      id: i.song.id,
      type: i.song.type,
      artistId: i.song.artistId,
    })).filter(s => s.audioUrl);
    
    const index = queue.findIndex(s => 
      s.audioUrl === songData.audioUrl || (s.id && songData.id && s.id === songData.id)
    );
    
    setQueue(queue);
    setContextIndex(index !== -1 ? index : 0);

    // Tăng lượt nghe và thêm vào history
    try {
      await incrementSongViews(song.song.id);
      if (userId) {
        await addHistory(userId, song.song.id);
      }
    } catch (error) {
      console.error("Lỗi cập nhật lượt nghe/history:", error);
    }
  };

  // Tính toán phân trang
  const totalPages = Math.ceil(allTimeSongs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const visibleSongs = allTimeSongs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top khi đổi trang
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Hiển thị tất cả các trang nếu ít hơn maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic hiển thị trang với ellipsis
      if (currentPage <= 3) {
        // Trang đầu
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Trang cuối
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Trang giữa
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="mt-[43px] flex justify-center items-center h-[400px]">
        <span className="text-white text-lg">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <>
      <div className="mt-[43px]">
        <div className="flex justify-between mt-[-511px]">
          <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold ">
            {t('topTracks.allTime')}
          </span>
          <span className="mr-[165px] text-white text-[15px]">{t('common.viewMore')}</span>
        </div>

        <div className="flex flex-col items-center mt-[32px]">
          {/* Danh sách bài hát */}
          <div className="flex gap-[30px] items-center">
            {visibleSongs.length === 0 ? (
              <div className="text-center text-gray-400 py-20 w-full">
                <p className="text-lg mb-2">{t('common.noSongs')}</p>
              </div>
            ) : (
              visibleSongs.map((song) => {
                const artistName = song.song.artist?.artistName || t('common.unknownArtist');
                const isPlaying = currentlyPlayingSong?.title === song.song.title;
                return (
                  <div 
                    key={song.song.id}
                    className={`text-white w-[175px] h-[256px] hover:scale-[1.05] transition-transform duration-200 cursor-pointer relative group ${isPlaying ? 'ring-2 ring-[#3BC8E7] rounded-[10px]' : ''}`}
                    onClick={() => handleSongClick(song, allTimeSongs)}
                  >
                    <img
                      className="rounded-[10px] mb-[19.18px] w-[175px] h-[175px] object-cover"
                      src={song.albumCover || "./Toptracks/sing1.jpg"}
                      alt={song.song.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "./Toptracks/sing1.jpg";
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCommentModal({
                          isOpen: true,
                          songId: song.song.id,
                          songTitle: song.song.title,
                        });
                      }}
                      className="absolute top-2 right-2 bg-[#3BC8E7] text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('common.comment')}
                    >
                      <FaComment size={14} />
                    </button>
                    <h3 className="font-semibold mb-1">
                      <span 
                        className="hover:text-[#3BC8E7] transition flex items-center gap-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/song/${song.song.id}`);
                        }}
                      >
                        {song.song.title}
                        {song.song.type === 'PREMIUM' && (
                          <span title="Premium">
                            <Gem className="w-3 h-3 text-[#3BC8E7]" />
                          </span>
                        )}
                      </span>
                    </h3>
                    <h3 className="text-[#DEDEDE] h-[24px]">{artistName}</h3>
                    {song.playCount && (
                      <p className="text-[#3BC8E7] text-xs mt-1">
                        {song.playCount} {t('duration.timesPlayed')}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-white transition-colors ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[#3BC8E7] hover:text-white'
                }`}
              >
                <FaChevronLeft />
              </button>

              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="text-white px-2">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page as number)}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      currentPage === page
                        ? 'bg-[#3BC8E7] text-white font-semibold'
                        : 'text-white hover:bg-[#3BC8E7] hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-white transition-colors ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[#3BC8E7] hover:text-white'
                }`}
              >
                <FaChevronRight />
              </button>
            </div>
          )}
        </div>

        <div className="mt-[64px]">
          <div className="flex justify-between">
            <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold ">
              {t('topTracks.trendingTracks')}
            </span>
            <span className="mr-[165px] text-white text-[15px]">{t('common.viewMore')}</span>
          </div>
          <div className="w-[1200px] h-[83px] ">
            <div className="w-[1200px] h-[10px] ml-[160px] mt-[24px]">
              <hr className="text-[#252B4DBF]" />

              {/* Dots indicator - giữ nguyên design */}
              <div className="relative flex items-center ">
                <div className="absolute w-[10px] h-[10px] left-[345.5px]  bg-[#3BC8E7] rounded-full">
                  <div className="absolute w-[6px] h-[6px] left-[2px] top-[2px] bg-[#14182A] rounded-full"></div>
                </div>
              </div>

              <div className="relative flex items-center">
                <div className="absolute w-[10px] h-[10px] left-[38px]  bg-[#FFFF] rounded-full">
                  <div className="absolute w-[6px] h-[6px] left-[2px] top-[2px] bg-[#14182A] rounded-full"></div>
                </div>
              </div>

              <div className="relative flex items-center">
                <div className="absolute w-[10px] h-[10px] left-[654px]  bg-[#3BC8E7] rounded-full">
                  <div className="absolute w-[6px] h-[6px] left-[2px] top-[2px] bg-[#14182A] rounded-full"></div>
                </div>
              </div>

              <div className="relative flex items-center ">
                <div className="absolute w-[10px] h-[10px] left-[960.5px] bg-[#3BC8E7] rounded-full">
                  <div className="absolute w-[6px] h-[6px] left-[2px] top-[2px] bg-[#14182A] rounded-full"></div>
                </div>
              </div>

              {/* Trending Tracks List */}
              {trendingTracks.length === 0 ? (
                <div className="text-center text-gray-400 py-10 mt-[16px]">
                  <p className="text-sm">Chưa có bài hát nào</p>
                </div>
              ) : (
                <div className="flex mt-[16px]">
                  {trendingTracks.map((song, index) => {
                    const artistName = song.song.artist?.artistName || t('common.unknownArtist');
                    const duration = song.song.duration ? parseFloat(song.song.duration) : undefined;
                    const isPlaying = currentlyPlayingSong?.title === song.song.title;
                    const defaultImages = ["./TrendingTrack/D1.png", "./TrendingTrack/D2.png", "./TrendingTrack/D3.png", "./TrendingTrack/D4.png"];
                    // Ưu tiên duration đã load từ audio, nếu không có thì dùng từ API
                    const displayDuration = songDurations[song.song.id] || formatDuration(duration);
                    
                    return (
                      <div
                        key={song.song.id}
                        className={`w-[267px] h-[50px] ${index > 0 ? 'ml-[40px]' : 'ml-[10px]'} flex text-white cursor-pointer hover:opacity-80 transition-opacity ${isPlaying ? 'opacity-100' : ''}`}
                        onClick={() => handleSongClick(song, trendingTracks)}
                      >
                        <img
                          className="w-[50px] h-[50px] rounded-[5px] object-cover"
                          src={song.albumCover || defaultImages[index] || "./TrendingTrack/D1.png"}
                          alt={song.song.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = defaultImages[index] || "./TrendingTrack/D1.png";
                          }}
                        />
                        <span className="mr-[6.67px] text-[14px] ml-[20px]">
                          <h3 
                            className="w-[126px] h-[20px] mb-[6.8px] hover:text-[#3BC8E7] transition flex items-center gap-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/song/${song.song.id}`);
                            }}
                          >
                            {song.song.title}
                            {song.song.type === 'PREMIUM' && (
                              <span title="Premium">
                                <Gem className="w-3 h-3 text-[#3BC8E7] flex-shrink-0" />
                              </span>
                            )}
                          </h3>
                          <h3 className="w-[78px] h-[20px]">{artistName}</h3>
                        </span>
                        <h3 className="text-[15px]">{displayDuration}</h3>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={commentModal.isOpen}
        onClose={() => setCommentModal({ isOpen: false, songId: 0, songTitle: '' })}
        songId={commentModal.songId}
        songTitle={commentModal.songTitle}
      />
    </>
  );
};

export default Container;
