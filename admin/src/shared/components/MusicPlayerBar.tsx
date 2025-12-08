import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import './MusicPlayerBar.css';

interface Song {
  id: number;
  title: string;
  fileUrl?: string;
  artist?: {
    id: number;
    artistName: string;
  };
}

interface MusicPlayerBarProps {
  song: Song | null;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
}

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return '0:00';
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const MusicPlayerBar = ({ song, onNext, onPrevious, onClose }: MusicPlayerBarProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isDraggingRef = useRef(false);

  // Cập nhật volume khi volume state thay đổi (không reload audio)
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && song?.fileUrl) {
      audio.volume = volume;
      audio.muted = isMuted;
    }
  }, [volume, isMuted, song]);

  // Load bài mới khi song thay đổi
  useEffect(() => {
    if (!song || !song.fileUrl) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    // Reset state
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    audio.src = song.fileUrl;
    audio.load();

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const updateTime = () => {
      if (!isDraggingRef.current) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onNext) {
        setTimeout(() => onNext(), 100);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    audio.volume = volume;
    audio.muted = isMuted;
    audio.play().catch((error) => {
      console.error('Lỗi phát nhạc:', error);
      setIsPlaying(false);
    });
    setIsPlaying(true);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [song, onNext]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !song?.fileUrl) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      console.error('Lỗi khi play/pause:', error);
      setIsPlaying(false);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    const audio = audioRef.current;

    if (!audio || !audio.src) return;

    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (v > 0) setIsMuted(false);
  };

  const handleToggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleClose = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (onClose) {
      onClose();
    }
  };

  if (!song || !song.fileUrl) return null;

  return (
    <>
      <audio ref={audioRef} />
      <div className="music-player-bar">
        {onClose && (
          <button
            onClick={handleClose}
            className="player-close-btn"
            title="Đóng"
          >
            <X size={18} />
          </button>
        )}
        <div className="player-left">
          <div className="player-info">
            <h4 className="player-title">{song.title}</h4>
            <p className="player-artist">
              {song.artist?.artistName || 'Unknown Artist'}
            </p>
          </div>
        </div>

        <div className="player-center">
          <div className="player-controls">
            {onPrevious && (
              <button
                onClick={onPrevious}
                className="player-btn"
                title="Previous"
              >
                <SkipBack size={20} />
              </button>
            )}

            <button
              onClick={handlePlayPause}
              className="player-btn player-btn-primary"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            {onNext && (
              <button
                onClick={onNext}
                className="player-btn"
                title="Next"
              >
                <SkipForward size={20} />
              </button>
            )}
          </div>

          <div className="player-progress">
            <span className="player-time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleProgressChange}
              onMouseDown={() => {
                isDraggingRef.current = true;
              }}
              onMouseUp={() => {
                isDraggingRef.current = false;
                const audio = audioRef.current;
                if (audio && isPlaying) {
                  audio.play().catch(console.error);
                }
              }}
              className="player-progress-bar"
            />
            <span className="player-time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="player-right">
          <button
            onClick={handleToggleMute}
            className="player-btn"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="player-volume-bar"
          />
        </div>
      </div>
    </>
  );
};

export default MusicPlayerBar;

