import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FaChevronRight } from "react-icons/fa";
import { Gem } from "lucide-react";
import { FaChevronLeft } from "react-icons/fa";
import { getWishlist, toggleWishlist, type WishlistItem } from "../../services/wishlist.service";
import { getCurrentUser } from "../../services/auth.service";
import { getAlbumById } from "../../services/album.service";
import { incrementSongViews } from "../../services/song.service";
import { addHistory, getHistory, type HistoryItem } from "../../services/history.service";
import CustomAudioPlayer from "../../shared/components/CustomAudioPlayer";
import { useMusic } from "../../contexts/MusicContext";
import MusicPlayerBar from "../HomePage/MusicPlayerBar";
import { FaComment } from "react-icons/fa";
import CommentModal from "../Comments/CommentModal";

interface SongWithAlbum extends WishlistItem {
  albumName?: string;
}

interface HistoryItemWithAlbum extends HistoryItem {
  albumCover?: string;
  albumTitle?: string;
}

const Container = () => {
  const [showAll, setShowAll] = useState(false);
  const [songs, setSongs] = useState<SongWithAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<HistoryItemWithAlbum[]>([]);
  const [recentlyPlayedIndex, setRecentlyPlayedIndex] = useState(0);
  const [currentlyPlayingSong, setCurrentlyPlayingSong] = useState<{
    title: string;
    artist: string;
    image: string;
    audioUrl: string;
  } | null>(null);
  const { setQueue, setCurrentlyPlayingSong: setContextSong, setCurrentIndex: setContextIndex } = useMusic();
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

  // Load wishlist
  useEffect(() => {
    const loadWishlist = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const wishlistData = await getWishlist(userId);
        
        // Load thông tin album cho mỗi bài hát
        const songsWithAlbum = await Promise.all(
          wishlistData.map(async (item) => {
            let albumName = "Unknown Album";
            if (item.song.albumId) {
              try {
                const album = await getAlbumById(item.song.albumId);
                albumName = album.title;
              } catch (error) {
                console.error(`Error loading album ${item.song.albumId}:`, error);
              }
            }
            return {
              ...item,
              albumName,
            };
          })
        );

        setSongs(songsWithAlbum);
      } catch (error) {
        console.error("Lỗi không tải được wishlist:", error);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [userId]);

  // Load Recently Played
  useEffect(() => {
    const loadRecentlyPlayed = async () => {
      if (!userId) {
        return;
      }

      try {
        const historyData = await getHistory(userId);
        
        // Lấy 6 bài hát gần nhất (hoặc tất cả nếu ít hơn 6)
        const recentHistory = historyData.slice(0, 6);
        
        // Load album info cho mỗi bài hát
        const historyWithAlbum = await Promise.all(
          recentHistory.map(async (item) => {
            let albumCover = "./Featured Albums/Anh1.png";
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

        setRecentlyPlayed(historyWithAlbum);
      } catch (error) {
        console.error("Lỗi không tải được recently played:", error);
        setRecentlyPlayed([]);
      }
    };

    loadRecentlyPlayed();
  }, [userId]);

  const handleRemove = async (songId: number) => {
    if (!userId) {
      alert("Vui lòng đăng nhập");
      return;
    }

    try {
      await toggleWishlist(userId, songId);
      // Xóa bài hát khỏi danh sách hiển thị
      setSongs((prev) => prev.filter((item) => item.song.id !== songId));
    } catch (error) {
      console.error("Lỗi khi xóa bài hát khỏi wishlist:", error);
      alert("Có lỗi xảy ra khi xóa bài hát");
    }
  };

  const handleRecentlyPlayedClick = async (item: HistoryItemWithAlbum) => {
    if (!item.song.fileUrl) {
      alert("Bài hát này không có file audio");
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

    const artistName = item.song.artist?.artistName || "Unknown Artist";
    const songData = {
      title: item.song.title,
      artist: artistName,
      image: item.albumCover || "./Featured Albums/Anh1.png",
      audioUrl: item.song.fileUrl,
      id: item.song.id,
      type: item.song.type,
      artistId: item.song.artistId,
    };
    
    setCurrentlyPlayingSong(songData);
    setContextSong(songData);

    // Set queue với tất cả bài hát trong recently played
    const queue = recentlyPlayed.map(i => ({
      title: i.song.title,
      artist: i.song.artist?.artistName || "Unknown Artist",
      image: i.albumCover || "./Featured Albums/Anh1.png",
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
      await incrementSongViews(item.song.id);
      if (userId) {
        await addHistory(userId, item.song.id);
      }
    } catch (error) {
      console.error("Lỗi cập nhật lượt nghe/history:", error);
    }
  };

  const handleRecentlyPlayedPrev = () => {
    if (recentlyPlayedIndex > 0) {
      setRecentlyPlayedIndex(recentlyPlayedIndex - 1);
    }
  };

  const handleRecentlyPlayedNext = () => {
    const maxIndex = Math.max(0, recentlyPlayed.length - 6);
    if (recentlyPlayedIndex < maxIndex) {
      setRecentlyPlayedIndex(recentlyPlayedIndex + 1);
    }
  };

  // Lấy 6 bài hát hiện tại để hiển thị
  const visibleRecentlyPlayed = recentlyPlayed.slice(recentlyPlayedIndex, recentlyPlayedIndex + 6);


  const visibleSongs = showAll ? songs : songs.slice(0, 5);

  if (loading) {
    return (
      <div className="mt-[43px] flex justify-center items-center h-[400px]">
        <span className="text-white text-lg">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="mt-[43px]">
      {/* --- TITLE --- */}
      <div className="flex justify-between mt-[-511px]">
        <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold">
          Favourites
        </span>
      </div>

      {/* --- SONG TABLE --- */}
      <div className="flex justify-center mt-[50px]">
        {songs.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <p className="text-lg mb-2">Chưa có bài hát yêu thích nào</p>
            <p className="text-sm">Hãy thêm bài hát vào yêu thích để xem ở đây</p>
          </div>
        ) : (
          <table className="w-[1200px] text-left border-separate border-spacing-y-2 opacity-100">
            <thead>
              <tr className="text-[#3BC8E7] text-[14px] border-b border-[#2E3358]">
                <th className="w-[40px] py-3">#</th>
                <th className="py-3">Song Title</th>
                <th className="py-3">Album</th>
                <th className="py-3 w-[400px] min-w-[350px]">Nghe</th>
                <th className="py-3 text-center w-[80px]">Comment</th>
                <th className="py-3 text-center w-[80px]">Remove</th>
              </tr>
            </thead>

            <tbody>
              {visibleSongs.map((item, index) => (
                <tr
                  key={item.song.id}
                  className="text-[15px] text-white border-b border-[#2E3358] hover:bg-[#1B1E3D] transition"
                >
                  <td className="py-3 px-2">{(index + 1).toString().padStart(2, "0")}</td>
                  <td className="py-3 text-[#3BC8E7] cursor-pointer hover:underline">
                    <div className="flex items-center gap-2">
                      {item.song.title}
                      {item.song.type === 'PREMIUM' && (
                        <span title="Premium">
                          <Gem className="w-4 h-4 text-[#3BC8E7]" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3">{item.albumName || "Unknown Album"}</td>
                  <td className="py-3 w-[500px] min-w-[400px]" onClick={(e) => e.stopPropagation()}>
                    {item.song.fileUrl ? (
                      <CustomAudioPlayer
                        src={item.song.fileUrl}
                        className="w-full"
                        songType={item.song.type}
                        songArtistId={item.song.artistId}
                        onPlay={async () => {
                          try {
                            await incrementSongViews(item.song.id);
                            // Thêm vào history
                            if (userId) {
                              try {
                                await addHistory(userId, item.song.id);
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
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCommentModal({
                          isOpen: true,
                          songId: item.song.id,
                          songTitle: item.song.title,
                        });
                      }}
                      className="hover:text-[#3BC8E7] transition"
                      title="Xem bình luận"
                    >
                      <FaComment size={18} />
                    </button>
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => handleRemove(item.song.id)}
                      className="hover:text-[#3BC8E7] transition"
                    >
                      <IoClose size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- VIEW MORE BUTTON --- */}
      {songs.length > 5 && (
        <div className="flex justify-center mt-[25px] mb-[40px]">
          <button
            onClick={() => setShowAll(!showAll)}
            className="
              w-[140px] h-[48px]
              bg-[#3BC8E7]
              text-[#0A0F1C] text-[16px] font-semibold
              rounded-[20px]
              px-[22px] py-[8px]
              opacity-100
              cursor-pointer
              transition-all duration-200
            "
          >
            {showAll ? "Show Less" : "View More"}
          </button>
        </div>
      )}

      {/* --- RECENTLY PLAYED SECTION --- */}
      <div className="mt-[80px] mb-[60px]">
        <div className="flex justify-between items-center">
          <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold">
            Recently Played
          </span>
          <span className="mr-[165px] text-white text-[15px] cursor-pointer hover:text-[#3BC8E7] transition">
            View more
          </span>
        </div>

        {recentlyPlayed.length === 0 ? (
          <div className="text-center text-gray-400 py-20 mt-[32px]">
            <p className="text-lg mb-2">Chưa có bài hát nào được phát gần đây</p>
          </div>
        ) : (
          <div className="flex gap-[30px] mt-[32px] ml-[120px] items-center">
            <button
              onClick={handleRecentlyPlayedPrev}
              disabled={recentlyPlayedIndex === 0}
              className={`text-white ${recentlyPlayedIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#3BC8E7] transition'}`}
            >
              <FaChevronLeft />
            </button>

            {visibleRecentlyPlayed.map((item) => {
              const artistName = item.song.artist?.artistName || "Unknown Artist";
              const isPlaying = currentlyPlayingSong?.title === item.song.title;
              
              return (
                <div
                  key={item.song.id}
                  className={`text-white w-[175px] h-[256px] hover:scale-[1.05] transition-transform duration-200 cursor-pointer ${isPlaying ? 'ring-2 ring-[#3BC8E7] rounded-[10px]' : ''}`}
                  onClick={() => handleRecentlyPlayedClick(item)}
                >
                  <img
                    className="rounded-[10px] mb-[19.18px] w-[175px] h-[175px] object-cover"
                    src={item.albumCover || "./Featured Albums/Anh1.png"}
                    alt={item.song.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "./Featured Albums/Anh1.png";
                    }}
                  />
                  <h3 className="font-semibold mb-1">
                    <span className="hover:text-[#3BC8E7] transition flex items-center gap-1">
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

            {/* Fill empty slots if less than 6 items */}
            {visibleRecentlyPlayed.length < 6 && Array.from({ length: 6 - visibleRecentlyPlayed.length }).map((_, index) => (
              <div key={`empty-${index}`} className="w-[175px] h-[256px]" />
            ))}

            <button
              onClick={handleRecentlyPlayedNext}
              disabled={recentlyPlayedIndex >= Math.max(0, recentlyPlayed.length - 6)}
              className={`text-white ${recentlyPlayedIndex >= Math.max(0, recentlyPlayed.length - 6) ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#3BC8E7] transition'}`}
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      <MusicPlayerBar song={currentlyPlayingSong} />

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

export default Container;
