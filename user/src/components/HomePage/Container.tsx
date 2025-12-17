import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import { Gem } from "lucide-react";
import { useMusic, type Song } from "../../contexts/MusicContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { getArtists, type ArtistWithTotalViews } from "../../services/artist.service";
import { getSongsByArtistId, getNewReleases, getWeeklyTopTracks } from "../../services/song.service";
import { getAlbums } from "../../services/album.service";
import { getTopGenres, type TopGenre } from "../../services/genre.service";
import CommentModal from "../Comments/CommentModal";
import { FaComment } from "react-icons/fa";

const Container = () => {
  const navigate = useNavigate();
  const { setCurrentlyPlayingSong, setQueue, setCurrentIndex } = useMusic();
  const { t } = useLanguage();
  const [songs, setSongs] = useState<any[]>([]); // Recently Played
  const [weeklySongs, setWeeklySongs] = useState<any[]>([]); // Weekly Top 15
  const [songDurations, setSongDurations] = useState<Record<number, string>>({}); // Lưu duration đã load từ audio
  const [featuredAlbums, setFeaturedAlbums] = useState<any[]>([]); // State mới cho Featured Albums
  const [featuredArtists, setFeaturedArtists] = useState<ArtistWithTotalViews[]>([]); // Featured Artists
  const [newReleases, setNewReleases] = useState<any[]>([]); // New Releases
  const [topGenres, setTopGenres] = useState<TopGenre[]>([]); // Top Genres
  const [commentModal, setCommentModal] = useState<{ isOpen: boolean; songId: number; songTitle: string }>({
    isOpen: false,
    songId: 0,
    songTitle: '',
  });

  // Slider state
  const [recentlyIndex, setRecentlyIndex] = useState<number>(0);
  const [featuredArtistsIndex, setFeaturedArtistsIndex] = useState<number>(0);
  const [featuredAlbumsIndex, setFeaturedAlbumsIndex] = useState<number>(0);
  const ITEMS_PER_ROW = 6;

  useEffect(() => {
    const songID = localStorage.getItem("userId");

    // API Recently Played
    axios
      .get(`http://localhost:3000/songs/?songID=${songID}`)
      .then((res) => setSongs(res.data.slice(0, 6)));

    // API Weekly Top 15
    const fetchWeeklyTopSongs = async () => {
      try {
        const topTracks = await getWeeklyTopTracks(15);
        // Map từ TrendingSong[] sang format song đơn giản
        const mappedSongs = topTracks.map(track => ({
          id: track.song.id,
          title: track.song.title,
          description: track.song.artist?.artistName || "Unknown Artist",
          artist: track.song.artist,
          coverImage: track.song.coverImage || './slide/Song1.jpg',
          fileUrl: track.song.fileUrl,
          duration: track.song.duration, // Lấy duration từ song object
          type: track.song.type,
          artistId: track.song.artistId,
          playCount: track.playCount,
        }));
        setWeeklySongs(mappedSongs);
      } catch (err) {
        console.log("Lỗi fetch weekly songs:", err);
        // Fallback: dùng API cũ nếu weekly top tracks không hoạt động
        try {
          const res = await axios.get("http://localhost:3000/songs");
          // Đảm bảo duration được lấy từ response
          const songsWithDuration = res.data.slice(0, 15).map((song: any) => ({
            ...song,
            duration: song.duration || undefined, // Đảm bảo duration được giữ nguyên
          }));
          setWeeklySongs(songsWithDuration);
        } catch (fallbackErr) {
          console.log("Lỗi fetch fallback songs:", fallbackErr);
        }
      }
    };
    fetchWeeklyTopSongs();

    // API Featured Albums (MỚI)
    getAlbums()
      .then((albums) => {
        // Lưu toàn bộ để có thể trượt nhiều trang
        setFeaturedAlbums(albums);
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

    // API Top Genres
    const fetchTopGenres = async () => {
      try {
        const genres = await getTopGenres(6); // Lấy 6 genres để hiển thị
        setTopGenres(genres);
      } catch (error) {
        console.error("Lỗi fetch top genres:", error);
      }
    };

    fetchTopGenres();
  }, []);

  // Load duration từ audio metadata cho các bài hát không có duration
  useEffect(() => {
    if (weeklySongs.length === 0) return;

    const loadDurationsFromAudio = async () => {
      const durationMap: Record<number, string> = {};
      
      await Promise.all(
        weeklySongs.map(async (song) => {
          if ((!song.duration || song.duration === '0:00' || song.duration === '00:00:00') && song.fileUrl) {
            try {
              const audio = new Audio(song.fileUrl);
              await new Promise<void>((resolve) => {
                const handleLoadedMetadata = () => {
                  if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    const mins = Math.floor(audio.duration / 60);
                    const secs = Math.floor(audio.duration % 60);
                    durationMap[song.id] = `${mins}:${secs.toString().padStart(2, '0')}`;
                  }
                  audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                  audio.removeEventListener('error', handleError);
                  resolve();
                };
                
                const handleError = () => {
                  audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                  audio.removeEventListener('error', handleError);
                  resolve();
                };
                
                audio.addEventListener('loadedmetadata', handleLoadedMetadata);
                audio.addEventListener('error', handleError);
                audio.load();
                
                // Timeout sau 5 giây
                setTimeout(() => {
                  audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                  audio.removeEventListener('error', handleError);
                  resolve();
                }, 5000);
              });
            } catch (error) {
              console.error(`Error loading duration for song ${song.id}:`, error);
            }
          }
        })
      );
      
      if (Object.keys(durationMap).length > 0) {
        setSongDurations(prev => ({ ...prev, ...durationMap }));
      }
    };
    
    loadDurationsFromAudio();
  }, [weeklySongs]);

  // Load duration từ audio metadata cho New Releases
  useEffect(() => {
    if (newReleases.length === 0) return;

    const loadDurationsFromAudio = async () => {
      const durationMap: Record<number, string> = {};
      
      await Promise.all(
        newReleases.map(async (song) => {
          if ((!song.duration || song.duration === '0:00' || song.duration === '00:00:00') && song.fileUrl) {
            try {
              const audio = new Audio(song.fileUrl);
              await new Promise<void>((resolve) => {
                const handleLoadedMetadata = () => {
                  if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    const mins = Math.floor(audio.duration / 60);
                    const secs = Math.floor(audio.duration % 60);
                    durationMap[song.id] = `${mins}:${secs.toString().padStart(2, '0')}`;
                  }
                  audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                  audio.removeEventListener('error', handleError);
                  resolve();
                };
                
                const handleError = () => {
                  audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                  audio.removeEventListener('error', handleError);
                  resolve();
                };
                
                audio.addEventListener('loadedmetadata', handleLoadedMetadata);
                audio.addEventListener('error', handleError);
                audio.load();
                
                // Timeout sau 5 giây
                setTimeout(() => {
                  audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                  audio.removeEventListener('error', handleError);
                  resolve();
                }, 5000);
              });
            } catch (error) {
              console.error(`Error loading duration for new release song ${song.id}:`, error);
            }
          }
        })
      );
      
      if (Object.keys(durationMap).length > 0) {
        setSongDurations(prev => ({ ...prev, ...durationMap }));
      }
    };
    
    loadDurationsFromAudio();
  }, [newReleases]);

  // Hàm format duration từ string (HH:MM:SS, MM:SS) hoặc seconds
  const formatDuration = (duration?: string | number): string => {
    if (!duration) return "0:00";
    
    // Nếu là số (seconds), convert sang MM:SS
    if (typeof duration === 'number') {
      const mins = Math.floor(duration / 60);
      const secs = Math.floor(duration % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Nếu là string số (seconds as string), parse và convert
    const numDuration = parseFloat(duration);
    if (!isNaN(numDuration) && isFinite(numDuration)) {
      const mins = Math.floor(numDuration / 60);
      const secs = Math.floor(numDuration % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Nếu đã là format HH:MM:SS hoặc MM:SS, giữ nguyên hoặc format lại
    const parts = duration.split(':');
    if (parts.length === 3) {
      // HH:MM:SS -> MM:SS (bỏ giờ nếu < 1 giờ)
      const hours = parseInt(parts[0]) || 0;
      const mins = parseInt(parts[1]) || 0;
      const secs = parseInt(parts[2]) || 0;
      if (hours > 0) {
        return `${hours * 60 + mins}:${secs.toString().padStart(2, '0')}`;
      }
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } else if (parts.length === 2) {
      // MM:SS -> giữ nguyên
      return duration;
    }
    
    return duration; // Fallback: trả về nguyên bản
  };

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
            <h3 
              className="w-full h-[20px] mb-[6.8px] truncate font-semibold flex items-center gap-1 hover:text-[#3BC8E7] transition cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/song/${song.id}`);
              }}
            >
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
          <h3 className="text-[15px] mx-2">
            {songDurations[song.id] || formatDuration(song.duration || song.song?.duration)}
          </h3>
          <HiDotsHorizontal className="" />
        </div>
      </div>
    );
  };

  const maxRecentlyIndex = Math.max(0, songs.length - ITEMS_PER_ROW);
  const maxFeaturedArtistsIndex = Math.max(0, featuredArtists.length - ITEMS_PER_ROW);
  const maxFeaturedAlbumsIndex = Math.max(0, featuredAlbums.length - ITEMS_PER_ROW);

  const visibleRecently = songs.slice(recentlyIndex, recentlyIndex + ITEMS_PER_ROW);
  const visibleFeaturedArtists = featuredArtists.slice(featuredArtistsIndex, featuredArtistsIndex + ITEMS_PER_ROW);
  const visibleFeaturedAlbums = featuredAlbums.slice(featuredAlbumsIndex, featuredAlbumsIndex + ITEMS_PER_ROW);

  const handleRecentlyPrev = () => {
    setRecentlyIndex((prev) => Math.max(0, prev - ITEMS_PER_ROW));
  };

  const handleRecentlyNext = () => {
    setRecentlyIndex((prev) => Math.min(maxRecentlyIndex, prev + ITEMS_PER_ROW));
  };

  const handleFeaturedArtistsPrev = () => {
    setFeaturedArtistsIndex((prev) => Math.max(0, prev - ITEMS_PER_ROW));
  };

  const handleFeaturedArtistsNext = () => {
    setFeaturedArtistsIndex((prev) => Math.min(maxFeaturedArtistsIndex, prev + ITEMS_PER_ROW));
  };

  const handleFeaturedAlbumsPrev = () => {
    setFeaturedAlbumsIndex((prev) => Math.max(0, prev - ITEMS_PER_ROW));
  };

  const handleFeaturedAlbumsNext = () => {
    setFeaturedAlbumsIndex((prev) => Math.min(maxFeaturedAlbumsIndex, prev + ITEMS_PER_ROW));
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
          <button
            className={`text-white ${recentlyIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:text-[#3BC8E7]"} transition`}
            onClick={handleRecentlyPrev}
            disabled={recentlyIndex === 0}
          >
            <FaChevronLeft />
          </button>

          {visibleRecently.map((s) => (
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

          <button
            className={`text-white ${recentlyIndex >= maxRecentlyIndex ? "opacity-50 cursor-not-allowed" : "hover:text-[#3BC8E7]"} transition`}
            onClick={handleRecentlyNext}
            disabled={recentlyIndex >= maxRecentlyIndex}
          >
            <FaChevronRight />
          </button>
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
            <button
              className={`text-white ${featuredArtistsIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:text-[#3BC8E7]"} transition`}
              onClick={handleFeaturedArtistsPrev}
              disabled={featuredArtistsIndex === 0}
            >
              <FaChevronLeft />
            </button>
            {featuredArtists.length > 0 ? (
              visibleFeaturedArtists.map((artist) => {
                return (
                  <div 
                    key={artist.id} 
                    className="text-white w-[175px] h-[217px] cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      // Navigate đến trang artist detail
                      window.location.href = `/artist/${artist.id}`;
                    }}
                  >
                    <img 
                      className="rounded-[10px] mb-[19.18px] w-full h-[175px] object-cover" 
                      src={artist.avatar || './slide/product7.jpg'} 
                      alt={artist.artistName}
                      onError={(e) => {
                        // Fallback nếu ảnh lỗi
                        (e.target as HTMLImageElement).src = './slide/product7.jpg';
                      }}
                    />
                    <h3 className="font-semibold truncate">{artist.artistName}</h3>
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
            <button
              className={`text-white ${featuredArtistsIndex >= maxFeaturedArtistsIndex ? "opacity-50 cursor-not-allowed" : "hover:text-[#3BC8E7]"} transition`}
              onClick={handleFeaturedArtistsNext}
              disabled={featuredArtistsIndex >= maxFeaturedArtistsIndex}
            >
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
                    const songDuration = songDurations[song.id] || formatDuration(song.duration);
                    
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
                          <h3 
                            className="w-[126px] h-[20px] mb-[6.8px] truncate flex items-center gap-1 hover:text-[#3BC8E7] transition cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/song/${song.id}`);
                            }}
                          >
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
            <button
              className={`text-white ${featuredAlbumsIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:text-[#3BC8E7]"} transition`}
              onClick={handleFeaturedAlbumsPrev}
              disabled={featuredAlbumsIndex === 0}
            >
              <FaChevronLeft />
            </button>

            {/* Map dữ liệu Featured Albums */}
            {featuredAlbums.length > 0 ? (
              visibleFeaturedAlbums.map((album) => (
                <div 
                  key={album.id} 
                  className="text-white w-[175px] h-[217px] cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    window.location.href = `/album/${album.id}`;
                  }}
                >
                  <img 
                    className="rounded-[10px] mb-[19.18px] w-full h-[175px] object-cover" 
                    src={album.coverImage} 
                    alt={album.title} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = './slide/product7.jpg';
                    }}
                  />
                  <h3 className="font-semibold truncate">
                    {album.title}
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

            <button
              className={`text-white ${featuredAlbumsIndex >= maxFeaturedAlbumsIndex ? "opacity-50 cursor-not-allowed" : "hover:text-[#3BC8E7]"} transition`}
              onClick={handleFeaturedAlbumsNext}
              disabled={featuredAlbumsIndex >= maxFeaturedAlbumsIndex}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* === TOP GENRES (ĐÃ GHÉP API) === */}
        <div className="mt-[64px]">
          <div className="flex justify-between">
            <span className="ml-[160px] h-[26px] text-[#3BC8E7] text-[18px] font-semibold ">
              Top Genres
            </span>
          </div>
          <div className="flex mt-[26px] ml-[160px] ">
            {/* Genre 0: Ảnh lớn bên trái (369x369) */}
            {topGenres[0] && (
              <div 
                className="relative w-[369px] h-[369px] rounded-[10px] overflow-hidden mr-[40px] cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.location.href = `/genres?genre=${encodeURIComponent(topGenres[0].genre.genreName)}`}
              >
                <img 
                  src={topGenres[0].genre.imageUrl || './slide/Romantic.jpg'} 
                  alt={topGenres[0].genre.genreName} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = './slide/Romantic.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-medium">{topGenres[0].genre.genreName}</h3>
                  <p className="text-sm text-gray-300 mt-1">{topGenres[0].songCount} songs</p>
                </div>
              </div>
            )}
            <div>
              <div className="flex mb-[20px] ">
                {/* Genre 1: Ảnh nhỏ trên trái (175x175) */}
                {topGenres[1] && (
                  <div 
                    className="relative w-[175px] h-[175px] rounded-[10px] overflow-hidden mr-[32px] cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.location.href = `/genres?genre=${encodeURIComponent(topGenres[1].genre.genreName)}`}
                  >
                    <img 
                      src={topGenres[1].genre.imageUrl || './slide/Classical.jpg'} 
                      alt={topGenres[1].genre.genreName} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = './slide/Classical.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-medium text-sm">{topGenres[1].genre.genreName}</h3>
                    </div>
                  </div>
                )}
                {/* Genre 2: Ảnh rộng trên phải (369x175) */}
                {topGenres[2] && (
                  <div 
                    className="relative w-[369px] h-[175px] rounded-[10px] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.location.href = `/genres?genre=${encodeURIComponent(topGenres[2].genre.genreName)}`}
                  >
                    <img 
                      src={topGenres[2].genre.imageUrl || './slide/HipHop.jpg'} 
                      alt={topGenres[2].genre.genreName} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = './slide/HipHop.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-medium">{topGenres[2].genre.genreName}</h3>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex ">
                {/* Genre 3: Ảnh rộng dưới trái (369x175) */}
                {topGenres[3] && (
                  <div 
                    className="relative w-[369px] h-[175px] rounded-[10px] overflow-hidden mr-[32px] cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.location.href = `/genres?genre=${encodeURIComponent(topGenres[3].genre.genreName)}`}
                  >
                    <img 
                      src={topGenres[3].genre.imageUrl || './slide/Dancing.jpg'} 
                      alt={topGenres[3].genre.genreName} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = './slide/Dancing.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-medium">{topGenres[3].genre.genreName}</h3>
                    </div>
                  </div>
                )}
                {/* Genre 4: Ảnh nhỏ dưới phải (175x175) */}
                {topGenres[4] && (
                  <div 
                    className="relative w-[175px] h-[175px] rounded-[10px] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.location.href = `/genres?genre=${encodeURIComponent(topGenres[4].genre.genreName)}`}
                  >
                    <img 
                      src={topGenres[4].genre.imageUrl || './slide/EDM.jpg'} 
                      alt={topGenres[4].genre.genreName} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = './slide/EDM.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-medium text-sm">{topGenres[4].genre.genreName}</h3>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Genre 5: Ảnh cao bên phải (174x369) */}
            {topGenres[5] && (
              <div 
                className="relative w-[174px] h-[369px] rounded-[10px] overflow-hidden ml-[40px] cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.location.href = `/genres?genre=${encodeURIComponent(topGenres[5].genre.genreName)}`}
              >
                <img 
                  src={topGenres[5].genre.imageUrl || './slide/Rock.jpg'} 
                  alt={topGenres[5].genre.genreName} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = './slide/Rock.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14182A] via-[#343E69] to-transparent opacity-90"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-medium">{topGenres[5].genre.genreName}</h3>
                  <p className="text-sm text-gray-300 mt-1">{topGenres[5].songCount} songs</p>
                </div>
              </div>
            )}
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