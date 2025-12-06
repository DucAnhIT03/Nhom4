import { useEffect, useRef, useState } from "react";
import {
  IoPlaySharp,
  IoPauseSharp,
  IoPlaySkipBackSharp,
  IoPlaySkipForwardSharp,
  IoShuffleOutline,
  IoRepeatOutline,
} from "react-icons/io5";

interface CustomAudioPlayerProps {
  src: string;
  onPlay?: () => void;
  className?: string;
}

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return "0:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const CustomAudioPlayer = ({ src, onPlay, className = "" }: CustomAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const updateDuration = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("play", () => setIsPlaying(true));
      audio.removeEventListener("pause", () => setIsPlaying(false));
      audio.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, []);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
      if (onPlay) onPlay();
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    const audio = audioRef.current;

    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleSkipBack = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const handleSkipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Controls */}
      <div className="flex items-center gap-3 text-gray-400">
        <button className="hover:text-gray-300 transition" title="Shuffle">
          <IoShuffleOutline className="text-lg" />
        </button>
        <button className="hover:text-gray-300 transition" onClick={handleSkipBack} title="Previous">
          <IoPlaySkipBackSharp className="text-lg" />
        </button>
        
        <button
          onClick={handlePlayPause}
          className="bg-white text-black rounded-full w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition shadow-md"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <IoPauseSharp className="text-base font-bold" />
          ) : (
            <IoPlaySharp className="text-base ml-0.5 font-bold" />
          )}
        </button>
        
        <button className="hover:text-gray-300 transition" onClick={handleSkipForward} title="Next">
          <IoPlaySkipForwardSharp className="text-lg" />
        </button>
        <button className="hover:text-gray-300 transition" title="Repeat">
          <IoRepeatOutline className="text-lg" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 w-full">
        <span className="text-xs text-gray-400 min-w-[45px] text-right font-mono">{formatTime(currentTime)}</span>
        
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleProgressChange}
          className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3BC8E7 0%, #3BC8E7 ${(currentTime / (duration || 1)) * 100}%, rgba(107, 114, 128, 0.5) ${(currentTime / (duration || 1)) * 100}%, rgba(107, 114, 128, 0.5) 100%)`,
          }}
        />
        
        <span className="text-xs text-gray-400 min-w-[45px] font-mono">{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default CustomAudioPlayer;

