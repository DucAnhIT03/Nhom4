import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FaChevronRight } from "react-icons/fa";
import { FaChevronLeft } from "react-icons/fa";
import { getWishlist, toggleWishlist, type WishlistItem } from "../../services/wishlist.service";
import { getCurrentUser } from "../../services/auth.service";
import { getAlbumById } from "../../services/album.service";
import { incrementSongViews } from "../../services/song.service";
import { addHistory } from "../../services/history.service";
import CustomAudioPlayer from "../../shared/components/CustomAudioPlayer";

interface SongWithAlbum extends WishlistItem {
  albumName?: string;
}

const Container = () => {
  const [showAll, setShowAll] = useState(false);
  const [songs, setSongs] = useState<SongWithAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

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
                    {item.song.title}
                  </td>
                  <td className="py-3">{item.albumName || "Unknown Album"}</td>
                  <td className="py-3 w-[500px] min-w-[400px]" onClick={(e) => e.stopPropagation()}>
                    {item.song.fileUrl ? (
                      <CustomAudioPlayer
                        src={item.song.fileUrl}
                        className="w-full"
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

      {/* --- RECENTLY PLAYED SECTION (giữ nguyên như cũ) --- */}
      <div className="mt-[80px] mb-[60px]">
        <div className="flex justify-between items-center">
          <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold">
            Recently Played
          </span>
          <span className="mr-[165px] text-white text-[15px] cursor-pointer hover:text-[#3BC8E7] transition">
            View more
          </span>
        </div>

        <div className="flex gap-[30px] mt-[32px] ml-[120px] items-center">
          <button className="text-white hover:text-[#3BC8E7] transition">
            <FaChevronLeft />
          </button>

          {[
            { src: "./Featured Albums/Anh1.png", title: "Dream Your Moments (Duet)" },
            { src: "./Featured Albums/Anh2.png", title: "Until I Met You" },
            { src: "./Featured Albums/Anh3.png", title: "Gimme Some Courage" },
            { src: "./Featured Albums/Anh4.png", title: "Dark Alley Acoustic" },
            { src: "./Featured Albums/Anh5.png", title: "Walking Promises" },
            { src: "./Featured Albums/Anh6.png", title: "Desired Games" },
          ].map((item, index) => (
            <div
              key={index}
              className="text-white w-[175px] h-[256px] hover:scale-[1.05] transition-transform duration-200"
            >
              <img
                className="rounded-[10px] mb-[19.18px]"
                src={item.src}
                alt={item.title}
              />
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <h3 className="text-[#DEDEDE] h-[24px]">Ava Cornish & Brian Hill</h3>
            </div>
          ))}

          <button className="text-white hover:text-[#3BC8E7] transition">
            <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Container;
