import { useState, useEffect } from "react";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
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
  const [allTimeSongs, setAllTimeSongs] = useState<TrendingSongWithAlbum[]>([]);
  const [weeklyTop15, setWeeklyTop15] = useState<TrendingSongWithAlbum[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<TrendingSongWithAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  // Load Top Tracks Of All Time và Weekly Top 15
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        
        // Load cả ba API song song
        const [allTimeData, weeklyData, trendingData] = await Promise.all([
          getTopTracksOfAllTime(50).catch(() => []),
          getWeeklyTopTracks(15).catch(() => []),
          getWeeklyTopTracks(4).catch(() => []), // Trending Tracks: top 4 bài hát tuần
        ]);
        
        // Load album info cho all-time tracks
        const allTimeWithAlbum = await Promise.all(
          allTimeData.map(async (item) => {
            let albumCover = "./Toptracks/sing1.jpg";
            let albumTitle = "";
            
            if (item.song.albumId) {
              try {
                const album = await getAlbumById(item.song.albumId);
                albumTitle = album.title;
                if (album.coverImage) {
                  albumCover = album.coverImage;
                }
              } catch (error) {
                console.error(`Error loading album ${item.song.albumId}:`, error);
              }
            }
            
            return { ...item, albumCover, albumTitle };
          })
        );

        // Load album info cho weekly top 15
        const weeklyWithAlbum = await Promise.all(
          weeklyData.map(async (item) => {
            let albumCover = "./Weeklytop15/C1.jpg";
            let albumTitle = "";
            
            if (item.song.albumId) {
              try {
                const album = await getAlbumById(item.song.albumId);
                albumTitle = album.title;
                if (album.coverImage) {
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
            let albumCover = "./TrendingTrack/D1.png";
            let albumTitle = "";
            
            if (item.song.albumId) {
              try {
                const album = await getAlbumById(item.song.albumId);
                albumTitle = album.title;
                if (album.coverImage) {
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
        setWeeklyTop15(weeklyWithAlbum);
        setTrendingTracks(trendingWithAlbum);
      } catch (error) {
        console.error("Lỗi không tải được top tracks:", error);
        setAllTimeSongs([]);
        setWeeklyTop15([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRank = (index: number): string => {
    return (index + 1).toString().padStart(2, '0');
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

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    const maxIndex = Math.max(0, allTimeSongs.length - 6);
    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Lấy 6 bài hát hiện tại để hiển thị
  const visibleSongs = allTimeSongs.slice(currentIndex, currentIndex + 6);

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

        <div className="flex gap-[30px] mt-[32px] ml-[120px] items-center">
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`text-white ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#3BC8E7] transition-colors'}`}
          >
            <FaChevronLeft />
          </button>

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
                    <span className="hover:text-[#3BC8E7] transition flex items-center gap-1">
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

          <button 
            onClick={handleNext}
            disabled={currentIndex >= Math.max(0, allTimeSongs.length - 6)}
            className={`text-white ${currentIndex >= Math.max(0, allTimeSongs.length - 6) ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#3BC8E7] transition-colors'}`}
          >
            <FaChevronRight />
          </button>
        </div>

        <div>
          <div>
            <h3 className=" text-[#3BC8E7] w-[133px] h-[26px] ml-[160px] mt-[64px]">
              {t('topTracks.weeklyTop15')}
            </h3>
          </div>

          {weeklyTop15.length === 0 ? (
            <div className="text-center text-gray-400 py-20 mt-[24px]">
              <p className="text-lg mb-2">{t('common.noSongs')}</p>
            </div>
          ) : (
            <div className="flex">
              {/* Cột 1: Bài 1-5 */}
              <div className="ml-[160px] mt-[24px]">
                {weeklyTop15.slice(0, 5).map((song, index) => {
                  const artistName = song.song.artist?.artistName || t('common.unknownArtist');
                  const duration = song.song.duration ? parseFloat(song.song.duration) : undefined;
                  const isPlaying = currentlyPlayingSong?.title === song.song.title;
                  
                  return (
                    <div
                      key={song.song.id}
                      className={`h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center cursor-pointer hover:bg-[#1B2039] transition-colors ${isPlaying ? 'bg-[#1B2039]' : ''}`}
                      onClick={() => handleSongClick(song, weeklyTop15)}
                    >
                      <div className="flex text-white">
                        <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                          {formatRank(index)}
                        </h1>
                        <img
                          className="w-[50px] h-[50px] rounded-[5px] mr-[20px] object-cover"
                          src={song.albumCover || "./Weeklytop15/C1.jpg"}
                          alt={song.song.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "./Weeklytop15/C1.jpg";
                          }}
                        />
                        <span className="mr-[65.92px] text-[14px]">
                          <h3 className="w-[99px] h-[20px] mb-[6.8px] hover:text-[#3BC8E7] transition flex items-center gap-1">
                            {song.song.title}
                            {song.song.type === 'PREMIUM' && (
                              <span title="Premium">
                                <Gem className="w-3 h-3 text-[#3BC8E7] flex-shrink-0" />
                              </span>
                            )}
                          </h3>
                          <h3 className="w-[78px] h-[20px]">{artistName}</h3>
                        </span>
                        <h3 className="text-[15px]">{formatDuration(duration)}</h3>
                        <HiDotsHorizontal className="ml-[24.08px]" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cột 2: Bài 6-10 */}
              <div className="ml-[40px] mt-[24px]">
                {weeklyTop15.slice(5, 10).map((song, index) => {
                  const artistName = song.song.artist?.artistName || t('common.unknownArtist');
                  const duration = song.song.duration ? parseFloat(song.song.duration) : undefined;
                  const isPlaying = currentlyPlayingSong?.title === song.song.title;
                  
                  return (
                    <div
                      key={song.song.id}
                      className={`h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center cursor-pointer hover:bg-[#1B2039] transition-colors ${isPlaying ? 'bg-[#1B2039]' : ''}`}
                      onClick={() => handleSongClick(song, weeklyTop15)}
                    >
                      <div className="flex text-white">
                        <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                          {formatRank(index + 5)}
                        </h1>
                        <img
                          className="w-[50px] h-[50px] rounded-[5px] mr-[20px] object-cover"
                          src={song.albumCover || "./Weeklytop15/C6.png"}
                          alt={song.song.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "./Weeklytop15/C6.png";
                          }}
                        />
                        <span className="mr-[51px] text-[14px]">
                          <h3 className="w-[114px] h-[20px] mb-[6.8px] hover:text-[#3BC8E7] transition flex items-center gap-1">
                            {song.song.title}
                            {song.song.type === 'PREMIUM' && (
                              <span title="Premium">
                                <Gem className="w-3 h-3 text-[#3BC8E7] flex-shrink-0" />
                              </span>
                            )}
                          </h3>
                          <h3 className="w-[78px] h-[20px]">{artistName}</h3>
                        </span>
                        <h3 className="text-[15px]">{formatDuration(duration)}</h3>
                        <HiDotsHorizontal className="ml-[24.08px]" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cột 3: Bài 11-15 */}
              <div className="ml-[40px] mt-[24px]">
                {weeklyTop15.slice(10, 15).map((song, index) => {
                  const artistName = song.song.artist?.artistName || t('common.unknownArtist');
                  const duration = song.song.duration ? parseFloat(song.song.duration) : undefined;
                  const isPlaying = currentlyPlayingSong?.title === song.song.title;
                  
                  return (
                    <div
                      key={song.song.id}
                      className={`h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center cursor-pointer hover:bg-[#1B2039] transition-colors ${isPlaying ? 'bg-[#1B2039]' : ''}`}
                      onClick={() => handleSongClick(song, weeklyTop15)}
                    >
                      <div className="flex text-white">
                        <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                          {formatRank(index + 10)}
                        </h1>
                        <img
                          className="w-[50px] h-[50px] rounded-[5px] mr-[20px] object-cover"
                          src={song.albumCover || "./Weeklytop15/C11.png"}
                          alt={song.song.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "./Weeklytop15/C11.png";
                          }}
                        />
                        <span className="mr-[35px] text-[14px]">
                          <h3 className="w-[126px] h-[20px] mb-[6.8px] hover:text-[#3BC8E7] transition flex items-center gap-1">
                            {song.song.title}
                            {song.song.type === 'PREMIUM' && (
                              <span title="Premium">
                                <Gem className="w-3 h-3 text-[#3BC8E7] flex-shrink-0" />
                              </span>
                            )}
                          </h3>
                          <h3 className="w-[78px] h-[20px]">{artistName}</h3>
                        </span>
                        <h3 className="text-[15px]">{formatDuration(duration)}</h3>
                        <HiDotsHorizontal className="ml-[24.08px]" />
                      </div>
                    </div>
                  );
                })}
              </div>
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
                          <h3 className="w-[126px] h-[20px] mb-[6.8px] hover:text-[#3BC8E7] transition flex items-center gap-1">
                            {song.song.title}
                            {song.song.type === 'PREMIUM' && (
                              <span title="Premium">
                                <Gem className="w-3 h-3 text-[#3BC8E7] flex-shrink-0" />
                              </span>
                            )}
                          </h3>
                          <h3 className="w-[78px] h-[20px]">{artistName}</h3>
                        </span>
                        <h3 className="text-[15px]">{formatDuration(duration)}</h3>
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
