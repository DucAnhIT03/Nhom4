import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPlay, FaHeart, FaArrowLeft, FaRegHeart, FaPause, FaComment } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { IoCloudDownloadOutline, IoCheckmarkDoneSharp } from "react-icons/io5";
import { Gem } from "lucide-react";
import Header from "../components/HomePage/Header";
import Sidebar from "../components/HomePage/Sidebar";
import { getAlbumById, getSongsByAlbumId } from "../services/album.service";
import type { Song as ApiSong } from "../services/album.service";
import { incrementSongViews } from "../services/song.service";
import { toggleWishlist, getWishlistSongIds } from "../services/wishlist.service";
import { getCurrentUser } from "../services/auth.service";
import { addHistory } from "../services/history.service";
import { addDownload, getDownloads } from "../services/download.service";
import { saveSongToCache } from "../utils/downloadCache.ts";
import { canPlayPremiumSong, isSongOwner } from "../utils/premiumCheck";
import CustomAudioPlayer from "../shared/components/CustomAudioPlayer";
import CommentModal from "../components/Comments/CommentModal";
import { useLanguage } from "../contexts/LanguageContext";

// Định nghĩa kiểu dữ liệu form tĩnh
interface Song {
  id: number;
  title: string;
  artist: string;
  duration: string;
  albumId: string;
  fileUrl?: string;
  type?: 'FREE' | 'PREMIUM';
  artistId?: number;
}

interface AlbumDetail {
  id: string;
  title: string;
  author: string;
  coverInfo: string;
  img: string;
  description: string;
  songs: Song[];
}

