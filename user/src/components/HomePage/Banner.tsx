import { useState, useEffect } from 'react';
import { getActiveBanners, type Banner as BannerType } from '../../services/banner.service';
import { getSongById } from '../../services/song.service';
import { toggleWishlist } from '../../services/wishlist.service';
import { useMusic } from '../../contexts/MusicContext';

const Banner = () => {
  const [banner, setBanner] = useState<BannerType | null>(null);
  const [loading, setLoading] = useState(false);
  const { setCurrentlyPlayingSong } = useMusic();

  useEffect(() => {
    const fetchBanner = async () => {
      const banners = await getActiveBanners();
      if (banners && banners.length > 0) {
        setBanner(banners[0]);
      }
    };
    fetchBanner();
  }, []);

  const handleListenNow = async () => {
    if (!banner?.songId) {
      alert('Banner chưa có bài hát được setup!');
      return;
    }

    setLoading(true);
    try {
      const song = await getSongById(banner.songId);
      if (song && song.fileUrl) {
        // Kiểm tra premium trước khi phát
        if (song.type === 'PREMIUM') {
          const { canPlayPremiumSong, isSongOwner } = await import('../../utils/premiumCheck');
          const songArtistId = song.artistId;
          
          // Kiểm tra nếu user là chủ sở hữu
          const isOwner = isSongOwner(songArtistId);
          
          if (!isOwner) {
            const checkResult = await canPlayPremiumSong(
              { type: song.type, artistId: songArtistId }
            );
            
            if (!checkResult.canPlay) {
              alert(checkResult.reason || 'Bài hát này yêu cầu tài khoản Premium.');
              setLoading(false);
              return;
            }
          }
        }

        setCurrentlyPlayingSong({
          title: song.title,
          artist: song.artist?.artistName || 'Unknown Artist',
          image: song.coverImage || banner.imageUrl,
          audioUrl: song.fileUrl,
          id: song.id,
          type: song.type,
          artistId: song.artistId,
        });
      } else {
        alert('Không tìm thấy bài hát hoặc bài hát chưa có file!');
      }
    } catch (error) {
      console.error('Error playing song:', error);
      alert('Có lỗi xảy ra khi phát nhạc!');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToQueue = async () => {
    if (!banner?.songId) {
      alert('Banner chưa có bài hát được setup!');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Vui lòng đăng nhập để thêm vào yêu thích!');
      return;
    }

    setLoading(true);
    try {
      const result = await toggleWishlist(Number(userId), banner.songId);
      if (result.isFavorite) {
        alert('Đã thêm vào danh sách yêu thích!');
      } else {
        alert('Đã xóa khỏi danh sách yêu thích!');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      alert('Có lỗi xảy ra khi thêm vào yêu thích!');
    } finally {
      setLoading(false);
    }
  };

  // Giữ nguyên form tĩnh, chỉ thay đổi dữ liệu từ API
  const bannerImage = banner?.imageUrl || './Banner/banner.png';
  const bannerTitle = banner?.title || "This Month kk's Record Breaking Albums !";
  const bannerContent = banner?.content || "Dream your moments, Until I Met You, Gimme Some Courage, Dark Alley, One More Of A Stranger,Endless Things, The Heartbeat Stops, Walking Promises, Desired Games and many more...";

  // Tách title thành 2 phần nếu có "kk's" hoặc giữ nguyên
  const titleParts = bannerTitle.includes("kk's") 
    ? bannerTitle.split("kk's")
    : [bannerTitle, ""];
  
  const firstTitle = titleParts[0] || "This Month kk's ";
  const secondTitle = titleParts[1] || " Record Breaking Albums !";

  // Tách content thành 2 dòng nếu quá dài
  const contentLines = bannerContent.length > 100 
    ? [
        bannerContent.substring(0, bannerContent.lastIndexOf(',', 100) + 1),
        bannerContent.substring(bannerContent.lastIndexOf(',', 100) + 1).trim()
      ]
    : [bannerContent, ""];

  return (
    <div className=" bg-[#14182A] h-[539px] w-auto ml-20 flex mt-[-511px]">
      <div className=" w-[511px] h-full ml-[88px] ">
        <img src={bannerImage} alt="" />
      </div>
      <div className=" ml-[0.75px] ">
        <div className="flex-col  ">
          <div className="mt-[54.5px]"><span className=" text-[45px] text-white font-bold ">{firstTitle}</span></div> 
          <div className="mb-[15px]"><span className=" text-[45px] text-[#3BC8E7] font-bold ">{secondTitle}</span></div>
        </div>
        <div className=" mb-[40.5px] w-[677.510009765625px] h-[90px] text-white flex-col ">
          <div className=" text-[15px] leading-[30px] "><span>{contentLines[0]}</span></div>
          <div className="text-[15px] leading-[30px]"><span>{contentLines[1]}</span></div>
        </div>
        <div className="text-[15px]">
          <button 
            onClick={handleListenNow}
            disabled={loading || !banner?.songId}
            className="w-[150px] h-[49px] bg-[#3BC8E7] rounded-2xl items-center mr-[29.75px] text-white transition-all duration-300 hover:brightness-125 hover:shadow-[0_0_10px_#3BC8E7] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Listen Now'}
          </button>

           <button 
            onClick={handleAddToQueue}
            disabled={loading || !banner?.songId}
            className="w-[150px] h-[49px] bg-[#3BC8E7] rounded-2xl items-center text-white transition-all duration-300 hover:brightness-125 hover:shadow-[0_0_10px_#3BC8E7] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Add To Queue'}
          </button>
          
        </div>
       
      
      
      </div>
      
    </div>
    
  )
}

export default Banner
