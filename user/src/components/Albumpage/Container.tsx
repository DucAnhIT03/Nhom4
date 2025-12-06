import { useEffect, useState } from "react";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { getAlbums, getTrendingAlbums, type Album } from "../../services/album.service";

// Định nghĩa Interface khớp với dữ liệu form tĩnh
interface AlbumCard {
  id: string | number;
  img: string;
  title: string;
  author: string;
  duration?: string; 
}

// Top 15 (Vẫn giữ mock data như cũ theo ý bạn)
const top15 = [
  { id: "top-1", img: "./Top15Albums/A1.png", title: "Until I Met You", author: "Ava Cornish", duration: "5:10" },
  { id: "top-2", img: "./Top15Albums/A2.png", title: "Walking Promises", author: "Ava Cornish", duration: "5:10" },
  { id: "top-3", img: "./Top15Albums/A3.png", title: "Gimme Some Courage", author: "Ava Cornish", duration: "5:10" },
  { id: "top-4", img: "./Top15Albums/A4.png", title: "Desired Games", author: "Ava Cornish", duration: "5:10" },
  { id: "top-5", img: "./Top15Albums/A5.png", title: "Dark Alley Acoustic", author: "Ava Cornish", duration: "5:10" },
  { id: "top-6", img: "./Top15Albums/A6.png", title: "Walking Promises", author: "Ava Cornish", duration: "5:10" },
  { id: "top-7", img: "./Top15Albums/A7.png", title: "Endless Things", author: "Ava Cornish", duration: "5:10" },
  { id: "top-8", img: "./Top15Albums/A8.png", title: "Dream Your Moments", author: "Ava Cornish", duration: "5:10" },
  { id: "top-9", img: "./Top15Albums/A9.png", title: "Until I Met You", author: "Ava Cornish", duration: "5:10" },
  { id: "top-10", img: "./Top15Albums/A10.png", title: "Gimme Some Courage", author: "Ava Cornish", duration: "5:10" },
  { id: "top-11", img: "./Top15Albums/A11.png", title: "Dark Alley Acoustic", author: "Ava Cornish", duration: "5:10" },
  { id: "top-12", img: "./Top15Albums/A12.png", title: "The Heartbeat Stops", author: "Ava Cornish", duration: "5:10" },
  { id: "top-13", img: "./Top15Albums/A13.png", title: "One More Stranger", author: "Ava Cornish", duration: "5:10" },
  { id: "top-14", img: "./Top15Albums/A14.png", title: "Walking Promises", author: "Ava Cornish", duration: "5:10" },
  { id: "top-15", img: "./Top15Albums/A15.png", title: "Endless Things", author: "Ava Cornish", duration: "5:10" },
];

