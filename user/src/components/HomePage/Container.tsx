import axios from "axios";
import { useState, useEffect } from "react";
import MusicPlayerBar from "./MusicPlayerBar";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";

interface Song {
  title: string;
  artist: string;
  image: string;
  audioUrl: string;
}

const Container = () => {
  const [currentlyPlayingSong, setCurrentlyPlayingSong] = useState<Song | null>(null);
  const [songs, setSongs] = useState<any[]>([]); // Recently Played
  const [weeklySongs, setWeeklySongs] = useState<any[]>([]); // Weekly Top 15
  const [featuredAlbums, setFeaturedAlbums] = useState<any[]>([]); // State mới cho Featured Albums

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
    axios
      .get("http://localhost:3000/albums") 
      .then((res) => {
        // Lấy 6 album đầu tiên để hiển thị
        setFeaturedAlbums(res.data.slice(0, 6)); 
      })
      .catch((err) => console.log("Lỗi fetch albums:", err));
  }, []);

  const handleSongClick = (songData: any) => {
    setCurrentlyPlayingSong({
      title: songData.title,
      artist: songData.description || songData.artist || "Unknown Artist",
      image: songData.coverImage,
      audioUrl: songData.fileUrl,
    });
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
            <h3 className="w-full h-[20px] mb-[6.8px] truncate font-semibold">
              {song.title}
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
            Recently Played
          </span>
        </div>

        <div className="flex gap-[30px] mt-[32px] ml-[120px]">
          <FaChevronLeft className="text-white cursor-pointer" />

          {songs.map((s) => (
            <div
              key={s.id}
              className="text-white w-[175px] h-[256px] cursor-pointer"
              onClick={() => handleSongClick(s)}
            >
              <img src={s.coverImage} className="rounded-[10px] mb-[19px] w-full h-[175px] object-cover" />
              <h3 className="font-semibold truncate">{s.title}</h3>
              <h3 className="text-[#DEDEDE] truncate">{s.description}</h3>
            </div>
          ))}

          <FaChevronRight className="text-white cursor-pointer" />
        </div>

        {/* === WEEKLY TOP 15 === */}
        <div>
          <div>
            <h3 className="text-[#3BC8E7] w-[133px] h-[26px] ml-[160px] mt-[64px] text-[18px] font-semibold">
              Weekly Top 15
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

        {/* === FEATURED ARTISTS (GIỮ NGUYÊN) === */}
        <div className="mt-[64px]">
          <div className="flex justify-between">
            <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold ">
              Featured Artists
            </span>
            <span className="mr-[165px] text-white text-[15px]">View more</span>
          </div>

          <div className="flex gap-[30px] mt-[32px] ml-[120px]">
            <button className="text-white">
              <FaChevronLeft />
            </button>
            <div className="text-white w-[175px] h-[217px]">
              <img className="rounded-[10px] mb-[19.18px] " src="./slide/product7.jpg" alt="" />
              <h3><a href="">Best Of Ava Cornish</a></h3>
            </div>
            <div className="text-white w-[175px] h-[217px]">
              <img className="rounded-[10px] mb-[19.18px]" src="./slide/product8.jpg" alt="" />
              <h3><a href="">Until I Met You</a></h3>
            </div>
            <div className="text-white w-[175px] h-[217px]">
              <img className="rounded-[10px] mb-[19.18px]" src="./slide/product9.jpg" alt="" />
              <h3><a href="">Gimme Some Courage</a></h3>
            </div>
            <div className="text-white w-[175px] h-[217px]">
              <img className="rounded-[10px] mb-[19.18px]" src="./slide/product10.jpg" alt="" />
              <h3><a href="">Dark Alley Acoustic</a></h3>
            </div>
            <div className="text-white w-[175px] h-[217px]">
              <img className="rounded-[10px] mb-[19.18px]" src="./slide/product11.jpg" alt="" />
              <h3><a href="">Walking Promises</a></h3>
            </div>
            <div className="text-white w-[175px] h-[217px]">
              <img className="rounded-[10px] mb-[19.18px]" src="./slide/Product12.jpg" alt="" />
              <h3><a href="">Desired Games</a></h3>
            </div>
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
              New Releases
            </span>
            <span className="mr-[165px] text-white text-[15px]">View more</span>
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
                <div
                  className="w-[267px] h-[50px] ml-[10px] flex text-white cursor-pointer hover:bg-[#252B4D] rounded-md p-1"
                  onClick={() =>
                    handleSongClick({
                      title: "Dark Alley Acoustic",
                      artist: "Ava Cornish",
                      image: "./slide/Song1.jpg",
                    })
                  }
                >
                  <img src="./slide/Song1.jpg" alt="" />
                  <span className="mr-[6.67px] text-[14px] ml-[20px]">
                    <h3 className="w-[126px] h-[20px] mb-[6.8px]">
                      Dark Alley Acoustic
                    </h3>
                    <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                  </span>
                  <h3 className="text-[15px] ">5:10</h3>
                </div>

                <div className="w-[267px] h-[50px] ml-[40px] flex text-white cursor-pointer hover:bg-[#252B4D] rounded-md p-1">
                  <img src="./slide/Song2.jpg" alt="" />
                  <span className="mr-[6.67px] text-[14px] ml-[20px] ">
                    <h3 className="w-[126px] h-[20px] mb-[6.8px]">
                      Dark Alley Acoustic
                    </h3>
                    <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                  </span>
                  <h3 className="text-[15px] ">5:10</h3>
                </div>

                <div className="w-[267px] h-[50px] ml-[40px] flex text-white cursor-pointer hover:bg-[#252B4D] rounded-md p-1">
                  <img src="./slide/Song3.jpg" alt="" />
                  <span className="mr-[6.67px] text-[14px] ml-[20px]">
                    <h3 className="w-[126px] h-[20px] mb-[6.8px]">
                      Dark Alley Acoustic
                    </h3>
                    <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                  </span>
                  <h3 className="text-[15px] ">5:10</h3>
                </div>

                <div className="w-[267px] h-[50px] ml-[40px] flex text-white cursor-pointer hover:bg-[#252B4D] rounded-md p-1">
                  <img src="./slide/Song4.jpg" alt="" />
                  <span className="mr-[6.67px] text-[14px] ml-[20px]">
                    <h3 className="w-[126px] h-[20px] mb-[6.8px]">
                      Dark Alley Acoustic
                    </h3>
                    <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                  </span>
                  <h3 className="text-[15px] ">5:10</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === FEATURED ALBUMS (ĐÃ GHÉP API) === */}
        <div className="mt-[64px]">
          <div className="flex justify-between h-[26px]">
            <span className="ml-[160px] text-[#3BC8E7]  text-[18px] font-semibold ">
              Featured Albums
            </span>
            <span className="mr-[165px] text-white text-[15px]">View more</span>
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

      <MusicPlayerBar song={currentlyPlayingSong} />
    </>
  );
};

export default Container;