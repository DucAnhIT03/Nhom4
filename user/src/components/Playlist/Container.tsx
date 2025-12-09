import { useState, useEffect } from "react";
import { getMostPlayedSongs, addHistory, type MostPlayedItem, getFavoriteGenresPopularSongs, type FavoriteGenresPopularItem } from "../../services/history.service";
import { getCurrentUser } from "../../services/auth.service";
import { getAlbumById } from "../../services/album.service";
import { incrementSongViews, getWeeklyTopTracks, getTopTracksOfAllTime, type TrendingSong } from "../../services/song.service";
import { useMusic } from "../../contexts/MusicContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { FaArrowLeft, FaComment } from "react-icons/fa";
import CommentModal from "../Comments/CommentModal";
import { Gem } from "lucide-react";

interface MostPlayedItemWithAlbum extends MostPlayedItem {
  albumCover?: string;
  albumTitle?: string;
}

interface TrendingSongWithAlbum extends TrendingSong {
  albumCover?: string;
  albumTitle?: string;
}

interface FavoriteGenresItemWithAlbum extends FavoriteGenresPopularItem {
  albumCover?: string;
  albumTitle?: string;
}

type PlaylistTheme = 'themes' | 'my-favorites' | 'trending' | 'favorite-genres' | 'all-time';

