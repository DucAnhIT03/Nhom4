import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { FaChevronLeft } from "react-icons/fa";
import { getArtists, type Artist } from "../../services/artist.service";

const Container = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoading(true);
        const response = await getArtists(1, 100); // Lấy tối đa 100 artists
        setArtists(response.data);
      } catch (error) {
        console.error("Lỗi không tải được artists:", error);
        setArtists([]);
      } finally {
        setLoading(false);
      }
    };
    loadArtists();
  }, []);

  // Chia artists thành các nhóm
  const recentlyPlayed = artists.slice(0, 6); // 6 artists đầu cho Recently Played
  const featuredArtists = artists.slice(6); // Các artists còn lại cho Featured Artists
  
  // Chia featured artists thành các hàng, mỗi hàng 6 items
  const featuredRows: Artist[][] = [];
  for (let i = 0; i < featuredArtists.length; i += 6) {
    featuredRows.push(featuredArtists.slice(i, i + 6));
  }

  // Hàm render artist card
  const renderArtistCard = (artist: Artist) => {
    const defaultImage = "./slide/product1.jpg";
    const handleClick = () => {
      navigate(`/artist/${artist.id}`);
    };
    
    return (
      <div 
        key={artist.id} 
        className="text-white w-[175px] h-[217px] hover:scale-[1.05] transition-transform duration-200 cursor-pointer"
        onClick={handleClick}
      >
        <img
          className="rounded-[10px] mb-[19.18px] w-[175px] h-[175px] object-cover"
          src={artist.avatar || defaultImage}
          alt={artist.artistName}
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        <h3 className="font-semibold mb-1">
          <span className="hover:text-[#3BC8E7] transition">
            {artist.artistName}
          </span>
        </h3>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <span className="text-white text-lg">Đang tải...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Recently Played Section */}
      <div className="flex justify-between mt-[-463px]">
        <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold">
          Recently Played
        </span>
      </div>

      <div className="flex gap-[30px] mt-[32px] ml-[120px]">
        <button className="text-white hover:text-[#3BC8E7] transition">
          <FaChevronLeft />
        </button>

        {recentlyPlayed.length > 0 ? (
          recentlyPlayed.map((artist) => renderArtistCard(artist))
        ) : (
          <div className="text-gray-400 text-sm">Chưa có nghệ sĩ nào</div>
        )}

        <button className="text-white hover:text-[#3BC8E7] transition">
          <FaChevronRight />
        </button>
      </div>

      {/* Featured Artists Section */}
      <div className="flex justify-between mt-[64px]">
        <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold">
          Featured Artists
        </span>
      </div>

      {featuredRows.length > 0 ? (
        featuredRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-[30px] mt-[32px] ml-[159.88px]">
            {row.map((artist) => renderArtistCard(artist))}
          </div>
        ))
      ) : (
        <div className="text-center text-gray-400 py-20 mt-[32px]">
          <p className="text-lg">Chưa có nghệ sĩ nào</p>
        </div>
      )}
    </div>
  );
};

export default Container;
