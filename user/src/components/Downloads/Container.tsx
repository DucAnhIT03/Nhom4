import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDownloads, removeDownload, type DownloadItem } from "../../services/download.service";
import { getCurrentUser } from "../../services/auth.service";
import { getAlbumById } from "../../services/album.service";
import { incrementSongViews } from "../../services/song.service";
import { useMusic } from "../../contexts/MusicContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { FaComment, FaTrash } from "react-icons/fa";
import CommentModal from "../Comments/CommentModal";
import { Gem } from "lucide-react";
import { getCachedSongUrl } from "../../utils/downloadCache.ts";

interface DownloadItemWithAlbum extends DownloadItem {
  albumCover?: string;
  albumTitle?: string;
  cachedUrl?: string | null;
}

const Container = () => {
  const navigate = useNavigate();
  const [downloadItems, setDownloadItems] = useState<DownloadItemWithAlbum[]>([]);
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

  // Load downloads
  useEffect(() => {
    const loadDownloads = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const downloadData = await getDownloads(userId);
        
        // Load ảnh cho mỗi bài hát (ưu tiên ảnh bài hát, fallback về ảnh album)
        const itemsWithAlbum = await Promise.all(
          downloadData.map(async (item) => {
            let songCover = item.song.coverImage || "./History/s1.jpg"; // Ưu tiên ảnh bài hát
            let albumTitle = "";
            const cachedUrl = item.song.id ? await getCachedSongUrl(item.song.id) : null;
            
            // Nếu bài hát không có ảnh, thử lấy từ album
            if (!item.song.coverImage && item.song.albumId) {
              try {
                const album = await getAlbumById(item.song.albumId);
                albumTitle = album.title;
                if (album.coverImage) {
                  songCover = album.coverImage;
                }
              } catch (error) {
                console.error(`Error loading album ${item.song.albumId}:`, error);
              }
            }
            
            return {
              ...item,
              albumCover: songCover,
              albumTitle,
              cachedUrl,
            };
          })
        );

        setDownloadItems(itemsWithAlbum);
      } catch (error) {
        console.error("Lỗi không tải được downloads:", error);
        setDownloadItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadDownloads();
  }, [userId]);

  const handleRemoveDownload = async (songId: number) => {
    if (!userId) {
      alert("Vui lòng đăng nhập");
      return;
    }

    if (window.confirm(t('downloads.removeConfirm') || 'Bạn có chắc chắn muốn xóa bài hát này khỏi danh sách tải xuống?')) {
      try {
        await removeDownload(userId, songId);
        setDownloadItems(prev => prev.filter(item => item.song.id !== songId));
        alert(t('downloads.removed') || 'Đã xóa bài hát khỏi danh sách tải xuống');
      } catch (error) {
        console.error("Lỗi xóa download:", error);
        alert("Có lỗi xảy ra khi xóa bài hát");
      }
    }
  };

  const handleSongClick = async (item: DownloadItemWithAlbum) => {
    const audioUrl = item.cachedUrl || item.song.fileUrl;

    if (!audioUrl) {
      alert("Bài hát này không có file audio");
      return;
    }

    if (!navigator.onLine && !item.cachedUrl) {
      alert("Bạn đang offline và bài hát này chưa được tải sẵn.");
      return;
    }

    // Kiểm tra premium trước khi phát
    if (item.song.type === 'PREMIUM') {
      const { canPlayPremiumSong, isSongOwner } = await import('../../utils/premiumCheck');
      const songArtistId = item.song.artistId || item.song.artist?.id;
      
      // Kiểm tra nếu user là chủ sở hữu
      const isOwner = isSongOwner(songArtistId);
      
      if (!isOwner) {
        const checkResult = await canPlayPremiumSong(
          { type: item.song.type, artistId: songArtistId }
        );
        
        if (!checkResult.canPlay) {
          alert(checkResult.reason || 'Bài hát này yêu cầu tài khoản Premium.');
          return;
        }
      }
    }

    // Set bài hát đang phát cho MusicPlayerBar
    const artistName = item.song.artist?.artistName || "Unknown Artist";
    const songData = {
      title: item.song.title,
      artist: artistName,
      image: item.albumCover || "./History/s1.jpg",
      audioUrl,
      id: item.song.id,
      type: item.song.type,
      artistId: item.song.artistId,
    };
    
    setCurrentlyPlayingSong(songData);
    setContextSong(songData);

    // Set queue với tất cả bài hát trong downloads để tự động chuyển bài khi hết
    const queue = downloadItems.map(i => ({
      title: i.song.title,
      artist: i.song.artist?.artistName || "Unknown Artist",
      image: i.albumCover || "./History/s1.jpg",
      audioUrl: i.cachedUrl || i.song.fileUrl || "",
      id: i.song.id,
      type: i.song.type,
      artistId: i.song.artistId,
    })).filter(s => s.audioUrl);
    
    // Tìm index của bài hát được click
    const index = queue.findIndex(s => 
      s.audioUrl === songData.audioUrl || (s.id && songData.id && s.id === songData.id)
    );
    
    setQueue(queue);
    setCurrentIndex(index !== -1 ? index : 0);

    // Tăng lượt nghe
    try {
      await incrementSongViews(item.song.id);
    } catch (error) {
      console.error("Lỗi cập nhật lượt nghe:", error);
    }
  };

  // Chia thành 2 hàng: 6 bài đầu và các bài còn lại
  const firstRow = downloadItems.slice(0, 6);
  const secondRow = downloadItems.slice(6, 12);

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
        <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold">
          {t('downloads.title')}
        </span>
      </div>

      {downloadItems.length === 0 ? (
        <div className="text-center text-gray-400 py-20 mt-[50px]">
          <p className="text-lg mb-2">{t('downloads.noDownloads') || 'Chưa có bài hát nào được tải xuống'}</p>
          <p className="text-sm">{t('downloads.downloadToSee') || 'Tải xuống bài hát để xem ở đây'}</p>
        </div>
      ) : (
        <>
          {/* Hàng 1: 6 bài đầu */}
          <div className="flex gap-[30px] mt-[32px] ml-[120px]">
            {firstRow.map((item) => {
              const artistName = item.song.artist?.artistName || t('common.unknownArtist');
              const isPlaying = currentlyPlayingSong?.title === item.song.title;
              return (
                <div 
                  key={item.song.id} 
                  className={`text-white w-[175px] h-[256px] hover:scale-[1.05] transition-transform duration-200 cursor-pointer relative group ${isPlaying ? 'ring-2 ring-[#3BC8E7] rounded-[10px]' : ''}`}
                  onClick={() => handleSongClick(item)}
                >
                  <img
                    className="rounded-[10px] mb-[19.18px] w-[175px] h-[175px] object-cover"
                    src={item.albumCover || "./History/s1.jpg"}
                    alt={item.song.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "./History/s1.jpg";
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCommentModal({
                          isOpen: true,
                          songId: item.song.id,
                          songTitle: item.song.title,
                        });
                      }}
                      className="bg-[#3BC8E7] text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('common.comment')}
                    >
                      <FaComment size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDownload(item.song.id);
                      }}
                      className="bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('downloads.remove') || 'Xóa khỏi danh sách tải xuống'}
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                  <h3 className="font-semibold mb-1">
                    <span 
                      className="hover:text-[#3BC8E7] transition flex items-center gap-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/song/${item.song.id}`);
                      }}
                    >
                      {item.song.title}
                      {item.song.type === 'PREMIUM' && (
                        <span title="Premium">
                          <Gem className="w-3 h-3 text-[#3BC8E7]" />
                        </span>
                      )}
                    </span>
                  </h3>
                  <h3 className="text-[#DEDEDE] h-[24px]">{artistName}</h3>
                </div>
              );
            })}
          </div>

          {/* Hàng 2: Các bài còn lại */}
          {secondRow.length > 0 && (
            <div className="flex gap-[30px] mt-[32px] ml-[120px]">
              {secondRow.map((item) => {
                const artistName = item.song.artist?.artistName || t('common.unknownArtist');
                const isPlaying = currentlyPlayingSong?.title === item.song.title;
                return (
                  <div 
                    key={item.song.id} 
                    className={`text-white w-[175px] h-[217px] hover:scale-[1.05] transition-transform duration-200 cursor-pointer relative group ${isPlaying ? 'ring-2 ring-[#3BC8E7] rounded-[10px]' : ''}`}
                    onClick={() => handleSongClick(item)}
                  >
                    <img
                      className="rounded-[10px] mb-[19.18px] w-[175px] h-[175px] object-cover"
                      src={item.albumCover || "./History/s1.jpg"}
                      alt={item.song.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "./History/s1.jpg";
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommentModal({
                            isOpen: true,
                            songId: item.song.id,
                            songTitle: item.song.title,
                          });
                        }}
                        className="bg-[#3BC8E7] text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t('common.comment')}
                      >
                        <FaComment size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDownload(item.song.id);
                        }}
                        className="bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t('downloads.remove') || 'Xóa khỏi danh sách tải xuống'}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                    <h3>
                      <span 
                        className="hover:text-[#3BC8E7] transition flex items-center gap-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/song/${item.song.id}`);
                        }}
                      >
                        {item.song.title}
                        {item.song.type === 'PREMIUM' && (
                          <span title="Premium">
                            <Gem className="w-3 h-3 text-[#3BC8E7]" />
                          </span>
                        )}
                      </span>
                    </h3>
                    <h3 className="text-[#DEDEDE] h-[24px]">{artistName}</h3>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
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
