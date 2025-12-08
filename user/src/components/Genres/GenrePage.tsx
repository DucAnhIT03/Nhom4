import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaHeart, FaArrowLeft, FaRegHeart } from "react-icons/fa";
import { Gem } from "lucide-react";
import Header from "../HomePage/Header";
import Sidebar from "../HomePage/Sidebar";
import Footer from "../HomePage/Footer";
import { getSongsByGenreName, type Song as ApiSong } from "../../services/song.service";
import { incrementSongViews } from "../../services/song.service";
import { getGenres, type Genre } from "../../services/genre.service";
import { toggleWishlist, getWishlistSongIds } from "../../services/wishlist.service";
import { getCurrentUser } from "../../services/auth.service";
import { addHistory } from "../../services/history.service";
import CustomAudioPlayer from "../../shared/components/CustomAudioPlayer";
import { FaComment } from "react-icons/fa";
import CommentModal from "../Comments/CommentModal";

// Định nghĩa kiểu dữ liệu form tĩnh
interface Song {
  id: number;
  title: string;
  artist: string;
  duration: string;
  fileUrl?: string;
  type?: 'FREE' | 'PREMIUM';
  artistId?: number;
}

const GenrePage: React.FC = () => {
  const { genreName } = useParams<{ genreName: string }>();
  const navigate = useNavigate();
  
  // State lưu trữ dữ liệu
  const [genre, setGenre] = useState<Genre | null>(null);
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
    // Đảm bảo artist luôn là string
    let artistName = "Unknown";
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

  // Lấy userId từ localStorage hoặc current user
  useEffect(() => {
    const loadUserId = async () => {
      // Ưu tiên lấy từ localStorage trước (nhanh và đáng tin cậy hơn)
      const storedUserId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (storedUserId) {
        setUserId(parseInt(storedUserId));
      } else if (token) {
        // Nếu có token nhưng chưa có userId trong localStorage, thử lấy từ API
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
    const fetchGenreData = async () => {
      if (!genreName) return;
      
      setLoading(true);
      
      try {
        const decodedGenreName = decodeURIComponent(genreName);
        
        // Gọi song song 2 API để tối ưu tốc độ
        const [songsData, genresData] = await Promise.all([
          getSongsByGenreName(decodedGenreName),
          getGenres(),
        ]);

        // Tìm genre từ danh sách
        const foundGenre = genresData.find(g => g.genreName === decodedGenreName);
        
        // Map dữ liệu sang format form tĩnh
        const mappedSongs = songsData.map(mapSongToForm);
        
        setGenre(foundGenre || null);
        setSongs(mappedSongs);
      } catch (error) {
        console.error("Lỗi không tải được dữ liệu thể loại:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGenreData();
    window.scrollTo(0, 0);
  }, [genreName]);

  const toggleLike = async (songId: number) => {
    // Lấy userId từ localStorage hoặc state
    let currentUserId = userId;
    
    if (!currentUserId) {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        currentUserId = parseInt(storedUserId);
        setUserId(currentUserId);
      } else {
        // Thử lấy từ API nếu có token
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
      alert("Vui lòng đăng nhập để thêm bài hát vào yêu thích");
      return;
    }

    try {
      const response = await toggleWishlist(currentUserId, songId);
      
      // Cập nhật state dựa trên response từ API
      if (response.isFavorite) {
        setLikedSongs((prev) => [...prev, songId]);
      } else {
        setLikedSongs((prev) => prev.filter((id) => id !== songId));
      }
    } catch (error) {
      console.error("Lỗi khi toggle wishlist:", error);
      alert("Có lỗi xảy ra khi cập nhật yêu thích");
    }
  };

  if (loading) {
    return (
      <div className="bg-[#14182A] min-h-screen">
        <Header />
        <Sidebar />
        <div className="flex justify-center items-center h-screen ml-[160px]">
          <span className="text-white text-lg">Đang tải...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!genre) {
    return (
      <div className="bg-[#14182A] min-h-screen">
        <Header />
        <Sidebar />
        <div className="flex flex-col justify-center items-center h-screen ml-[160px]">
          <span className="text-white text-lg mb-4">Không tìm thấy thể loại</span>
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-[#3BC8E7] hover:text-white transition"
          >
            <FaArrowLeft /> Quay lại
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
          <FaArrowLeft /> Back
        </button>

        {/* GENRE HEADER INFO */}
        <div className="flex flex-col md:flex-row gap-8 items-end">
          <div className="relative group shadow-2xl shadow-[#171c36]/50 rounded-[10px]">
            <img 
              src={genre.imageUrl || './slide/Romantic.jpg'} 
              alt={genre.genreName} 
              className="w-[250px] h-[250px] object-cover rounded-[10px]" 
              onError={(e) => { (e.target as HTMLImageElement).src = './slide/Romantic.jpg' }} 
            />
          </div>

          <div className="flex flex-col gap-3 mb-2">
            <span className="uppercase text-sm font-bold text-[#3BC8E7] tracking-wider">Thể loại</span>
            <h1 className="text-5xl font-bold leading-tight text-white">{genre.genreName}</h1>
            
            <p className="text-gray-400 text-sm max-w-xl mt-2">
              {songs.length} bài hát
            </p>
          </div>
        </div>

        {/* SONG LIST */}
        <div className="mt-10 pb-20">
          <div className="grid grid-cols-[50px_2fr_1fr_80px_500px] border-b border-[#252B4D] pb-2 text-gray-400 text-sm uppercase px-4 py-3">
            <span className="text-center flex items-center justify-center">
              <FaHeart className="text-sm" />
            </span>
            <span>Title</span>
            <span>Artist</span>
            <span className="text-center">Comment</span>
            <span className="text-center">Nghe</span>
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
                      {String(song.artist || 'Unknown')}
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
                          className="w-full max-w-[400px]"
                          songType={song.type}
                          songArtistId={song.artistId}
                          onPlay={async () => {
                            try {
                              await incrementSongViews(song.id);
                              // Thêm vào history
                              if (userId) {
                                try {
                                  await addHistory(userId, song.id);
                                } catch (error) {
                                  console.error("Lỗi thêm vào history:", error);
                                }
                              }
                            } catch (error) {
                              console.error("Lỗi cập nhật lượt nghe:", error);
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
              <div className="text-center text-gray-500 py-10">Chưa có bài hát nào trong thể loại này.</div>
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

export default GenrePage;