import axios from "axios";
import { useState, useEffect } from "react";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import { Gem } from "lucide-react";
import { useMusic, type Song } from "../../contexts/MusicContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { getArtists, type ArtistWithTotalViews } from "../../services/artist.service";
import { getSongsByArtistId, getNewReleases } from "../../services/song.service";
import { getAlbums } from "../../services/album.service";
import CommentModal from "../Comments/CommentModal";
import { FaComment } from "react-icons/fa";

const Container = () => {
  const { currentlyPlayingSong, setCurrentlyPlayingSong, setQueue, setCurrentIndex } = useMusic();
  const { t } = useLanguage();
  const [songs, setSongs] = useState<any[]>([]); // Recently Played
  const [weeklySongs, setWeeklySongs] = useState<any[]>([]); // Weekly Top 15
  const [featuredAlbums, setFeaturedAlbums] = useState<any[]>([]); // State mới cho Featured Albums
  const [featuredArtists, setFeaturedArtists] = useState<ArtistWithTotalViews[]>([]); // Featured Artists
  const [allAlbums, setAllAlbums] = useState<any[]>([]); // Tất cả albums để tìm album của artist
  const [newReleases, setNewReleases] = useState<any[]>([]); // New Releases
  const [commentModal, setCommentModal] = useState<{ isOpen: boolean; songId: number; songTitle: string }>({
    isOpen: false,
    songId: 0,
    songTitle: '',
  });

  useEffect(() => {
    const songID = localStorage.getItem("userId");

    // API Recently Played
    axios
      .get(`http://localhost:3000/songs/?songID=${songID}`)
      .then((res) => setSongs(res.data.slice(0, 6)));

    // API Weekly Top 15
    axios
      .get("http://localhost:3000/songs")
      .then((res) => {
        setWeeklySongs(res.data);
      })
      .catch((err) => console.log("Lỗi fetch weekly songs:", err));

    // API Featured Albums (MỚI)
    getAlbums()
      .then((albums) => {
        // Lấy 6 album đầu tiên để hiển thị
        setFeaturedAlbums(albums.slice(0, 6));
        // Lưu tất cả albums để tìm album của artist
        setAllAlbums(albums);
      })
      .catch((err) => console.log("Lỗi fetch albums:", err));

    // API Featured Artists - Tính tổng lượt nghe và sắp xếp (xét từ thứ 2 đến hết chủ nhật)
    const fetchFeaturedArtists = async () => {
      try {
        // Lấy tất cả artists
        const artistsResponse = await getArtists(1, 100);
        const artists = artistsResponse.data;

        // Tính khoảng thời gian tuần hiện tại (thứ 2 đến chủ nhật)
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Số ngày từ thứ 2
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysFromMonday);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Tính tổng lượt nghe cho mỗi artist (chỉ tính songs được tạo trong tuần hiện tại)
        const artistsWithViews: ArtistWithTotalViews[] = await Promise.all(
          artists.map(async (artist) => {
            try {
              const songs = await getSongsByArtistId(artist.id);
              // Lọc songs được tạo trong tuần hiện tại (thứ 2 đến chủ nhật)
              const songsInWeek = songs.filter((song) => {
                if (!song.createdAt) return false;
                const songDate = new Date(song.createdAt);
                return songDate >= monday && songDate <= sunday;
              });
              // Tính tổng views của các songs trong tuần
              const totalViews = songsInWeek.reduce((sum, song) => sum + (song.views || 0), 0);
              return { ...artist, totalViews };
            } catch (error) {
              console.error(`Error fetching songs for artist ${artist.id}:`, error);
              return { ...artist, totalViews: 0 };
            }
          })
        );

        // Sắp xếp theo tổng lượt nghe giảm dần và lấy 6 artists đầu tiên
        const sortedArtists = artistsWithViews
          .sort((a, b) => b.totalViews - a.totalViews)
          .slice(0, 6);

        setFeaturedArtists(sortedArtists);
      } catch (error) {
        console.error("Lỗi fetch featured artists:", error);
      }
    };

    fetchFeaturedArtists();

    // API New Releases - Lấy các bài hát mới nhất
    const fetchNewReleases = async () => {
      try {
        const releases = await getNewReleases(4); // Lấy 4 bài mới nhất
        setNewReleases(releases);
      } catch (error) {
        console.error("Lỗi fetch new releases:", error);
      }
    };

    fetchNewReleases();
  }, []);

  const handleSongClick = async (songData: any) => {
    // Kiểm tra premium trước khi phát
    if (songData.type === 'PREMIUM') {
      const { canPlayPremiumSong, isSongOwner } = await import('../../utils/premiumCheck');
      const songArtistId = songData.artistId || songData.artist?.id;
      
      // Kiểm tra nếu user là chủ sở hữu
      const isOwner = isSongOwner(songArtistId);
      
      if (!isOwner) {
        const checkResult = await canPlayPremiumSong(
          { type: songData.type, artistId: songArtistId }
        );
        
        if (!checkResult.canPlay) {
          alert(checkResult.reason || 'Bài hát này yêu cầu tài khoản Premium.');
          return;
        }
      }
    }

    const song: Song = {
      title: songData.title,
      artist: songData.description || songData.artist || "Unknown Artist",
      image: songData.coverImage || songData.image,
      audioUrl: songData.fileUrl || songData.audioUrl,
      id: songData.id,
      type: songData.type,
      artistId: songData.artistId,
    };
    
    // Tạo queue từ tất cả danh sách bài hát có sẵn
    const allSongs: Song[] = [
      ...songs.map((s: any) => ({
        title: s.title,
        artist: s.description || s.artist || "Unknown Artist",
        image: s.coverImage || './slide/Song1.jpg',
        audioUrl: s.fileUrl || '',
        id: s.id,
        type: s.type,
        artistId: s.artistId,
      })),
      ...weeklySongs.map((s: any) => ({
        title: s.title,
        artist: s.description || s.artist?.artistName || "Unknown Artist",
        image: s.coverImage || './slide/Song1.jpg',
        audioUrl: s.fileUrl || '',
        id: s.id,
        type: s.type,
        artistId: s.artistId,
      })),
      ...newReleases.map((s: any) => ({
        title: s.title,
        artist: s.artist?.artistName || s.artist || "Unknown Artist",
        image: s.coverImage || './slide/Song1.jpg',
        audioUrl: s.fileUrl || '',
        id: s.id,
        type: s.type,
        artistId: s.artistId,
      })),
    ].filter(s => s.audioUrl); // Chỉ lấy bài có audioUrl

    // Đảm bảo có ít nhất bài hát hiện tại trong queue
    if (allSongs.length === 0) {
      // Nếu không có bài nào trong danh sách, tạo queue chỉ với bài hiện tại
      setQueue([song]);
      setCurrentIndex(0);
      setCurrentlyPlayingSong(song);
      return;
    }

    // Tìm index của bài hát được click
    const index = allSongs.findIndex(s => 
      s.audioUrl === song.audioUrl || (s.id && song.id && s.id === song.id)
    );

    if (index !== -1) {
      setQueue(allSongs);
      setCurrentIndex(index);
      setCurrentlyPlayingSong(song);
    } else {
      // Nếu không tìm thấy trong queue, thêm vào và phát
      const newQueue = [...allSongs, song];
      setQueue(newQueue);
      setCurrentIndex(newQueue.length - 1);
      setCurrentlyPlayingSong(song);
    }
  };

  // Hàm render item cho Weekly Top 15
  const renderWeeklyItem = (song: any, index: number) => {
    const rank = index + 1;
    const rankString = rank < 10 ? `0${rank}` : rank;

    return (
      <div
        key={song.id || index}
        className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center cursor-pointer hover:bg-[#252B4D]"
        onClick={() => handleSongClick(song)}
      >
        <div className="flex text-white items-center w-full">
          {/* Số thứ tự */}
          <h1 className="text-[40px] font-bold mr-[21px] w-[39px] flex justify-center text-transparent bg-clip-text bg-gradient-to-b from-white to-[#252B4D] stroke-white">
            {rankString}
          </h1>
          
          {/* Ảnh */}
          <img
            className="w-[50px] h-[50px] rounded-[5px] mr-[20px] object-cover"
            src={song.coverImage}
            alt={song.title}
          />
          
          {/* Thông tin */}
          <span className="flex-1 text-[14px] overflow-hidden">
            <h3 className="w-full h-[20px] mb-[6.8px] truncate font-semibold flex items-center gap-1">
              {song.title}
              {song.type === 'PREMIUM' && (
                <span title="Premium">
                  <Gem className="w-3 h-3 text-[#3BC8E7] flex-shrink-0" />
                </span>
              )}
            </h3>
            <h3 className="w-full h-[20px] text-[#DEDEDE] truncate">
              {song.description || (typeof song.artist === 'string' 
                ? song.artist 
                : song.artist?.artistName || "Unknown")}
            </h3>
          </span>

          {/* Thời gian & Menu */}
          <h3 className="text-[15px] mx-2">5:10</h3>
          <HiDotsHorizontal className="" />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mt-[43px] mb-[100px]">
        {/* === RECENTLY PLAYED === */}
        <div className="flex justify-between">
          <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold">
            {t('homepage.recentlyPlayed')}
          </span>
        </div>

        <div className="flex gap-[30px] mt-[32px] ml-[120px]">
          <FaChevronLeft className="text-white cursor-pointer" />

          {songs.map((s) => (
            <div
              key={s.id}
              className="text-white w-[175px] h-[256px] cursor-pointer relative group"
              onClick={() => handleSongClick(s)}
            >
              <img src={s.coverImage} className="rounded-[10px] mb-[19px] w-full h-[175px] object-cover" />
              <h3 className="font-semibold truncate flex items-center gap-1">
                {s.title}
                {s.type === 'PREMIUM' && (
                  <span title="Premium">
                    <Gem className="w-3 h-3 text-[#3BC8E7] flex-shrink-0" />
                  </span>
                )}
              </h3>
              <h3 className="text-[#DEDEDE] truncate">{s.description}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCommentModal({
                    isOpen: true,
                    songId: s.id,
                    songTitle: s.title,
                  });
                }}
                className="absolute top-2 right-2 bg-[#3BC8E7] text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                title={t('common.comment')}
              >
                <FaComment size={14} />
              </button>
            </div>
          ))}

          <FaChevronRight className="text-white cursor-pointer" />
        </div>

        {/* === WEEKLY TOP 15 === */}
        <div>
          <div>
            <h3 className="text-[#3BC8E7] w-[133px] h-[26px] ml-[160px] mt-[64px] text-[18px] font-semibold">
              {t('homepage.weeklyTop15')}
            </h3>
          </div>

          <div className="flex">
            {/* Cột 1: 5 bài đầu tiên */}
            <div className="ml-[160px] mt-[24px]">
              {weeklySongs.slice(0, 5).map((song, index) => 
                renderWeeklyItem(song, index)
              )}
            </div>

            {/* Cột 2: 10 bài tiếp theo */}
            <div className="ml-[40px] mt-[24px]">
              {weeklySongs.slice(5, 15).map((song, index) => 
                renderWeeklyItem(song, index + 5)
              )}
            </div>
          </div>
        </div>

        {/* === FEATURED ARTISTS (ĐÃ GHÉP API) === */}
        <div className="mt-[64px]">
          <div className="flex justify-between">
            <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold ">
              {t('homepage.featuredArtists')}
            </span>
            <span className="mr-[165px] text-white text-[15px]">{t('common.viewMore')}</span>
          </div>

          <div className="flex gap-[30px] mt-[32px] ml-[120px]">
            <button className="text-white">
              <FaChevronLeft />
            </button>
            {featuredArtists.length > 0 ? (
              featuredArtists.map((artist) => {
                // Tìm album đầu tiên của artist này từ tất cả albums
                const artistAlbum = allAlbums.find(album => album.artistId === artist.id);
                const displayImage = artistAlbum?.coverImage || artist.avatar || './slide/product7.jpg';
                const displayTitle = artistAlbum?.title || `Best Of ${artist.artistName}`;
                
                return (
                  <div 
                    key={artist.id} 
                    className="text-white w-[175px] h-[217px] cursor-pointer"
                    onClick={() => {
                      // Navigate đến trang artist detail
                      window.location.href = `/artist/${artist.id}`;
                    }}
                  >
                    <img 
                      className="rounded-[10px] mb-[19.18px] w-full h-[175px] object-cover" 
                      src={displayImage} 
                      alt={artist.artistName}
                      onError={(e) => {
                        // Fallback nếu ảnh lỗi
                        (e.target as HTMLImageElement).src = './slide/product7.jpg';
                      }}
                    />
                    <h3><a href={`/artist/${artist.id}`}>{displayTitle}</a></h3>
                  </div>
                );
              })
            ) : (
              // Hiển thị placeholder khi đang load
              <>
                <div className="text-white w-[175px] h-[217px]">
                  <img className="rounded-[10px] mb-[19.18px] " src="./slide/product7.jpg" alt="" />
                  <h3><a href="">Loading...</a></h3>
                </div>
                <div className="text-white w-[175px] h-[217px]">
                  <img className="rounded-[10px] mb-[19.18px]" src="./slide/product8.jpg" alt="" />
                  <h3><a href="">Loading...</a></h3>
                </div>
                <div className="text-white w-[175px] h-[217px]">
                  <img className="rounded-[10px] mb-[19.18px]" src="./slide/product9.jpg" alt="" />
                  <h3><a href="">Loading...</a></h3>
                </div>
                <div className="text-white w-[175px] h-[217px]">
                  <img className="rounded-[10px] mb-[19.18px]" src="./slide/product10.jpg" alt="" />
                  <h3><a href="">Loading...</a></h3>
                </div>
                <div className="text-white w-[175px] h-[217px]">
                  <img className="rounded-[10px] mb-[19.18px]" src="./slide/product11.jpg" alt="" />
                  <h3><a href="">Loading...</a></h3>
                </div>
                <div className="text-white w-[175px] h-[217px]">
                  <img className="rounded-[10px] mb-[19.18px]" src="./slide/Product12.jpg" alt="" />
                  <h3><a href="">Loading...</a></h3>
                </div>
              </>
            )}
            <button className="text-white">
              <FaChevronRight />
            </button>
          </div>
          <img className="w-[1200px] h-[148px] mt-[48px] ml-[160px] " src="./slide/bar.jpg" alt="" />
        </div>

        {/* === NEW RELEASES (GIỮ NGUYÊN) === */}
        <div className="mt-[64px]">
          <div className="flex justify-between">
            <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold ">
              {t('homepage.newReleases')}
            </span>
            <span className="mr-[165px] text-white text-[15px]">{t('common.viewMore')}</span>
          </div>
          <div className="w-[1200px] h-[83px] ">
            <div className="w-[1200px] h-[10px] ml-[160px] mt-[24px]">
              <hr className="text-[#252B4DBF]" />

              <div className="relative flex items-center ">
                <div className="absolute w-[10px] h-[10px] left-[345.5px]  bg-[#3BC8E7] rounded-full">
                  <div className="absolute w-[6px] h-[6px] left-[2px] top-[2px] bg-[#14182A] rounded-full"></div>
                </div>
              </div>
              <div className="relative flex items-center">
                <div className="absolute w-[10px] h-[10px] left-[38px]  bg-[#FFFF] rounded-full">
                  <div className="absolute w-[6px] h-[6px] left-[2px] top-[2px] bg-[#14182A] rounded-full"></div>
                </div>
              </div>
              <div className="relative flex items-center">
                <div className="absolute w-[10px] h-[10px] left-[654px]  bg-[#3BC8E7] rounded-full">
                  <div className="absolute w-[6px] h-[6px] left-[2px] top-[2px] bg-[#14182A] rounded-full"></div>
                </div>
              </div>
              <div className="relative flex items-center ">
                <div className="absolute w-[10px] h-[10px] left-[960.5px] bg-[#3BC8E7] rounded-full">
                  <div className="absolute w-[6px] h-[6px] left-[2px] top-[2px] bg-[#14182A] rounded-full"></div>
                </div>
              </div>

              <div className="flex mt-[16px]">
                {newReleases.length > 0 ? (
                  newReleases.map((song, index) => {
                    const songImage = song.coverImage || './slide/Song1.jpg';
                    const songTitle = song.title || 'Unknown';
                    const songArtist = song.artist?.artistName || song.artist || 'Unknown Artist';
                    const songDuration = song.duration || '0:00';
                    
                    return (
                      <div
                        key={song.id || index}
                        className={`w-[267px] h-[50px] ${index === 0 ? 'ml-[10px]' : 'ml-[40px]'} flex text-white cursor-pointer hover:bg-[#252B4D] rounded-md p-1`}
                        onClick={() =>
                          handleSongClick({
                            title: songTitle,
                            artist: songArtist,
                            image: songImage,
                            coverImage: songImage,
                            fileUrl: song.fileUrl,
                            audioUrl: song.fileUrl,
                            type: song.type,
                            artistId: song.artistId,
                          })
                        }
                      >
                        <img 
                          src={songImage} 
                          alt={songTitle}
                          className="w-[50px] h-[50px] object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = './slide/Song1.jpg';
                          }}
                        />
                        <span className="mr-[6.67px] text-[14px] ml-[20px]">
                          <h3 className="w-[126px] h-[20px] mb-[6.8px] truncate flex items-center gap-1">
                            {songTitle}
                            {song.type === 'PREMIUM' && (
                              <span title="Premium">
                                <Gem className="w-3 h-3 text-[#3BC8E7] flex-shrink-0" />
                              </span>
                            )}
                          </h3>
                          <h3 className="w-[78px] h-[20px] truncate">{songArtist}</h3>
                        </span>
                        <h3 className="text-[15px]">{songDuration}</h3>
                      </div>
                    );
                  })
                ) : (
                  // Hiển thị placeholder khi đang load
                  <>
                    <div className="w-[267px] h-[50px] ml-[10px] flex text-white cursor-pointer hover:bg-[#252B4D] rounded-md p-1">
                      <img src="./slide/Song1.jpg" alt="" />
                      <span className="mr-[6.67px] text-[14px] ml-[20px]">
                        <h3 className="w-[126px] h-[20px] mb-[6.8px]">Loading...</h3>
                        <h3 className="w-[78px] h-[20px]">Loading...</h3>
                      </span>
                      <h3 className="text-[15px]">0:00</h3>
                    </div>
                    <div className="w-[267px] h-[50px] ml-[40px] flex text-white cursor-pointer hover:bg-[#252B4D] rounded-md p-1">
                      <img src="./slide/Song2.jpg" alt="" />
                      <span className="mr-[6.67px] text-[14px] ml-[20px]">
                        <h3 className="w-[126px] h-[20px] mb-[6.8px]">Loading...</h3>
                        <h3 className="w-[78px] h-[20px]">Loading...</h3>
                      </span>
                      <h3 className="text-[15px]">0:00</h3>
                    </div>
                    <div className="w-[267px] h-[50px] ml-[40px] flex text-white cursor-pointer hover:bg-[#252B4D] rounded-md p-1">
                      <img src="./slide/Song3.jpg" alt="" />
                      <span className="mr-[6.67px] text-[14px] ml-[20px]">
                        <h3 className="w-[126px] h-[20px] mb-[6.8px]">Loading...</h3>
                        <h3 className="w-[78px] h-[20px]">Loading...</h3>
                      </span>
                      <h3 className="text-[15px]">0:00</h3>
                    </div>
                    <div className="w-[267px] h-[50px] ml-[40px] flex text-white cursor-pointer hover:bg-[#252B4D] rounded-md p-1">
                      <img src="./slide/Song4.jpg" alt="" />
                      <span className="mr-[6.67px] text-[14px] ml-[20px]">
                        <h3 className="w-[126px] h-[20px] mb-[6.8px]">Loading...</h3>
                        <h3 className="w-[78px] h-[20px]">Loading...</h3>
                      </span>
                      <h3 className="text-[15px]">0:00</h3>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* === FEATURED ALBUMS (ĐÃ GHÉP API) === */}
        <div className="mt-[64px]">
          <div className="flex justify-between h-[26px]">
            <span className="ml-[160px] text-[#3BC8E7]  text-[18px] font-semibold ">
              {t('homepage.featuredAlbums')}
            </span>
            <span className="mr-[165px] text-white text-[15px]">{t('common.viewMore')}</span>
          </div>
          
          <div className="flex gap-[30px] mt-[32px] ml-[120px]">
            <button className="text-white">
              <FaChevronLeft />
            </button>

            {/* Map dữ liệu Featured Albums */}
            {featuredAlbums.length > 0 ? (
              featuredAlbums.map((album) => (
                <div 
                  key={album.id} 
                  className="text-white w-[175px] h-[217px] cursor-pointer"
                  onClick={() => {
                    // Xử lý khi click vào album (ví dụ: chuyển trang)
                    // Hiện tại tạm thời log ra console
                    console.log("Clicked album:", album.title);
                  }}
                >
                  <img 
                    className="rounded-[10px] mb-[19.18px] w-full h-[175px] object-cover" 
                    src={album.coverImage} 
                    alt={album.title} 
                  />
                  <h3 className="font-semibold truncate">
                    <a href="#">{album.title}</a>
                  </h3>
                  <h3 className="text-[#DEDEDE] h-[24px] truncate">
                    {typeof album.artist === 'string' 
                      ? album.artist 
                      : album.artist?.artistName || album.genre?.genreName || "Unknown Artist"}
                  </h3>
                </div>
              ))
            ) : (
              <p className="text-gray-400 ml-4">Loading albums...</p>
            )}

            <button className="text-white">
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* === TOP GENRES (GIỮ NGUYÊN) === */}
        <div className="mt-[64px]">
          <div className="flex justify-between">
            <span className="ml-[160px] h-[26px] text-[#3BC8E7] text-[18px] font-semibold ">
              Top Genres
            </span>
          </div>
          <div className="flex mt-[26px] ml-[160px] ">
            <div className="relative w-[369px] h-[369px] rounded-[10px] overflow-hidden mr-[40px]">
              <img src="./slide/Romantic.jpg" alt="Romantic" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-medium">Romantic</h3>
              </div>
            </div>
            <div>
              <div className="flex mb-[20px] ">
                <div className="relative w-[175px] h-[175px] rounded-[10px] overflow-hidden mr-[32px]">
                  <img src="./slide/Classical.jpg" alt="Classical" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-medium">Classical</h3>
                  </div>
                </div>
                <div className="relative w-[369px] h-[175px] rounded-[10px] overflow-hidden ">
                  <img src="./slide/HipHop.jpg" alt="HipHop" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-medium">HipHop</h3>
                  </div>
                </div>
              </div>
              <div className="flex ">
                <div className="relative w-[369px] h-[175px] rounded-[10px] overflow-hidden mr-[32px] ">
                  <img src="./slide/Dancing.jpg" alt="Dancing" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-medium">Dancing</h3>
                  </div>
                </div>
                <div className="relative w-[175px] h-[175px] rounded-[10px] overflow-hidden  ">
                  <img src="./slide/EDM.jpg" alt="EDM" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-medium">EDM</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative w-[174px] h-[369px] rounded-[10px] overflow-hidden ml-[40px]">
              <img src="./slide/Rock.jpg" alt="Rock" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-medium">Rock</h3>
              </div>
            </div>
          </div>
        </div>

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