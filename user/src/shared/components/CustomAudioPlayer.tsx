import { IoPlaySharp, IoPauseSharp } from "react-icons/io5";
import { useMusic } from "../../contexts/MusicContext";

interface CustomAudioPlayerProps {
  src: string;
  onPlay?: () => void;
  className?: string;
  songType?: "FREE" | "PREMIUM";
  songArtistId?: number | null;
  // Thông tin bài hát để set vào MusicContext
  songId?: number;
  songTitle?: string;
  songArtist?: string;
  songImage?: string;
  // Danh sách tất cả bài hát để set queue (tùy chọn)
  allSongs?: Array<{
    id: number;
    title: string;
    artist: string;
    fileUrl?: string;
    coverImage?: string;
    type?: "FREE" | "PREMIUM";
    artistId?: number | null;
  }>;
}

const CustomAudioPlayer = ({
  src,
  onPlay,
  className = "",
  songType,
  songArtistId,
  songId,
  songTitle,
  songArtist,
  songImage,
  allSongs,
}: CustomAudioPlayerProps) => {
  const { currentlyPlayingSong, setCurrentlyPlayingSong, setQueue, setCurrentIndex, stopAllAudio } = useMusic();

  const isCurrentSong = currentlyPlayingSong?.audioUrl === src;

  const handleClick = async () => {
    if (!songId || !songTitle || !src) return;

    // Nếu đang là bài hiện tại -> toggle dừng nhạc
    if (isCurrentSong) {
      // Dừng audio thực sự
      stopAllAudio();
      // Reset trạng thái context để thanh nhạc ẩn đi
      setCurrentlyPlayingSong(null);
      setQueue([]);
      setCurrentIndex(-1);
      return;
    }

    // Kiểm tra premium trước khi phát
    if (songType === "PREMIUM") {
      const { canPlayPremiumSong, isSongOwner } = await import("../../utils/premiumCheck");

      const isOwner = isSongOwner(songArtistId);
      if (!isOwner) {
        const checkResult = await canPlayPremiumSong({ type: songType, artistId: songArtistId });
        if (!checkResult.canPlay) {
          alert(checkResult.reason || "Bài hát này yêu cầu tài khoản Premium.");
          if (window.confirm((checkResult.reason || "") + "\n\nBạn có muốn nâng cấp tài khoản không?")) {
            window.location.href = "/upgrade";
          }
          return;
        }
      }
    }

    const musicSong = {
      id: songId,
      title: songTitle,
      artist: songArtist || "Unknown Artist",
      image: songImage || "./slide/Song1.jpg",
      audioUrl: src,
      type: songType,
      artistId: songArtistId,
    };

    // Set bài hát đang phát vào MusicContext để MusicPlayerBar xử lý audio thực
    setCurrentlyPlayingSong(musicSong);

    // Set queue nếu có danh sách tất cả bài hát
    if (allSongs && allSongs.length > 0) {
      const queue = allSongs
        .filter((s) => s.fileUrl)
        .map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist || "Unknown Artist",
          // Dùng ảnh riêng của từng bài hát, fallback về placeholder chung
          image: s.coverImage || "./slide/Song1.jpg",
          audioUrl: s.fileUrl || "",
          type: s.type,
          artistId: s.artistId,
        }));

      const currentIndex = queue.findIndex((s) => s.id === songId || s.audioUrl === src);
      setQueue(queue);
      setCurrentIndex(currentIndex >= 0 ? currentIndex : 0);
    } else {
      setQueue([musicSong]);
      setCurrentIndex(0);
    }

    if (onPlay) onPlay();
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className="bg-white text-black rounded-full w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition shadow-md"
        title="Phát bài hát"
      >
        {isCurrentSong ? (
          <IoPauseSharp className="text-base font-bold" />
        ) : (
          <IoPlaySharp className="text-base ml-0.5 font-bold" />
        )}
      </button>
    </div>
  );
};

export default CustomAudioPlayer;

