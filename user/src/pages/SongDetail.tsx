import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPlay, FaHeart, FaArrowLeft, FaRegHeart, FaComment, FaShareAlt } from "react-icons/fa";
import { IoCloudDownloadOutline, IoCheckmarkDoneSharp } from "react-icons/io5";
import { Gem } from "lucide-react";
import Header from "../components/HomePage/Header";
import Sidebar from "../components/HomePage/Sidebar";
import { getSongById, incrementSongViews } from "../services/song.service";
import { getArtistById, type Artist } from "../services/artist.service";
import { toggleWishlist, getWishlistSongIds } from "../services/wishlist.service";
import { getCurrentUser } from "../services/auth.service";
import { addHistory } from "../services/history.service";
import { addDownload, getDownloads } from "../services/download.service";
import { saveSongToCache } from "../utils/downloadCache.ts";
import { useMusic, type Song as MusicSong } from "../contexts/MusicContext";
import { useLanguage } from "../contexts/LanguageContext";
import CommentModal from "../components/Comments/CommentModal";

const SongDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setCurrentlyPlayingSong, setQueue, setCurrentIndex } = useMusic();
  
  const [song, setSong] = useState<any>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [commentModal, setCommentModal] = useState<{ isOpen: boolean; songId: number; songTitle: string }>({
    isOpen: false,
    songId: 0,
    songTitle: '',
  });

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

  // Load song data
  useEffect(() => {
    const fetchSongData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const songId = parseInt(id);
        if (isNaN(songId)) {
          throw new Error("Invalid song ID");
        }

        const songData = await getSongById(songId);
        if (!songData) {
          throw new Error("Song not found");
        }

        setSong(songData);
        
        // Load artist info
        if (songData.artistId) {
          try {
            const artistData = await getArtistById(songData.artistId);
            setArtists([artistData]);
          } catch (error) {
            console.error('Error loading artist:', error);
          }
        }

        // Load wishlist and download status
        if (userId) {
          try {
            const wishlistSongIds = await getWishlistSongIds(userId);
            setIsLiked(wishlistSongIds.includes(songId));

            const downloads = await getDownloads(userId);
            setIsDownloaded(downloads.some(d => d.song.id === songId));
          } catch (error) {
            console.error('Error loading wishlist/download status:', error);
          }
        }

        // Increment views
        await incrementSongViews(songId);
      } catch (error) {
        console.error("Lỗi không tải được bài hát:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSongData();
    window.scrollTo(0, 0);
  }, [id, userId]);

  const handlePlay = async () => {
    if (!song) return;

    // Kiểm tra premium
    if (song.type === 'PREMIUM') {
      const { canPlayPremiumSong, isSongOwner } = await import('../utils/premiumCheck');
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

    const musicSong: MusicSong = {
      title: song.title,
      artist: song.artist?.artistName || "Unknown Artist",
      image: song.coverImage || './slide/Song1.jpg',
      audioUrl: song.fileUrl || '',
      id: song.id,
      type: song.type,
      artistId: song.artistId,
    };

    // Tạo queue chỉ với bài hát này
    setQueue([musicSong]);
    setCurrentIndex(0);
    setCurrentlyPlayingSong(musicSong);

    // Thêm vào history
    if (userId && song.id) {
      try {
        await addHistory(userId, song.id);
      } catch (error) {
        console.error("Lỗi thêm vào history:", error);
      }
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

  const handleDownload = async () => {
    if (!song?.id || !song.fileUrl) {
      alert(t('alerts.unknownError'));
      return;
    }

    if (!userId) {
      alert(t('alerts.pleaseLogin'));
      return;
    }

    // Chặn tải bài Premium nếu chưa nâng cấp
    if (song.type === 'PREMIUM') {
      const { canPlayPremiumSong, isSongOwner } = await import('../utils/premiumCheck');
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
      await saveSongToCache(song.id, song.fileUrl);
      setIsDownloaded(true);
      alert(t('downloads.downloaded') || 'Đã lưu vào Tải xuống');
    } catch (error) {
      console.error('Error downloading song:', error);
      alert('Có lỗi khi tải bài hát. Vui lòng thử lại.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: song?.title || 'Bài hát',
        text: `Nghe bài hát: ${song?.title}`,
        url: url,
      }).catch((error) => {
        console.error('Error sharing:', error);
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        alert('Đã sao chép link vào clipboard!');
      }).catch(() => {
        alert('Không thể chia sẻ. Vui lòng sao chép link thủ công.');
      });
    }
  };

  if (loading) {
    return (
      <div className="w-[1520px] min-h-screen bg-[#14182A] flex items-center justify-center text-white">
        {t('common.loading')}
      </div>
    );
  }

  if (!song) {
    return (
      <div className="w-[1520px] min-h-screen bg-[#14182A] flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">{t('common.song')} {t('common.notFound')}</h2>
        <button onClick={() => navigate(-1)} className="text-[#3BC8E7] underline">{t('common.goBack')}</button>
      </div>
    );
  }

  const artistName = song.artist?.artistName || "Unknown Artist";
  const songImage = song.coverImage || './slide/Song1.jpg';

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

        <div className="flex gap-8">
          {/* LEFT SIDE - Song Info & Lyrics */}
          <div className="flex-1">
            {/* Song Header */}
            <div className="flex gap-6 mb-8">
              <img 
                src={songImage} 
                alt={song.title} 
                className="w-[250px] h-[250px] object-cover rounded-[10px] shadow-2xl" 
                onError={(e) => { (e.target as HTMLImageElement).src = './slide/Song1.jpg' }} 
              />
              
              <div className="flex flex-col justify-end flex-1">
                <span className="uppercase text-sm font-bold text-[#3BC8E7] tracking-wider mb-2">
                  {t('common.song')}
                </span>
                <h1 className="text-4xl font-bold leading-tight text-white mb-4 flex items-center gap-2">
                  {song.title}
                  {song.type === 'PREMIUM' && (
                    <span title="Premium">
                      <Gem className="w-6 h-6 text-[#3BC8E7]" />
                    </span>
                  )}
                </h1>
                <p className="text-gray-300 text-lg mb-6">
                  {artistName}
                </p>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-4 mb-4">
                  <button 
                    onClick={handlePlay}
                    className="bg-[#3BC8E7] hover:bg-[#2cb1cf] text-[#171C36] px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 transition transform hover:scale-105"
                  >
                    <FaPlay className="ml-1"/> {t('common.play')}
                  </button>
                  
                  <button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {isDownloaded ? (
                      <>
                        <IoCheckmarkDoneSharp className="text-[#3BC8E7]" />
                        {t('downloads.downloaded')}
                      </>
                    ) : (
                      <>
                        <IoCloudDownloadOutline />
                        {t('downloads.title')}
                      </>
                    )}
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-gray-400">
                  <button 
                    onClick={handleToggleLike}
                    className="flex items-center gap-2 hover:text-red-500 transition"
                  >
                    {isLiked ? (
                      <FaHeart className="text-red-500 text-xl" />
                    ) : (
                      <FaRegHeart className="text-xl" />
                    )}
                    <span>{song.views || 0}</span>
                  </button>
                  
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 hover:text-[#3BC8E7] transition"
                  >
                    <FaShareAlt />
                    <span>Chia sẻ</span>
                  </button>
                  
                  {song.id && (
                    <button 
                      onClick={() => setCommentModal({ isOpen: true, songId: song.id, songTitle: song.title })}
                      className="flex items-center gap-2 hover:text-[#3BC8E7] transition"
                    >
                      <FaComment />
                      <span>{t('common.comment')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Lyrics Section */}
            {song.lyrics ? (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4">Lời bài hát</h2>
                <div className="bg-[#1E2542] rounded-lg p-6 border border-gray-700">
                  <p className="text-gray-400 text-sm mb-4">
                    Đăng bởi {song.artist?.artistName || artistName || 'Nghệ sĩ'}
                  </p>
                  <div className="text-white whitespace-pre-line leading-relaxed text-base">
                    {song.lyrics}
                  </div>
                </div>
              </div>
            ) : song.description ? (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4">{t('common.description')}</h2>
                <div className="bg-[#1E2542] rounded-lg p-6 border border-gray-700">
                  <p className="text-white leading-relaxed">
                    {song.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-4">Lời bài hát</h2>
                <div className="bg-[#1E2542] rounded-lg p-6 border border-gray-700">
                  <p className="text-gray-400 text-center py-8">
                    Chưa có lời bài hát cho bài hát này
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE - Artists */}
          {artists.length > 0 && (
            <div className="w-[300px]">
              <h2 className="text-2xl font-bold text-white mb-6">Nghệ sĩ</h2>
              <div className="space-y-4">
                {artists.map((artist) => (
                  <div 
                    key={artist.id}
                    className="bg-[#1E2542] rounded-lg p-4 border border-gray-700 hover:border-[#3BC8E7] transition cursor-pointer"
                    onClick={() => navigate(`/artist/${artist.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={artist.avatar || './slide/product7.jpg'} 
                        alt={artist.artistName}
                        className="w-16 h-16 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = './slide/product7.jpg' }}
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-1">{artist.artistName}</h3>
                        <p className="text-sm text-gray-400">Nghệ sĩ</p>
                      </div>
                      <button className="bg-[#3BC8E7] hover:bg-[#2cb1cf] text-[#171C36] px-4 py-2 rounded-full font-bold text-sm transition">
                        Theo dõi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {song.id && (
        <CommentModal
          isOpen={commentModal.isOpen}
          onClose={() => setCommentModal({ isOpen: false, songId: 0, songTitle: '' })}
          songId={commentModal.songId}
          songTitle={commentModal.songTitle}
        />
      )}
    </div>
  );
};

export default SongDetail;