const AlbumDetail = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // State lưu trữ dữ liệu album
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 
  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState<string | null>(null);
  
  // State cho Player & UI
  const [isPlaying, setIsPlaying] = useState(false);
  const [likedSongs, setLikedSongs] = useState<number[]>([]);
  const [downloadedSongs, setDownloadedSongs] = useState<number[]>([]);
  const [downloading, setDownloading] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [commentModal, setCommentModal] = useState<{ isOpen: boolean; songId: number; songTitle: string }>({
    isOpen: false,
    songId: 0,
    songTitle: '',
  });

  // Hàm map dữ liệu từ API sang format form tĩnh
  const mapSongToForm = (song: ApiSong): Song => {
    // Đảm bảo artist luôn là string
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
      albumId: song.albumId?.toString() || "",
      fileUrl: song.fileUrl,
      type: song.type,
      artistId: song.artistId,
    };
  };

  // Xử lý play/pause nhạc nền
  const handlePlayPause = () => {
    if (!backgroundMusicUrl) {
      return; // Không có nhạc nền thì không làm gì
    }

    if (!audioRef.current) {
      // Tạo audio element nếu chưa có
      const audio = new Audio(backgroundMusicUrl);
      audio.loop = true; // Lặp lại nhạc nền
      audio.volume = 0.5; // Đặt volume 50%
      audioRef.current = audio;
    }

    if (isPlaying) {
      // Dừng nhạc
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Phát nhạc
      audioRef.current.play().catch((error) => {
        console.error("Lỗi phát nhạc:", error);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  // Logic gọi API
  useEffect(() => {
    const fetchAlbumData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      try {
        const albumId = parseInt(id);
        if (isNaN(albumId)) {
          throw new Error("Invalid album ID");
        }

        // Gọi song song 2 API để tối ưu tốc độ
        const [albumData, songsData] = await Promise.all([
          getAlbumById(albumId),
          getSongsByAlbumId(albumId),
        ]);

        // Map dữ liệu sang format form tĩnh
        const mappedSongs = songsData.map(mapSongToForm);
        
        // Lưu URL nhạc nền
        if (albumData.backgroundMusic) {
          setBackgroundMusicUrl(albumData.backgroundMusic);
        } else {
          setBackgroundMusicUrl(null);
        }
        
        const fullAlbumData: AlbumDetail = {
          id: albumData.id.toString(),
          title: albumData.title,
          author: albumData.artist?.artistName || albumData.genre?.genreName || t('common.unknown'),
          coverInfo: albumData.releaseDate 
            ? new Date(albumData.releaseDate).toLocaleDateString('vi-VN')
            : "N/A",
          img: albumData.coverImage || "https://via.placeholder.com/250",
          description: `${albumData.type === 'PREMIUM' ? t('common.premiumAlbum') : t('common.freeAlbum')} • ${mappedSongs.length} ${t('common.songs')}`,
          songs: mappedSongs,
        };

        setAlbum(fullAlbumData);
      } catch (error) {
        console.error("Lỗi không tải được album:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumData();
    window.scrollTo(0, 0);
  }, [id]);

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

        const downloads = await getDownloads(userId);
        setDownloadedSongs(downloads.map(d => d.song.id));
      } catch (error) {
        console.error("Lỗi không tải được wishlist/downloads:", error);
      }
    };
    loadWishlist();
  }, [userId]);

  // Reset audio khi backgroundMusicUrl thay đổi
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, [backgroundMusicUrl]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // --- 4. XỬ LÝ UI KHI ĐANG TẢI HOẶC LỖI ---
  if (loading) {
    return (
        <div className="w-[1520px] min-h-screen bg-[#14182A] flex items-center justify-center text-white">
            {t('common.loading')}
        </div>
    );
  }

  if (!album) {
    return (
        <div className="w-[1520px] min-h-screen bg-[#14182A] flex flex-col items-center justify-center text-white">
            <h2 className="text-2xl font-bold mb-4">{t('common.album')} {t('common.notFound')}</h2>
            <button onClick={() => navigate(-1)} className="text-[#3BC8E7] underline">{t('common.goBack')}</button>
        </div>
    );
  }

  // --- 5. CẬP NHẬT LOGIC TOGGLE LIKE VỚI API ---
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
      alert(t('alerts.pleaseLogin'));
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
      alert(t('alerts.unknownError'));
    }
  };

  const handleDownload = async (song: Song) => {
    if (!song.id || !song.fileUrl) {
      alert(t('alerts.unknownError'));
      return;
    }

    if (!userId) {
      alert(t('alerts.pleaseLogin'));
      return;
    }

    // Premium guard
    if (song.type === 'PREMIUM') {
      const owner = isSongOwner(song.artistId);
      if (!owner) {
        const result = await canPlayPremiumSong({ type: song.type, artistId: song.artistId });
        if (!result.canPlay) {
          alert(result.reason || 'Bài hát này yêu cầu tài khoản Premium để tải.');
          return;
        }
      }
    }

    if (downloading.has(song.id)) return;

    const nextDownloading = new Set(downloading);
    nextDownloading.add(song.id);
    setDownloading(nextDownloading);

    try {
      await addDownload(userId, song.id);
      await saveSongToCache(song.id, song.fileUrl);
      setDownloadedSongs(prev => prev.includes(song.id) ? prev : [...prev, song.id]);
      alert(t('downloads.downloaded') || 'Đã lưu bài hát để nghe offline');
    } catch (error) {
      console.error("Lỗi tải bài hát:", error);
      alert('Có lỗi khi tải bài hát. Vui lòng thử lại.');
    } finally {
      const cleaned = new Set(nextDownloading);
      cleaned.delete(song.id);
      setDownloading(cleaned);
    }
  };

  return (
    <div className="w-[1520px] min-h-screen text-white bg-[#14182A]">
      <Header/>
      <Sidebar/>
      
      {/* BACK BUTTON */}
      <div className="ml-[120px] mt-[-500px]">
        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition duration-200"
        >
            <FaArrowLeft /> {t('common.goBack')}
        </button>

        {/* ALBUM HEADER INFO */}
        <div className="flex flex-col md:flex-row gap-8 items-end">
          <div className="relative group shadow-2xl shadow-[#171c36]/50 rounded-[10px]">
            <img 
              src={album.img} 
              alt={album.title} 
              className="w-[250px] h-[250px] object-cover rounded-[10px]" 
              onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/250" }} 
            />
          </div>

          <div className="flex flex-col gap-3 mb-2">
            <span className="uppercase text-sm font-bold text-[#3BC8E7] tracking-wider">{t('common.album')}</span>
            <h1 className="text-5xl font-bold leading-tight text-white">{album.title}</h1>
            
            <div className="flex items-center gap-2 text-gray-300 text-sm mt-2">
               <span className="font-semibold text-white hover:underline cursor-pointer">{album.author}</span>
               <span>•</span>
               <span>{album.coverInfo}</span>
            </div>

            <p className="text-gray-400 text-sm max-w-xl mt-2 line-clamp-2">
               {album.description}
            </p>

            <div className="flex items-center gap-4 mt-4">
              <button 
                onClick={handlePlayPause}
                disabled={!backgroundMusicUrl}
                className={`w-[140px] h-[48px] rounded-full font-bold text-lg flex items-center justify-center gap-2 transition transform hover:scale-105 ${
                  backgroundMusicUrl 
                    ? 'bg-[#3BC8E7] hover:bg-[#2cb1cf] text-[#171C36] cursor-pointer' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                {isPlaying ? <FaPause /> : <FaPlay className="ml-1"/>} 
                {isPlaying ? t('common.pause') : t('common.play')}
              </button>
              <button className="w-[48px] h-[48px] rounded-full border border-gray-500 flex items-center justify-center hover:border-white hover:text-white text-gray-400 transition">
                  <FaRegHeart className="text-xl"/>
              </button>
              <button className="w-[48px] h-[48px] rounded-full border border-gray-500 flex items-center justify-center hover:border-white hover:text-white text-gray-400 transition">
                  <BsThreeDots className="text-xl"/>
              </button>
            </div>
          </div>
        </div>

        {/* SONG LIST */}
        <div className="mt-10 pb-20">
          <div className="grid grid-cols-[50px_2fr_1fr_80px_80px_420px] border-b border-[#252B4D] pb-2 text-gray-400 text-sm uppercase px-4 py-3">
            <span className="text-center flex items-center justify-center">
              <FaHeart className="text-sm" />
            </span>
            <span>{t('common.songTitle')}</span>
            <span>{t('common.artists')}</span>
            <span className="text-center">{t('common.comment')}</span>
            <span className="text-center">{t('downloads.title')}</span>
            <span className="text-center">{t('common.play')}</span>
          </div>

          <div className="flex flex-col mt-2">
            {album.songs && album.songs.length > 0 ? (
                album.songs.map((song) => {
                    const isLiked = likedSongs.includes(song.id);
                    const isDownloaded = downloadedSongs.includes(song.id);
                    return (
                    <div 
                        key={song.id} 
                        className="group grid grid-cols-[50px_2fr_1fr_80px_80px_420px] items-center px-4 py-3 rounded-md hover:bg-[#252B4D] transition cursor-pointer border-b border-transparent hover:border-[#3BC8E7]/20"
                    >
                        <div className="text-center flex justify-center items-center" onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }}>
                            {isLiked ? (
                                <FaHeart className="text-[#3BC8E7] hover:scale-110 transition cursor-pointer" />
                            ) : (
                                <FaRegHeart className="text-gray-400 hover:text-[#3BC8E7] transition cursor-pointer" />
                            )}
                        </div>
                        <div className="flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(song);
                            }}
                            disabled={downloading.has(song.id)}
                            className="text-2xl transition-colors hover:scale-110 disabled:opacity-50"
                            title={
                              isDownloaded
                                ? t('downloads.downloaded') || 'Đã tải'
                                : song.type === 'PREMIUM'
                                  ? t('downloads.viewMore') || 'Premium required'
                                  : t('downloads.title')
                            }
                          >
                            {isDownloaded ? (
                              <IoCheckmarkDoneSharp className="text-[#3BC8E7]" />
                            ) : (
                              <IoCloudDownloadOutline className="text-gray-300 hover:text-white" />
                            )}
                          </button>
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
                            {String(song.artist || t('common.unknown'))}
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
                                className="text-gray-400 hover:text-[#3BC8E7] transition flex items-center gap-1"
                                title={t('common.comment')}
                            >
                                <FaComment />
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
                <div className="text-center text-gray-500 py-10">{t('common.noSongs')}</div>
            )}
          </div>

          {/* COPYRIGHT FOOTER */}
          <div className="mt-10 pt-8 border-t border-[#252B4D] text-xs text-gray-500">
            <p>© 2025 {album.author}. All rights reserved.</p>
            <p className="mt-1">Provided to YouTube by {album.author}</p>
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
    </div>
  );
};

export default AlbumDetail;