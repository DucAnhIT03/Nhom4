import { useEffect, useRef, useState } from "react";
import {
  IoPlaySharp,
  IoPauseSharp,
  IoPlaySkipBackSharp,
  IoPlaySkipForwardSharp,
  IoVolumeHighSharp,
  IoVolumeMuteSharp,
  IoShuffleOutline,
  IoRepeatOutline,
  IoRepeat,
} from "react-icons/io5";
import { useMusic } from "../../contexts/MusicContext";

interface Song {
  title: string;
  artist: string;
  image: string;
  audioUrl: string;
}

interface MusicPlayerBarProps {
  song: Song | null;
}

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "0:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const MusicPlayerBar = ({ song }: MusicPlayerBarProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    isShuffle,
    setIsShuffle,
    repeatMode,
    setRepeatMode,
    playNext,
    playPrevious,
  } = useMusic();

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Load bài mới + auto play
  useEffect(() => {
    if (!song) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Reset state
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    audio.src = song.audioUrl;
    audio.load();

    // Cần chờ metadata để lấy duration
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    // Update current time
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    // Handle play/pause state
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Tự động chuyển bài tiếp theo khi hết
      if (repeatMode !== 'one') {
        playNext();
      } else {
        // Lặp lại bài hiện tại
        audio.currentTime = 0;
        audio.play();
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    audio.volume = volume;
    audio.play().catch((error) => {
      console.error("Lỗi phát nhạc:", error);
      setIsPlaying(false);
    });
    setIsPlaying(true);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [song, volume]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) audio.pause();
    else audio.play();

    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e: any) => {
    const time = Number(e.target.value);
    const audio = audioRef.current;

    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: any) => {
    const v = Number(e.target.value);
    const audio = audioRef.current;

    setVolume(v);
    if (audio) audio.volume = v;
    if (v > 0) setIsMuted(false);
  };

  const handleToggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (!song) return null;

  return (
    <>
      <audio ref={audioRef} />

      <div className="fixed bottom-0 left-0 w-full bg-[#181C33] text-white h-[90px] px-6 py-3 grid grid-cols-3 gap-4 z-50 border-t border-[#252B4D]">

        {/* Left */}
        <div className="flex items-center">
          <img src={song.image} className="w-[64px] h-[64px] rounded-md mr-4" />
          <div>
            <h4 className="font-bold">{song.title}</h4>
            <p className="text-[#DEDEDE] text-sm">{String(song.artist || 'Unknown')}</p>
          </div>
        </div>

        {/* Center */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-4 text-2xl text-gray-300">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`transition-colors ${isShuffle ? 'text-[#3BC8E7]' : 'text-gray-300 hover:text-white'}`}
              title="Shuffle"
            >
              <IoShuffleOutline />
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Previous clicked');
                playPrevious();
              }}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Previous"
            >
              <IoPlaySkipBackSharp />
            </button>

            <button
              onClick={handlePlayPause}
              className="bg-white text-black rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <IoPauseSharp /> : <IoPlaySharp />}
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Next clicked');
                playNext();
              }}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Next"
            >
              <IoPlaySkipForwardSharp />
            </button>
            
            <button
              onClick={() => {
                if (repeatMode === 'off') setRepeatMode('all');
                else if (repeatMode === 'all') setRepeatMode('one');
                else setRepeatMode('off');
              }}
              className={`transition-colors ${
                repeatMode !== 'off' ? 'text-[#3BC8E7]' : 'text-gray-300 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode === 'off' ? 'Off' : repeatMode === 'all' ? 'All' : 'One'}`}
            >
              {repeatMode === 'one' ? <IoRepeat /> : <IoRepeatOutline />}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full mt-2">
            <span className="text-xs">{formatTime(currentTime)}</span>

            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleProgressChange}
              className="w-full accent-[#3BC8E7]"
            />

            <span className="text-xs">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-3">
          <button onClick={handleToggleMute} className="text-2xl">
            {isMuted || volume === 0 ? <IoVolumeMuteSharp /> : <IoVolumeHighSharp />}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-[120px] accent-[#3BC8E7]"
          />
        </div>
      </div>
    </>
  );
};

export default MusicPlayerBar;
