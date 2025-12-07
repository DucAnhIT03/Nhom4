import { useState, useEffect } from "react";
import { getHistory, addHistory, type HistoryItem } from "../../services/history.service";
import { getCurrentUser } from "../../services/auth.service";
import { getAlbumById } from "../../services/album.service";
import { incrementSongViews } from "../../services/song.service";
import MusicPlayerBar from "../HomePage/MusicPlayerBar";
import { useMusic } from "../../contexts/MusicContext";
import { FaComment } from "react-icons/fa";
import CommentModal from "../Comments/CommentModal";

interface HistoryItemWithAlbum extends HistoryItem {
  albumCover?: string;
  albumTitle?: string;
}

const Container = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItemWithAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [currentlyPlayingSong, setCurrentlyPlayingSong] = useState<{
    title: string;
    artist: string;
    image: string;
    audioUrl: string;
  } | null>(null);
  const { setQueue, setCurrentlyPlayingSong: setContextSong, setCurrentIndex } = useMusic();
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

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const historyData = await getHistory(userId);
        
        // Load thông tin album cho mỗi bài hát
        const itemsWithAlbum = await Promise.all(
          historyData.map(async (item) => {
            let albumCover = "./History/s1.jpg"; // Default image
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
            
            return {
              ...item,
              albumCover,
              albumTitle,
            };
          })
        );

        setHistoryItems(itemsWithAlbum);
      } catch (error) {
        console.error("Lỗi không tải được history:", error);
        setHistoryItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [userId]);

  const handleClear = async () => {
    if (!userId) {
      alert("Vui lòng đăng nhập");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử nghe?")) {
      // TODO: Thêm API để xóa history nếu cần
      setHistoryItems([]);
      alert("Đã xóa lịch sử nghe");
    }
  };

  const handleSongClick = async (item: HistoryItemWithAlbum) => {
    if (!item.song.fileUrl) {
      alert("Bài hát này không có file audio");
      return;
    }

    // Set bài hát đang phát cho MusicPlayerBar
    const artistName = item.song.artist?.artistName || "Unknown Artist";
    const songData = {
      title: item.song.title,
      artist: artistName,
      image: item.albumCover || "./History/s1.jpg",
      audioUrl: item.song.fileUrl,
      id: item.song.id,
    };
    
    setCurrentlyPlayingSong(songData);
    setContextSong(songData);

    // Set queue với tất cả bài hát trong history để tự động chuyển bài khi hết
    const queue = historyItems.map(i => ({
      title: i.song.title,
      artist: i.song.artist?.artistName || "Unknown Artist",
      image: i.albumCover || "./History/s1.jpg",
      audioUrl: i.song.fileUrl || "",
      id: i.song.id,
    })).filter(s => s.audioUrl);
    
    // Tìm index của bài hát được click
    const index = queue.findIndex(s => 
      s.audioUrl === songData.audioUrl || (s.id && songData.id && s.id === songData.id)
    );
    
    setQueue(queue);
    setCurrentIndex(index !== -1 ? index : 0);

    // Tăng lượt nghe và thêm vào history
    try {
      await incrementSongViews(item.song.id);
      if (userId) {
        await addHistory(userId, item.song.id);
      }
    } catch (error) {
      console.error("Lỗi cập nhật lượt nghe/history:", error);
    }
  };

  // Chia thành 2 hàng: 6 bài đầu và các bài còn lại
  const firstRow = historyItems.slice(0, 6);
  const secondRow = historyItems.slice(6, 12);

  if (loading) {
    return (
      <div className="mt-[43px] flex justify-center items-center h-[400px]">
        <span className="text-white text-lg">Đang tải...</span>
      </div>
    );
  }

  return (
    <>
      <div className="mt-[43px]">
        <div className="flex justify-between mt-[-511px]">
        <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold">
          History
        </span>
        <button
          onClick={handleClear}
          className="
            mr-[165px]
            bg-[#3BC8E7]
            text-white
            text-[15px]
            font-medium
            px-8
            py-2
            rounded-full
            hover:bg-[#32b2ce]
            transition-all
            duration-300
          "
        >
          Clear
        </button>
      </div>

      {historyItems.length === 0 ? (
        <div className="text-center text-gray-400 py-20 mt-[50px]">
          <p className="text-lg mb-2">Chưa có lịch sử nghe nào</p>
          <p className="text-sm">Hãy nghe nhạc để xem lịch sử ở đây</p>
        </div>
      ) : (
        <>
          {/* Hàng 1: 6 bài đầu */}
          <div className="flex gap-[30px] mt-[32px] ml-[120px]">
            {firstRow.map((item) => {
              const artistName = item.song.artist?.artistName || "Unknown Artist";
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
                    <span className="hover:text-[#3BC8E7] transition">
                      {item.song.title}
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
                const artistName = item.song.artist?.artistName || "Unknown Artist";
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
                    <h3>
                      <span className="hover:text-[#3BC8E7] transition">
                        {item.song.title}
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
      
      {/* Music Player Bar */}
      <MusicPlayerBar song={currentlyPlayingSong} />

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
