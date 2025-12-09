import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaHeart, FaArrowLeft, FaRegHeart } from "react-icons/fa";
import { Gem } from "lucide-react";
import Header from "../components/HomePage/Header";
import Sidebar from "../components/HomePage/Sidebar";
import Footer from "../components/HomePage/Footer";
import { getSongsByArtistId, type Song as ApiSong, incrementSongViews } from "../services/song.service";
import { getArtistById, type Artist } from "../services/artist.service";
import { toggleWishlist, getWishlistSongIds } from "../services/wishlist.service";
import { getCurrentUser } from "../services/auth.service";
import { addHistory } from "../services/history.service";
import { getAlbumById } from "../services/album.service";
import CustomAudioPlayer from "../shared/components/CustomAudioPlayer";
import { FaComment } from "react-icons/fa";
import CommentModal from "../components/Comments/CommentModal";
import { useLanguage } from "../contexts/LanguageContext";

// Định nghĩa kiểu dữ liệu form tĩnh
interface Song {
  id: number;
  title: string;
  artist: string;
  duration: string;
  fileUrl?: string;
  albumName?: string;
  type?: 'FREE' | 'PREMIUM';
  artistId?: number;
}

const ArtistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // State lưu trữ dữ liệu
  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // State cho UI
  const [likedSongs, setLikedSongs] = useState<number[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [commentModal, setCommentModal] = useState<{ isOpen: boolean; songId: number; songTitle: string }>({
    isOpen: false,
    songId: 0,
    songTitle: '',
  });

  // Hàm map dữ liệu từ API sang format form tĩnh
  const mapSongToForm = (song: ApiSong): Song => {
    let artistName = t('common.unknown');
    if (song.artist) {
      if (typeof song.artist === 'string') {
        artistName = song.artist;
      } else if (song.artist.artistName) {
        artistName = song.artist.artistName;
      }
    }
    
    return {
      id: song.id,
      title: song.title,
      artist: artistName,
      duration: song.duration || "0:00",
      fileUrl: song.fileUrl,
      type: song.type,
      artistId: song.artistId,
    };
  };

  // Lấy userId từ current user
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

  // Load wishlist khi có userId
  useEffect(() => {
    const loadWishlist = async () => {
      if (!userId) return;
      
      try {
        const songIds = await getWishlistSongIds(userId);
        setLikedSongs(songIds);
      } catch (error) {
        console.error("Lỗi không tải được wishlist:", error);
      }
    };
    loadWishlist();
  }, [userId]);

  // Logic gọi API
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      try {
        const artistId = parseInt(id);
        if (isNaN(artistId)) {
          throw new Error("Invalid artist ID");
        }

        // Gọi song song 2 API để tối ưu tốc độ
        const [artistData, songsData] = await Promise.all([
          getArtistById(artistId),
          getSongsByArtistId(artistId),
        ]);

        // Load thông tin album cho mỗi bài hát
        const songsWithAlbum = await Promise.all(
          songsData.map(async (song) => {
            let albumName = t('common.unknownAlbum');
            if (song.albumId) {
              try {
                const album = await getAlbumById(song.albumId);
                albumName = album.title;
              } catch (error) {
                console.error(`Error loading album ${song.albumId}:`, error);
              }
            }
            return {
              ...song,
              albumName,
            };
          })
        );

        // Map dữ liệu sang format form tĩnh
        const mappedSongs = songsWithAlbum.map((song) => ({
          ...mapSongToForm(song),
          albumName: song.albumName,
        }));
        
        setArtist(artistData);
        setSongs(mappedSongs);
      } catch (error) {
        console.error("Lỗi không tải được dữ liệu nghệ sĩ:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
    window.scrollTo(0, 0);
  }, [id]);

  const toggleLike = async (songId: number) => {
    let currentUserId = userId;
    
    if (!currentUserId) {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        currentUserId = parseInt(storedUserId);
        setUserId(currentUserId);
      } else {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const user = await getCurrentUser();
            if (user.id) {
              currentUserId = user.id;
              setUserId(currentUserId);
              localStorage.setItem('userId', user.id.toString());
            }
          } catch (error) {
            console.error("Lỗi không lấy được thông tin user:", error);
          }
        }
      }
    }

    if (!currentUserId) {
      alert(t('alerts.pleaseLogin'));
      return;
    }

    try {
      const response = await toggleWishlist(currentUserId, songId);
      
      if (response.isFavorite) {
        setLikedSongs((prev) => [...prev, songId]);
      } else {
        setLikedSongs((prev) => prev.filter((id) => id !== songId));
      }
    } catch (error) {
      console.error("Lỗi khi toggle wishlist:", error);
      alert(t('alerts.unknownError'));
    }
  };

  if (loading) {
    return (
      <div className="w-[1520px] min-h-screen text-white bg-[#14182A]">
        <Header />
        <Sidebar />
        <div className="flex justify-center items-center h-screen ml-[160px]">
          <span className="text-white text-lg">{t('common.loading')}</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="w-[1520px] min-h-screen text-white bg-[#14182A]">
        <Header />
        <Sidebar />
        <div className="flex flex-col justify-center items-center h-screen ml-[160px]">
          <span className="text-white text-lg mb-4">{t('common.artists')} {t('common.notFound')}</span>
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-[#3BC8E7] hover:text-white transition"
          >
            <FaArrowLeft /> {t('common.goBack')}
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="w-[1520px] min-h-screen text-white bg-[#14182A]">
      <Header />
      <Sidebar />
      
      <div className="ml-[120px] mt-[-500px] px-8 py-8 pb-32">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition duration-200"
        >
          <FaArrowLeft /> {t('common.goBack')}
        </button>

        {/* ARTIST HEADER INFO */}
        <div className="flex flex-col md:flex-row gap-8 items-end">
          <div className="relative group shadow-2xl shadow-[#171c36]/50 rounded-[10px]">
            <img 
              src={artist.avatar || './slide/product1.jpg'} 
              alt={artist.artistName} 
              className="w-[250px] h-[250px] object-cover rounded-[10px]" 
              onError={(e) => { (e.target as HTMLImageElement).src = './slide/product1.jpg' }} 
            />
          </div>

          <div className="flex flex-col gap-3 mb-2">
            <span className="uppercase text-sm font-bold text-[#3BC8E7] tracking-wider">{t('common.artists')}</span>
            <h1 className="text-5xl font-bold leading-tight text-white">{artist.artistName}</h1>
            
            {artist.bio && (
              <p className="text-gray-400 text-sm max-w-xl mt-2 line-clamp-2">
                {artist.bio}
              </p>
            )}
            
            <p className="text-gray-400 text-sm max-w-xl mt-2">
              {songs.length} {t('common.songs')}
            </p>
          </div>
        </div>

        {/* SONG LIST */}
        <div className="mt-10 pb-20">
          <div className="grid grid-cols-[50px_2fr_1fr_80px_500px] border-b border-[#252B4D] pb-2 text-gray-400 text-sm uppercase px-4 py-3">
            <span className="text-center flex items-center justify-center">
              <FaHeart className="text-sm" />
            </span>
            <span>{t('common.title')}</span>
            <span>{t('common.album')}</span>
            <span className="text-center">{t('common.comment')}</span>
            <span className="text-center">{t('common.play')}</span>
          </div>

          <div className="flex flex-col mt-2">
            {songs && songs.length > 0 ? (
              songs.map((song) => {
                const isLiked = likedSongs.includes(song.id);
                return (
                  <div 
                    key={song.id} 
                    className="group grid grid-cols-[50px_2fr_1fr_80px_500px] items-center px-4 py-3 rounded-md hover:bg-[#252B4D] transition border-b border-transparent hover:border-[#3BC8E7]/20"
                  >
                    <div className="text-center flex justify-center items-center" onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }}>
                      {isLiked ? (
                        <FaHeart className="text-[#3BC8E7] hover:scale-110 transition cursor-pointer" />
                      ) : (
                        <FaRegHeart className="text-gray-400 hover:text-[#3BC8E7] transition cursor-pointer" />
                      )}
                    </div>
                    <div className="flex flex-col pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-base text-white">
                          {song.title}
                        </span>
                        {song.type === 'PREMIUM' && (
                          <span title="Premium">
                            <Gem className="w-4 h-4 text-[#3BC8E7]" />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-400 text-sm hover:text-white transition">
                      {song.albumName || t('common.unknownAlbum')}
                    </div>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommentModal({
                            isOpen: true,
                            songId: song.id,
                            songTitle: song.title,
                          });
                        }}
                        className="text-gray-400 hover:text-[#3BC8E7] transition"
                        title="Xem bình luận"
                      >
                        <FaComment size={18} />
                      </button>
                    </div>
                    <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                      {song.fileUrl ? (
                        <CustomAudioPlayer
                          src={song.fileUrl}
                          className="w-full"
                          songType={song.type}
                          songArtistId={song.artistId}
                          onPlay={async () => {
                            try {
                              await incrementSongViews(song.id);
                              if (userId) {
                                await addHistory(userId, song.id);
                              }
                            } catch (error) {
                              console.error("Lỗi cập nhật lượt nghe/history:", error);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-10">{t('common.noSongs')}</div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Comment Modal */}
      <CommentModal
        isOpen={commentModal.isOpen}
        onClose={() => setCommentModal({ isOpen: false, songId: 0, songTitle: '' })}
        songId={commentModal.songId}
        songTitle={commentModal.songTitle}
      />
    </div>
  );
};

export default ArtistDetail;