const Container = () => {
  const navigate = useNavigate();

  // State lưu dữ liệu từ API
  const [featuredAlbums, setFeaturedAlbums] = useState<AlbumCard[]>([]);
  const [trendingAlbums, setTrendingAlbums] = useState<AlbumCard[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState<boolean>(true);

  // Hàm map dữ liệu từ API sang format form tĩnh
  const mapAlbumToCard = (album: Album): AlbumCard => {
    // Đảm bảo author luôn là string
    let authorName = "Unknown";
    if (album.artist) {
      if (typeof album.artist === 'string') {
        authorName = album.artist;
      } else if (album.artist.artistName) {
        authorName = album.artist.artistName;
      }
    } else if (album.genre) {
      if (typeof album.genre === 'string') {
        authorName = album.genre;
      } else if (album.genre.genreName) {
        authorName = album.genre.genreName;
      }
    }
    
    return {
      id: album.id,
      img: album.coverImage || "https://via.placeholder.com/175x175?text=No+Image",
      title: album.title,
      author: authorName,
      duration: undefined, // API không có duration ở album level
    };
  };

  // Gọi API lấy danh sách album
  useEffect(() => {
    const fetchAlbums = async () => {
      setLoadingAlbums(true);
      try {
        // Gọi song song 2 API: Featured và Trending
        const [allAlbums, trending] = await Promise.all([
          getAlbums(),
          getTrendingAlbums(6),
        ]);

        // Map dữ liệu sang format form tĩnh
        const featuredCards = allAlbums.slice(0, 6).map(mapAlbumToCard);
        const trendingCards = trending.map(mapAlbumToCard);

        setFeaturedAlbums(featuredCards);
        setTrendingAlbums(trendingCards);
      } catch (error) {
        console.error("Lỗi tải danh sách album:", error);
      } finally {
        setLoadingAlbums(false);
      }
    };

    fetchAlbums();
  }, []);

  // Hàm chuyển trang
  const handleAlbumClick = (id: string | number) => {
    navigate(`/album/${id}`);
  };

  return (
    <div className="mt-[43px]">
      
      {/* ---------------- FEATURED ALBUMS ---------------- */}
      <div className="flex justify-between mt-[-511px]">
        <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold">Featured Albums</span>
        <span className="mr-[165px] text-white text-[15px] cursor-pointer hover:text-[#3BC8E7]">View more</span>
      </div>

      <div className="flex gap-[30px] mt-[32px] ml-[120px]">
        <button className="text-white hover:text-[#3BC8E7] transition"><FaChevronLeft /></button>

        {loadingAlbums ? (
          <div className="text-white w-full text-center">Loading Featured...</div>
        ) : (
          featuredAlbums.map((item) => (
            <div
              key={item.id}
              onClick={() => handleAlbumClick(item.id)}
              className="text-white w-[175px] h-[256px] cursor-pointer group"
            >
              <img
                className="rounded-[10px] mb-[19.18px] w-[175px] h-[175px] object-cover transform group-hover:scale-105 transition duration-300"
                src={item.img}
                alt={item.title}
                onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/175x175?text=No+Image"; }}
              />
              <h3 className="font-semibold mb-1 truncate group-hover:text-[#3BC8E7] transition" title={item.title}>
                {item.title}
              </h3>
              <h3 className="text-[#DEDEDE] truncate text-sm">{String(item.author || 'Unknown')}</h3>
            </div>
          ))
        )}

        <button className="text-white hover:text-[#3BC8E7] transition"><FaChevronRight /></button>
      </div>

      {/* ---------------- TRENDING ALBUMS (PHẦN BẠN CẦN GHÉP) ---------------- */}
      <div className="mt-[64px]">
        <div className="flex justify-between h-[26px]">
          <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold">Trending Albums</span>
          <span className="mr-[165px] text-white text-[15px] cursor-pointer hover:text-[#3BC8E7]">View more</span>
        </div>

        <div className="flex gap-[30px] mt-[32px] ml-[120px]">
          <button className="text-white hover:text-[#3BC8E7] transition"><FaChevronLeft /></button>

          {loadingAlbums ? (
             <div className="text-white w-full text-center">Loading Trending...</div>
          ) : trendingAlbums.length === 0 ? (
             <div className="text-gray-400 w-full text-center">No trending albums found.</div>
          ) : (
            trendingAlbums.map((item) => (
              <div
                key={item.id}
                onClick={() => handleAlbumClick(item.id)}
                className="text-white w-[175px] h-[217px] cursor-pointer group"
              >
                {/* Đã chỉnh lại class ảnh để đảm bảo kích thước cố định */}
                <img
                  className="rounded-[10px] mb-[19.18px] w-[175px] h-[175px] object-cover transform group-hover:scale-105 transition duration-300"
                  src={item.img}
                  alt={item.title}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/175x175?text=No+Image"; }}
                />
                <h3 className="font-semibold truncate group-hover:text-[#3BC8E7] transition" title={item.title}>
                  {item.title}
                </h3>
                <h3 className="text-[#DEDEDE] truncate text-sm">{String(item.author || 'Unknown')}</h3>
              </div>
            ))
          )}

          <button className="text-white hover:text-[#3BC8E7] transition"><FaChevronRight /></button>
        </div>
      </div>

      {/* ---------------- TOP 15 ---------------- */}
      <h3 className="text-[#3BC8E7] ml-[160px] mt-[64px] font-semibold text-[18px]">Top 15 Albums</h3>

      <div className="flex mb-10">
        {[0, 1, 2].map((col) => (
          <div key={col} className={`mt-[24px] ${col === 0 ? "ml-[160px]" : "ml-[40px]"}`}>
            {top15.slice(col * 5, col * 5 + 5).map((item, index) => (
              <div
                key={item.id}
                className="h-[90px] w-[360px] border-b border-[#252B4D] flex items-center hover:bg-[#252B4D]/50 transition rounded-md px-2 cursor-pointer group"
              >
                <div className="flex text-white w-full items-center">
                  <h1 className="text-[32px] font-bold mr-[20px] w-[40px] text-center text-[#3BC8E7]/50 group-hover:text-[#3BC8E7]">
                    {(col * 5 + index + 1).toString().padStart(2, "0")}
                  </h1>

                  <img
                    className="w-[50px] h-[50px] rounded-[5px] mr-[15px] object-cover"
                    src={item.img}
                    alt={item.title}
                  />

                  <div className="flex flex-col flex-1 min-w-0 mr-4">
                    <h3 className="font-semibold truncate group-hover:text-[#3BC8E7] transition text-[14px]">
                      {item.title}
                    </h3>
                    <h3 className="text-gray-400 truncate text-[12px]">{String(item.author || 'Unknown')}</h3>
                  </div>

                  <h3 className="text-[13px] mr-4 text-gray-400">{item.duration}</h3>
                  <HiDotsHorizontal className="text-gray-400 hover:text-white" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Container;