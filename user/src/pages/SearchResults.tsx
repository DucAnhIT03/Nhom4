import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchSongs } from '../services/song.service';
import type { Song } from '../services/song.service';
import { FaSearch, FaArrowLeft, FaHeart, FaRegHeart } from 'react-icons/fa';
import { Gem } from 'lucide-react';
import Header from '../components/HomePage/Header';
import Sidebar from '../components/HomePage/Sidebar';
import CustomAudioPlayer from '../shared/components/CustomAudioPlayer';
import { useMusic } from '../contexts/MusicContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toggleWishlist, getWishlistSongIds } from '../services/wishlist.service';
import { getCurrentUser } from '../services/auth.service';
import { addHistory } from '../services/history.service';
import { incrementSongViews } from '../services/song.service';
import { canPlayPremiumSong, isSongOwner } from '../utils/premiumCheck';

const SearchResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { t } = useLanguage();
  const { setCurrentlyPlayingSong, setQueue, setCurrentIndex } = useMusic();

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);
  const [likedSongs, setLikedSongs] = useState<number[]>([]);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    if (query) {
      loadSearchResults(query);
    } else {
      setLoading(false);
    }
    loadUserId();
  }, [query]);

  useEffect(() => {
    if (userId) {
      loadWishlist();
    }
  }, [userId]);

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

  const loadWishlist = async () => {
    if (!userId) return;
    try {
      const songIds = await getWishlistSongIds(userId);
      setLikedSongs(songIds);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  const loadSearchResults = async (searchQuery: string) => {
    try {
      setLoading(true);
      console.log('[SearchResults] Loading search results for:', searchQuery);
      const results = await searchSongs(searchQuery, 100);
      console.log('[SearchResults] Results received:', results.length, 'songs');
      setSongs(results);
    } catch (error: any) {
      console.error('Error searching songs:', error);
      console.error('Error details:', error.response?.data);
      alert('Không thể tìm kiếm bài hát. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim().length > 0) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      loadSearchResults(searchInput.trim());
    }
  };

  const handleToggleLike = async (songId: number) => {
    if (!userId) {
      alert(t('alerts.pleaseLogin'));
      return;
    }

    try {
      const response = await toggleWishlist(userId, songId);
      if (response.isFavorite) {
        setLikedSongs((prev) => [...prev, songId]);
      } else {
        setLikedSongs((prev) => prev.filter((id) => id !== songId));
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert(t('alerts.unknownError'));
    }
  };

  const handlePlaySong = async (song: Song) => {
    // Kiểm tra premium
    if (song.type === 'PREMIUM') {
      const isOwner = isSongOwner(song.artistId);
      
      if (!isOwner) {
        const checkResult = await canPlayPremiumSong(
          { type: song.type, artistId: song.artistId }
        );
        
        if (!checkResult.canPlay) {
          alert(checkResult.reason || 'Bài hát này yêu cầu tài khoản Premium.');
          return;
        }
      }
    }

    const musicSong = {
      title: song.title,
      artist: song.artist?.artistName || "Unknown Artist",
      image: song.coverImage || './slide/Song1.jpg',
      audioUrl: song.fileUrl || '',
      id: song.id,
      type: song.type,
      artistId: song.artistId,
    };

    // Set queue với tất cả bài hát trong kết quả tìm kiếm
    const queue = songs
      .filter(s => s.fileUrl)
      .map(s => ({
        title: s.title,
        artist: s.artist?.artistName || "Unknown Artist",
        image: s.coverImage || './slide/Song1.jpg',
        audioUrl: s.fileUrl || '',
        id: s.id,
        type: s.type,
        artistId: s.artistId,
      }));

    const index = queue.findIndex(s => s.id === song.id);
    
    setQueue(queue);
    setCurrentIndex(index >= 0 ? index : 0);
    setCurrentlyPlayingSong(musicSong);

    // Tăng lượt nghe và thêm vào history
    try {
      await incrementSongViews(song.id);
      if (userId) {
        await addHistory(userId, song.id);
      }
    } catch (error) {
      console.error('Error updating views/history:', error);
    }
  };

  return (
    <div className="w-[1520px] min-h-screen text-white bg-[#14182A]">
      <Header />
      <Sidebar />

      <div className="ml-[120px] mt-[-500px] pt-8 pb-20 px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <FaArrowLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </button>

          <h1 className="text-3xl font-bold text-white mb-6">Kết quả tìm kiếm</h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('common.searchPlaceholder')}
                  className="w-full bg-[#1a1a1a] text-white pl-12 pr-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[#3BC8E7] hover:bg-[#2cb1cf] text-[#171C36] rounded-lg font-semibold transition-colors"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center text-white py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3BC8E7]"></div>
            <p className="mt-4">Đang tìm kiếm...</p>
          </div>
        ) : query.trim().length === 0 ? (
          <div className="text-center text-white py-20">
            <p className="text-xl text-gray-400">Nhập từ khóa để tìm kiếm</p>
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center text-white py-20">
            <p className="text-xl text-gray-400">Không tìm thấy kết quả cho "{query}"</p>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-6">
              Tìm thấy {songs.length} {songs.length === 1 ? 'bài hát' : 'bài hát'} cho "{query}"
            </p>

            <div className="space-y-2">
              {songs.map((song) => {
                const isLiked = likedSongs.includes(song.id);
                return (
                  <div
                    key={song.id}
                    className="group grid grid-cols-[50px_2fr_1fr_120px_420px] items-center px-4 py-3 rounded-md hover:bg-[#252B4D] transition cursor-pointer border-b border-transparent hover:border-[#3BC8E7]/20"
                  >
                    <div className="text-center flex justify-center items-center" onClick={(e) => { e.stopPropagation(); handleToggleLike(song.id); }}>
                      {isLiked ? (
                        <FaHeart className="text-[#3BC8E7] hover:scale-110 transition cursor-pointer" />
                      ) : (
                        <FaRegHeart className="text-gray-400 hover:text-[#3BC8E7] transition cursor-pointer" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 pr-4">
                      <img
                        src={song.coverImage || './slide/Song1.jpg'}
                        alt={song.title}
                        className="w-12 h-12 rounded object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = './slide/Song1.jpg';
                        }}
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-medium text-base text-white hover:text-[#3BC8E7] transition cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/song/${song.id}`);
                            }}
                          >
                            {song.title}
                          </span>
                          {song.type === 'PREMIUM' && (
                            <span title="Premium">
                              <Gem className="w-4 h-4 text-[#3BC8E7]" />
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {song.artist?.artistName || t('common.unknownArtist')}
                        </p>
                      </div>
                    </div>
                    <div className="text-gray-400 text-sm">
                      {song.duration || '0:00'}
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaySong(song);
                        }}
                        className="text-[#3BC8E7] hover:text-[#2cb1cf] transition text-sm font-semibold"
                      >
                        Phát
                      </button>
                    </div>
                    <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                      {song.fileUrl ? (
                        <CustomAudioPlayer
                          src={song.fileUrl}
                          className="w-full max-w-[400px]"
                          songType={song.type}
                          songArtistId={song.artistId}
                          songId={song.id}
                          songTitle={song.title}
                          songArtist={song.artist?.artistName}
                          songImage={song.coverImage}
                          allSongs={songs.map(s => ({
                            id: s.id,
                            title: s.title,
                            artist: s.artist?.artistName || "Unknown Artist",
                            fileUrl: s.fileUrl,
                            coverImage: s.coverImage,
                            type: s.type,
                            artistId: s.artistId,
                          }))}
                          onPlay={async () => {
                            try {
                              await incrementSongViews(song.id);
                              if (userId) {
                                await addHistory(userId, song.id);
                              }
                            } catch (error) {
                              console.error('Error updating views/history:', error);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;

