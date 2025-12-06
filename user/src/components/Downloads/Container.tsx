import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FaChevronRight, FaChevronLeft, FaHeart, FaRegHeart } from "react-icons/fa";

// Định nghĩa kiểu dữ liệu cho bài hát
interface Song {
  id: number;
  title: string;
  album: string;
  duration: string;
}

// Định nghĩa kiểu dữ liệu cho Album
interface AlbumItem {
  src: string;
  title: string;
}

const songs: Song[] = [
  { id: 1, title: "Bloodlust", album: "Dream Your Moments", duration: "5:26" },
  { id: 2, title: "Desired Games", album: "Dream Your Moments", duration: "5:26" },
  { id: 3, title: "Until I Met You", album: "Dream Your Moments", duration: "5:26" },
  { id: 4, title: "Dark Alley Acoustic", album: "Dream Your Moments", duration: "5:26" },
  { id: 5, title: "Cloud Nine", album: "Dream Your Moments", duration: "5:26" },
  { id: 6, title: "Walking Promises", album: "Dream Your Moments", duration: "5:26" },
  { id: 7, title: "Endless Things", album: "Dream Your Moments", duration: "5:26" },
  { id: 8, title: "Gimme Some Courage", album: "Dream Your Moments", duration: "5:26" },
  { id: 9, title: "One More Stranger", album: "Dream Your Moments", duration: "5:26" },
  { id: 10, title: "Cloud Nine", album: "Dream Your Moments", duration: "5:26" },
];

const albums: AlbumItem[] = [
  { src: "./Featured Albums/Anh1.png", title: "Dream Your Moments (Duet)" },
  { src: "./Featured Albums/Anh2.png", title: "Until I Met You" },
  { src: "./Featured Albums/Anh3.png", title: "Gimme Some Courage" },
  { src: "./Featured Albums/Anh4.png", title: "Dark Alley Acoustic" },
  { src: "./Featured Albums/Anh5.png", title: "Walking Promises" },
  { src: "./Featured Albums/Anh6.png", title: "Desired Games" },
];

// Component con để hiển thị danh sách Album (tránh lặp code)
const AlbumSection = ({ title, items }: { title: string; items: AlbumItem[] }) => (
  <div className="mt-10 mb-16">
    <div className="flex justify-between items-center mb-8">
      <span className="text-[#3BC8E7] text-lg font-semibold">{title}</span>
      <span className="text-white text-[15px] cursor-pointer hover:text-[#3BC8E7] transition">
        View more
      </span>
    </div>

    <div className="flex items-center gap-4">
      <button className="text-white hover:text-[#3BC8E7] transition p-2">
        <FaChevronLeft size={20} />
      </button>

      {/* Container chứa album - sử dụng grid để responsive tốt hơn */}
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide w-full">
        {items.map((item, index) => (
          <div
            key={index}
            className="text-white min-w-[175px] w-[175px] cursor-pointer hover:scale-105 transition-transform duration-200"
          >
            <img
              className="rounded-[10px] mb-4 w-full h-[175px] object-cover"
              src={item.src}
              alt={item.title}
            />
            <h3 className="font-semibold mb-1 truncate" title={item.title}>{item.title}</h3>
            <h3 className="text-[#DEDEDE] text-sm">Ava Cornish & Brian Hill</h3>
          </div>
        ))}
      </div>

      <button className="text-white hover:text-[#3BC8E7] transition p-2">
        <FaChevronRight size={20} />
      </button>
    </div>
  </div>
);

const Container = () => {
  const [showAll, setShowAll] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  const visibleSongs = showAll ? songs : songs.slice(0, 5);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  return (
    // Sử dụng container mx-auto để căn giữa nội dung thay vì margin cứng
    <div className="mt-[43px] text-white container mx-auto px-4 lg:px-8 max-w-7xl">
      
      {/* --- FREE DOWNLOADS HEADER --- */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-[#3BC8E7] text-[18px] font-semibold">
          Free Downloads
        </span>
      </div>

      {/* --- SONG LIST TABLE --- */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[#3BC8E7] text-[14px] border-b border-[#2E3358]">
              <th className="py-3 w-12">#</th>
              <th className="py-3">Song Title</th>
              <th className="py-3">Album</th>
              <th className="py-3">Duration</th>
              <th className="py-3 text-center">Add To Favourites</th>
              <th className="py-3 text-center">Remove</th>
            </tr>
          </thead>

          <tbody>
            {visibleSongs.map((song) => (
              <tr
                key={song.id}
                className="text-[15px] border-b border-[#2E3358] hover:bg-[#1B1E3D] transition group"
              >
                <td className="py-4 px-2 text-gray-400 group-hover:text-white">
                  {song.id.toString().padStart(2, "0")}
                </td>
                <td className="py-4 text-[#3BC8E7] font-medium cursor-pointer hover:underline">
                  {song.title}
                </td>
                <td className="py-4 text-gray-300">{song.album}</td>
                <td className="py-4 text-gray-400">{song.duration}</td>
                <td className="py-4 text-center">
                  <button
                    onClick={() => toggleFavorite(song.id)}
                    className="hover:scale-110 transition"
                  >
                    {favorites.includes(song.id) ? (
                      <FaHeart size={18} className="text-[#E74C3C]" />
                    ) : (
                      <FaRegHeart size={18} className="text-gray-400 hover:text-white" />
                    )}
                  </button>
                </td>
                <td className="py-4 text-center">
                  <button className="text-gray-400 hover:text-[#E74C3C] transition">
                    <IoClose size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- VIEW MORE BUTTON --- */}
      <div className="flex justify-center mt-8 mb-12">
        <button
          onClick={() => setShowAll(!showAll)}
          className="bg-[#3BC8E7] text-[#0A0F1C] text-[16px] font-semibold rounded-full px-8 py-3 hover:bg-[#2CA8C2] transition-all duration-200 shadow-lg hover:shadow-[#3BC8E7]/30"
        >
          {/* Logic hiển thị text đúng */}
          {showAll ? "Show Less" : "View More"}
        </button>
      </div>

      {/* --- DOWNLOAD NOW SECTION --- */}
      <AlbumSection title="Download Now" items={albums} />

      {/* --- RECENTLY PLAYED SECTION --- */}
      <AlbumSection title="Recently Played" items={albums} />
      
      {/* Margin bottom cuối trang */}
      <div className="mb-24"></div>
    </div>
  );
};

export default Container;