const Container = () => {
  const [selectedTheme, setSelectedTheme] = useState<PlaylistTheme>('themes');
  const [myFavoritesItems, setMyFavoritesItems] = useState<MostPlayedItemWithAlbum[]>([]);
  const [trendingItems, setTrendingItems] = useState<TrendingSongWithAlbum[]>([]);
  const [favoriteGenresItems, setFavoriteGenresItems] = useState<FavoriteGenresItemWithAlbum[]>([]);
  const [allTimeItems, setAllTimeItems] = useState<TrendingSongWithAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [currentlyPlayingSong, setCurrentlyPlayingSong] = useState<{
    title: string;
    artist: string;
    image: string;
    audioUrl: string;
  } | null>(null);
  const { setQueue, setCurrentlyPlayingSong: setContextSong, setCurrentIndex } = useMusic();
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

  // Load tất cả dữ liệu
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        
        console.log('Loading playlist data...', { userId });
        
        // Load dữ liệu không cần userId (all-time, trending) - luôn load
        const [trendingData, allTimeData] = await Promise.all([
          getWeeklyTopTracks(50).catch((err) => {
            console.error('Error loading weekly top tracks:', err);
            return [];
          }),
          getTopTracksOfAllTime(50).catch((err) => {
            console.error('Error loading top tracks of all time:', err);
            return [];
          }),
        ]);

        console.log('Loaded all-time data:', allTimeData.length, 'items');

        // Load dữ liệu cần userId (nếu có)
        let myFavoritesData: MostPlayedItem[] = [];
        let favoriteGenresData: FavoriteGenresPopularItem[] = [];
        
        if (userId) {
          [myFavoritesData, favoriteGenresData] = await Promise.all([
            getMostPlayedSongs(userId).catch(() => []),
            getFavoriteGenresPopularSongs(userId).catch(() => []),
          ]);
        }

        // Load album info cho my favorites
        const myFavoritesWithAlbum = await Promise.all(
          myFavoritesData.map(async (item) => {
            let albumCover = "./History/s1.jpg";
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

        // Load album info cho trending
        const trendingWithAlbum = await Promise.all(
          trendingData.map(async (item) => {
            let albumCover = "./History/s1.jpg";
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

        // Load album info cho favorite genres
        const favoriteGenresWithAlbum = await Promise.all(
          favoriteGenresData.map(async (item) => {
            let albumCover = "./History/s1.jpg";
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

        // Load album info cho all-time
        const allTimeWithAlbum = await Promise.all(
          allTimeData.map(async (item) => {
            let albumCover = "./History/s1.jpg";
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

        setMyFavoritesItems(myFavoritesWithAlbum);
        setTrendingItems(trendingWithAlbum);
        setFavoriteGenresItems(favoriteGenresWithAlbum);
        setAllTimeItems(allTimeWithAlbum);
        
        console.log('Playlist data loaded:', {
          myFavorites: myFavoritesWithAlbum.length,
          trending: trendingWithAlbum.length,
          favoriteGenres: favoriteGenresWithAlbum.length,
          allTime: allTimeWithAlbum.length,
        });
      } catch (error) {
        console.error("Lỗi không tải được playlist:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [userId]);

  const handleSongClick = async (song: any, allSongs: any[]) => {
    if (!song.song?.fileUrl) {
      alert("Bài hát này không có file audio");
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
          alert(checkResult.reason || 'Bài hát này yêu cầu tài khoản Premium.');
          return;
        }
      }
    }

    const artistName = song.song.artist?.artistName || "Unknown Artist";
    const songData = {
      title: song.song.title,
      artist: artistName,
      image: song.albumCover || "./History/s1.jpg",
      audioUrl: song.song.fileUrl,
      id: song.song.id,
      type: song.song.type,
      artistId: song.song.artistId,
    };
    
    setCurrentlyPlayingSong(songData);
    setContextSong(songData);

    // Set queue với tất cả bài hát trong chủ đề hiện tại
    const queue = allSongs.map(i => ({
      title: i.song.title,
      artist: i.song.artist?.artistName || "Unknown Artist",
      image: i.albumCover || "./History/s1.jpg",
      audioUrl: i.song.fileUrl || "",
      id: i.song.id,
      type: i.song.type,
      artistId: i.song.artistId,
    })).filter(s => s.audioUrl);
    
    const index = queue.findIndex(s => 
      s.audioUrl === songData.audioUrl || (s.id && songData.id && s.id === songData.id)
    );
    
    setQueue(queue);
    setCurrentIndex(index !== -1 ? index : 0);

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

  const renderSongs = (items: any[]) => {
    const rows: any[][] = [];
    for (let i = 0; i < items.length; i += 6) {
      rows.push(items.slice(i, i + 6));
    }

    return (
      <>
        {items.length === 0 ? (
          <div className="text-center text-gray-400 py-20 mt-[50px]">
            <p className="text-lg mb-2">{t('common.noSongs')}</p>
          </div>
        ) : (
          <>
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-[30px] mt-[32px] ml-[120px]">
                {row.map((item) => {
                  const artistName = item.song?.artist?.artistName || "Unknown Artist";
                  const isPlaying = currentlyPlayingSong?.title === item.song?.title;
                  return (
                    <div 
                      key={item.song?.id} 
                      className={`text-white w-[175px] h-[256px] hover:scale-[1.05] transition-transform duration-200 cursor-pointer relative group ${isPlaying ? 'ring-2 ring-[#3BC8E7] rounded-[10px]' : ''}`}
                      onClick={() => handleSongClick(item, items)}
                    >
                      <img
                        className="rounded-[10px] mb-[19.18px] w-[175px] h-[175px] object-cover"
                        src={item.albumCover || "./History/s1.jpg"}
                        alt={item.song?.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "./History/s1.jpg";
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommentModal({
                            isOpen: true,
                            songId: item.song.id,
                            songTitle: item.song.title,
                          });
                        }}
                        className="absolute top-2 right-2 bg-[#3BC8E7] text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xem bình luận"
                      >
                        <FaComment size={14} />
                      </button>
                      <h3 className="font-semibold mb-1">
                        <span className="hover:text-[#3BC8E7] transition flex items-center gap-1">
                          {item.song?.title}
                          {item.song?.type === 'PREMIUM' && (
                            <span title="Premium">
                              <Gem className="w-3 h-3 text-[#3BC8E7]" />
                            </span>
                          )}
                        </span>
                      </h3>
                      <h3 className="text-[#DEDEDE] h-[24px]">{artistName}</h3>
                      {item.playCount && (
                        <p className="text-[#3BC8E7] text-xs mt-1">
                          {item.playCount} lần nghe
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="mt-[43px] flex justify-center items-center h-[400px]">
        <span className="text-white text-lg">{t('common.loading')}</span>
      </div>
    );
  }

  // Hiển thị danh sách chủ đề
  if (selectedTheme === 'themes') {
    return (
      <>
        <div className="mt-[43px]">
          <div className="flex justify-between mt-[-511px]">
            <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold">
              {t('playlist.title')}
            </span>
          </div>

          <div className="flex flex-col gap-6 mt-[50px] ml-[160px] mr-[160px]">
            {/* Chủ đề 1: Bài hát user hay nghe */}
            <div 
              className="bg-[#1B2039] rounded-lg p-6 cursor-pointer hover:bg-[#252B4D] transition-colors"
              onClick={() => setSelectedTheme('my-favorites')}
            >
              <h3 className="text-[#3BC8E7] text-xl font-semibold mb-2">
                {t('playlist.myFavorites')}
              </h3>
              <p className="text-gray-400 text-sm">
                {myFavoritesItems.length} {t('common.playlist')} • {t('playlist.songsYouListenMost')}
              </p>
            </div>

            {/* Chủ đề 2: Bài hát đang thịnh hành */}
            <div 
              className="bg-[#1B2039] rounded-lg p-6 cursor-pointer hover:bg-[#252B4D] transition-colors"
              onClick={() => setSelectedTheme('trending')}
            >
              <h3 className="text-[#3BC8E7] text-xl font-semibold mb-2">
                {t('playlist.trending')}
              </h3>
              <p className="text-gray-400 text-sm">
                {trendingItems.length} {t('common.playlist')} • {t('playlist.songsEveryoneListens')}
              </p>
            </div>

            {/* Chủ đề 3: Bài hát thể loại yêu thích */}
            <div 
              className="bg-[#1B2039] rounded-lg p-6 cursor-pointer hover:bg-[#252B4D] transition-colors"
              onClick={() => setSelectedTheme('favorite-genres')}
            >
              <h3 className="text-[#3BC8E7] text-xl font-semibold mb-2">
                {t('playlist.favoriteGenres')}
              </h3>
              <p className="text-gray-400 text-sm">
                {favoriteGenresItems.length} {t('common.playlist')} • {t('playlist.popularSongsOfGenres')}
              </p>
            </div>

            {/* Chủ đề 4: Top Tracks Of All Time */}
            <div 
              className="bg-[#1B2039] rounded-lg p-6 cursor-pointer hover:bg-[#252B4D] transition-colors"
              onClick={() => setSelectedTheme('all-time')}
            >
              <h3 className="text-[#3BC8E7] text-xl font-semibold mb-2">
                Top Tracks Of All Time
              </h3>
              <p className="text-gray-400 text-sm">
                {allTimeItems.length} bài hát • Những bài hát được nghe nhiều nhất mọi thời đại
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Hiển thị danh sách bài hát của chủ đề được chọn
  const getThemeTitle = () => {
    switch (selectedTheme) {
      case 'my-favorites':
        return t('playlist.myFavorites');
      case 'trending':
        return t('playlist.trending');
      case 'favorite-genres':
        return t('playlist.favoriteGenres');
      case 'all-time':
        return t('playlist.allTime');
      default:
        return t('playlist.title');
    }
  };

  const getCurrentItems = () => {
    switch (selectedTheme) {
      case 'my-favorites':
        return myFavoritesItems;
      case 'trending':
        return trendingItems;
      case 'favorite-genres':
        return favoriteGenresItems;
      case 'all-time':
        return allTimeItems;
      default:
        return [];
    }
  };

  return (
    <>
      <div className="mt-[43px]">
        <div className="flex justify-between items-center mt-[-511px]">
          <div className="flex items-center gap-4 ml-[160px]">
            <button
              onClick={() => setSelectedTheme('themes')}
              className="text-[#3BC8E7] hover:text-[#2CC8E5] transition-colors"
            >
              <FaArrowLeft size={20} />
            </button>
            <span className="text-[#3BC8E7] text-[18px] font-semibold">
              {getThemeTitle()}
            </span>
          </div>
        </div>

        {renderSongs(getCurrentItems())}
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
