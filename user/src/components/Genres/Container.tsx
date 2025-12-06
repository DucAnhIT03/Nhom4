import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGenres, type Genre } from '../../services/genre.service';

const Container = () => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const data = await getGenres();
        setGenres(data);
      } catch (error) {
        console.error('Error loading genres:', error);
      } finally {
        setLoading(false);
      }
    };
    loadGenres();
  }, []);

  // Hàm render genre card với kích thước và style tương ứng
  const renderGenreCard = (genre: Genre, width: string, height: string, marginRight?: string, marginLeft?: string) => {
    const defaultImage = './slide/Romantic.jpg'; // Ảnh mặc định nếu không có imageUrl
    const handleClick = () => {
      navigate(`/genre/${encodeURIComponent(genre.genreName)}`);
    };
    
    return (
      <div 
        key={genre.id}
        onClick={handleClick}
        className={`relative ${width} ${height} rounded-[10px] overflow-hidden ${marginRight || ''} ${marginLeft || ''} cursor-pointer transition-transform hover:scale-105`}
      >
        <img
          src={genre.imageUrl || defaultImage}
          alt={genre.genreName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="font-medium">{genre.genreName}</h3>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-white">Đang tải...</span>
      </div>
    );
  }

  // Chia genres thành các nhóm theo layout chính xác như form tĩnh
  // Hàng 1: 1 lớn (369x369) + 4 ảnh nhỏ (2 hàng) + 1 dọc (174x369) = 6 ảnh
  // Hàng 2: 5 ảnh nhỏ (2 hàng) + 2 ảnh dọc = 7 ảnh
  const row1Genres = genres.slice(0, 6); // 6 genres đầu cho hàng 1
  const row2Genres = genres.slice(6, 13); // 7 genres tiếp theo cho hàng 2

  return (
    <div>
      <div className="flex justify-between mt-[-463px]">
        <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold ">Top Genres</span>
        <span className="mr-[165px] text-white text-[15px]">View more</span>
      </div>

      {/* Hàng 1 */}
      <div className="flex mt-[26px] ml-[160px]">
        {/* Ảnh lớn đầu tiên */}
        {row1Genres[0] && renderGenreCard(row1Genres[0], 'w-[369px]', 'h-[369px]', 'mr-[40px]')}
        
        <div>
          {/* Hàng nhỏ 1 */}
          <div className="flex mb-[20px]">
            {row1Genres[1] && renderGenreCard(row1Genres[1], 'w-[175px]', 'h-[175px]', 'mr-[32px]')}
            {row1Genres[2] && renderGenreCard(row1Genres[2], 'w-[369px]', 'h-[175px]')}
          </div>
          
          {/* Hàng nhỏ 2 */}
          <div className="flex">
            {row1Genres[3] && renderGenreCard(row1Genres[3], 'w-[369px]', 'h-[175px]', 'mr-[32px]')}
            {row1Genres[4] && renderGenreCard(row1Genres[4], 'w-[175px]', 'h-[175px]')}
          </div>
        </div>
        
        {/* Ảnh dọc bên phải */}
        {row1Genres[5] && renderGenreCard(row1Genres[5], 'w-[174px]', 'h-[369px]', '', 'ml-[40px]')}
      </div>

      {/* Hàng 2 */}
      <div className="flex ml-[160px] mt-[25px]">
        <div>
          {/* Hàng nhỏ 1 */}
          <div className="flex mb-[20px]">
            {row2Genres[0] && renderGenreCard(row2Genres[0], 'w-[175px]', 'h-[175px]', 'mr-[32px]')}
            {row2Genres[1] && renderGenreCard(row2Genres[1], 'w-[369px]', 'h-[175px]')}
          </div>
          
          {/* Hàng nhỏ 2 */}
          <div className="flex">
            {row2Genres[2] && renderGenreCard(row2Genres[2], 'w-[175px]', 'h-[175px]', 'mr-[25px]')}
            {row2Genres[3] && renderGenreCard(row2Genres[3], 'w-[175px]', 'h-[175px]', 'mr-[26px]')}
            {row2Genres[4] && renderGenreCard(row2Genres[4], 'w-[175px]', 'h-[175px]')}
          </div>
        </div>
        
        {/* 2 ảnh dọc bên phải */}
        <div className="flex">
          {row2Genres[5] && renderGenreCard(row2Genres[5], 'w-[174px]', 'h-[369px]', '', 'ml-[40px]')}
          {row2Genres[6] && renderGenreCard(row2Genres[6], 'w-[369px]', 'h-[369px]', '', 'ml-[41px]')}
        </div>
      </div>
    </div>
  );
};

export default Container;
