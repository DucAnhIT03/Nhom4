import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Music, Search, Calendar, Loader2, X, Upload, XCircle, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat } from 'lucide-react';
import {
  getMyAlbums,
  createMyAlbum,
  updateMyAlbum,
  deleteMyAlbum,
  getMyAlbumSongs,
  addSongToMyAlbum,
  deleteMySong,
  type MyAlbum,
  type MySong,
  type CreateAlbumDto,
  type UpdateAlbumDto,
  type CreateSongDto,
} from '../../services/artist-my-content.service';
import { uploadFile } from '../../services/upload.service';

interface MyAlbumsTabProps {
  onAlbumClick?: (album: MyAlbum) => void;
}

interface CustomAudioPlayerProps {
  fileUrl: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onSeek: (time: number) => void;
  audioRef: (ref: HTMLAudioElement | null) => void;
}

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({
  fileUrl,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onTimeUpdate,
  onDurationChange,
  onSeek,
  audioRef,
}) => {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    audioRef(audio);

    const handleTimeUpdate = () => {
      onTimeUpdate(audio.currentTime);
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        onDurationChange(audio.duration);
      }
    };

    const handleLoadedData = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        onDurationChange(audio.duration);
      }
    };

    const handleCanPlay = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        onDurationChange(audio.duration);
      }
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 'all') {
        // Logic for repeat all - would need parent component
        onPause();
      } else {
        onPause();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('ended', handleEnded);

    // Force load duration if already available
    if (audio.readyState >= 2 && audio.duration && !isNaN(audio.duration)) {
      onDurationChange(audio.duration);
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onDurationChange, onPause, repeatMode, audioRef]);

  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const progressBar = progressBarRef.current;
    if (!progressBar || !duration || duration <= 0) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleProgressClick(e);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-md">
      <audio 
        ref={audioElementRef} 
        src={fileUrl} 
        preload="auto"
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            onDurationChange(audio.duration);
          }
        }}
      />
      
      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <button
          onClick={() => setIsShuffle(!isShuffle)}
          className={`p-1 ${isShuffle ? 'text-[#3BC8E7]' : 'text-gray-400'} hover:text-white transition`}
          title="Shuffle"
        >
          <Shuffle size={16} />
        </button>
        
        <button
          className="text-gray-400 hover:text-white transition"
          title="Previous"
        >
          <SkipBack size={18} />
        </button>
        
        <button
          onClick={() => {
            if (isPlaying) {
              onPause();
            } else {
              onPlay();
            }
          }}
          className="bg-white rounded-full p-2 hover:bg-gray-200 transition flex items-center justify-center"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={20} className="text-black" />
          ) : (
            <Play size={20} className="text-black ml-0.5" />
          )}
        </button>
        
        <button
          className="text-gray-400 hover:text-white transition"
          title="Next"
        >
          <SkipForward size={18} />
        </button>
        
        <button
          onClick={() => {
            if (repeatMode === 'off') setRepeatMode('all');
            else if (repeatMode === 'all') setRepeatMode('one');
            else setRepeatMode('off');
          }}
          className={`p-1 ${
            repeatMode !== 'off' ? 'text-[#3BC8E7]' : 'text-gray-400'
          } hover:text-white transition`}
          title={`Repeat: ${repeatMode}`}
        >
          <Repeat size={16} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <span className="text-white text-xs min-w-[2.5rem] text-right">
          {formatTime(currentTime)}
        </span>
        
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            className="flex-1 h-1 bg-gray-700 rounded-full cursor-pointer relative group"
            style={{ userSelect: 'none' }}
          >
          <div
            className="h-full bg-[#3BC8E7] rounded-full transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#3BC8E7] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercentage}% - 6px)` }}
          />
        </div>
        
        <span className="text-white text-xs min-w-[2.5rem]">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

const MyAlbumsTab: React.FC<MyAlbumsTabProps> = ({ onAlbumClick }) => {
  const [albums, setAlbums] = useState<MyAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<MyAlbum | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<MyAlbum | null>(null);
  const [albumSongs, setAlbumSongs] = useState<MySong[]>([]);
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});
  const limit = 10;

  const [albumForm, setAlbumForm] = useState({
    title: '',
    releaseDate: new Date().toISOString().split('T')[0],
    coverImage: '',
    coverImageFile: null as File | null,
    coverImagePreview: '',
    type: 'FREE' as 'FREE' | 'PREMIUM',
  });

  const [songForm, setSongForm] = useState({
    title: '',
    duration: '',
    fileUrl: '',
    file: null as File | null,
    fileName: '',
  });

  // Upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadProgressCover, setUploadProgressCover] = useState(0);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadProgressAudio, setUploadProgressAudio] = useState(0);
  const [error, setError] = useState('');

  // Refs
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAlbums();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    if (selectedAlbum) {
      loadAlbumSongs(selectedAlbum.id);
    }
  }, [selectedAlbum]);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const response = await getMyAlbums(currentPage, limit, searchTerm || undefined);
      setAlbums(response.data);
      setTotal(response.total);
    } catch (error: any) {
      console.error('Error loading albums:', error);
      // Don't show alert for 401 errors as user will be redirected
      if (error.response?.status !== 401) {
        alert(error.response?.data?.message || 'Không thể tải danh sách album');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAlbumSongs = async (albumId: number) => {
    try {
      const songs = await getMyAlbumSongs(albumId);
      setAlbumSongs(songs);
    } catch (error: any) {
      console.error('Error loading songs:', error);
      // Don't show alert for 401 errors as user will be redirected
      if (error.response?.status !== 401) {
        alert(error.response?.data?.message || 'Không thể tải danh sách bài hát');
      }
    }
  };

  // Handle cover image upload
  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh (JPEG, PNG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploadingCover(true);
    setUploadProgressCover(0);
    setError('');

    try {
      const result = await uploadFile(file, (progress) => {
        setUploadProgressCover(progress);
      });
      setAlbumForm((prev) => ({
        ...prev,
        coverImage: result.url,
        coverImageFile: file,
        coverImagePreview: URL.createObjectURL(file),
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể upload file. Vui lòng thử lại.');
    } finally {
      setUploadingCover(false);
      setUploadProgressCover(0);
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCoverImage = () => {
    setAlbumForm((prev) => ({
      ...prev,
      coverImage: '',
      coverImageFile: null,
      coverImagePreview: '',
    }));
  };

  // Handle audio file upload
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setError('Vui lòng chọn file audio (MP3, WAV)');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 20MB');
      return;
    }

    setUploadingAudio(true);
    setUploadProgressAudio(0);
    setError('');

    try {
      const result = await uploadFile(file, (progress) => {
        setUploadProgressAudio(progress);
      });
      setSongForm((prev) => ({
        ...prev,
        fileUrl: result.url,
        file: file,
        fileName: file.name,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể upload file. Vui lòng thử lại.');
    } finally {
      setUploadingAudio(false);
      setUploadProgressAudio(0);
      if (audioFileInputRef.current) {
        audioFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAudioFile = () => {
    setSongForm((prev) => ({
      ...prev,
      fileUrl: '',
      file: null,
      fileName: '',
    }));
  };

  const handleCreateAlbum = async () => {
    if (!albumForm.title) {
      alert('Vui lòng nhập tên album');
      return;
    }

    try {
      const data: CreateAlbumDto = {
        title: albumForm.title,
        releaseDate: albumForm.releaseDate,
        coverImage: albumForm.coverImage,
        type: albumForm.type,
      };
      await createMyAlbum(data);
      alert('Tạo album thành công!');
      setIsCreating(false);
      setAlbumForm({ 
        title: '', 
        releaseDate: new Date().toISOString().split('T')[0], 
        coverImage: '', 
        coverImageFile: null,
        coverImagePreview: '',
        type: 'FREE' 
      });
      loadAlbums();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể tạo album');
    }
  };

  const handleUpdateAlbum = async () => {
    if (!editingAlbum || !albumForm.title) {
      alert('Vui lòng nhập tên album');
      return;
    }

    try {
      const data: UpdateAlbumDto = {
        title: albumForm.title,
        releaseDate: albumForm.releaseDate,
        coverImage: albumForm.coverImage,
        type: albumForm.type,
      };
      await updateMyAlbum(editingAlbum.id, data);
      alert('Cập nhật album thành công!');
      setEditingAlbum(null);
      setAlbumForm({ 
        title: '', 
        releaseDate: new Date().toISOString().split('T')[0], 
        coverImage: '', 
        coverImageFile: null,
        coverImagePreview: '',
        type: 'FREE' 
      });
      loadAlbums();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể cập nhật album');
    }
  };

  const handleDeleteAlbum = async (album: MyAlbum) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa album "${album.title}"?`)) {
      return;
    }

    try {
      await deleteMyAlbum(album.id);
      alert('Xóa album thành công!');
      if (selectedAlbum?.id === album.id) {
        setSelectedAlbum(null);
        setAlbumSongs([]);
      }
      loadAlbums();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể xóa album. Có thể album đang chứa bài hát.');
    }
  };

  const handleAddSong = async () => {
    if (!selectedAlbum || !songForm.title) {
      alert('Vui lòng nhập tên bài hát');
      return;
    }

    if (!songForm.fileUrl) {
      alert('Vui lòng upload file nhạc');
      return;
    }

    try {
      const data: CreateSongDto = {
        title: songForm.title,
        duration: songForm.duration,
        fileUrl: songForm.fileUrl,
      };
      await addSongToMyAlbum(selectedAlbum.id, data);
      alert('Thêm bài hát thành công!');
      setIsAddingSong(false);
      setSongForm({ title: '', duration: '', fileUrl: '', file: null, fileName: '' });
      loadAlbumSongs(selectedAlbum.id);
      loadAlbums(); // Reload để cập nhật songCount
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể thêm bài hát');
    }
  };

  const handleDeleteSong = async (song: MySong) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài hát "${song.title}"?`)) {
      return;
    }

    try {
      await deleteMySong(song.id);
      alert('Xóa bài hát thành công!');
      if (selectedAlbum) {
        loadAlbumSongs(selectedAlbum.id);
        loadAlbums(); // Reload để cập nhật songCount
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể xóa bài hát');
    }
  };

  const openEditAlbum = (album: MyAlbum) => {
    setEditingAlbum(album);
    setAlbumForm({
      title: album.title,
      releaseDate: album.releaseDate ? new Date(album.releaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      coverImage: album.coverImage || '',
      coverImageFile: null,
      coverImagePreview: album.coverImage || '',
      type: album.type || 'FREE',
    });
  };

  const openCreateAlbum = () => {
    setIsCreating(true);
    setAlbumForm({ 
      title: '', 
      releaseDate: new Date().toISOString().split('T')[0], 
      coverImage: '', 
      coverImageFile: null,
      coverImagePreview: '',
      type: 'FREE' 
    });
  };

  const totalPages = Math.ceil(total / limit);

  if (selectedAlbum) {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedAlbum(null)}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
          <h2 className="text-3xl font-bold text-white">Bài hát trong album: {selectedAlbum.title}</h2>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm bài hát..."
                className="w-full bg-[#1E2542] text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-[#3BC8E7]"
              />
            </div>
          </div>
          <button
            onClick={() => setIsAddingSong(true)}
            className="bg-[#3BC8E7] text-black px-4 py-2 rounded-full font-bold hover:bg-[#34b3ce] transition flex items-center gap-2"
          >
            <Plus size={18} /> Thêm bài hát
          </button>
        </div>

        {isAddingSong && (
          <div className="bg-[#1E2542] p-6 rounded-2xl border border-gray-700 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Thêm bài hát mới</h3>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Tên bài hát</label>
                <input
                  type="text"
                  value={songForm.title}
                  onChange={(e) => setSongForm({ ...songForm, title: e.target.value })}
                  className="w-full bg-[#151a30] text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-[#3BC8E7]"
                  placeholder="Nhập tên bài hát..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Thời lượng (HH:MM:SS)</label>
                  <input
                    type="text"
                    value={songForm.duration}
                    onChange={(e) => setSongForm({ ...songForm, duration: e.target.value })}
                    className="w-full bg-[#151a30] text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-[#3BC8E7]"
                    placeholder="00:03:30"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">File nhạc</label>
                  <div className="space-y-2">
                    {songForm.fileUrl && (
                      <div className="bg-[#151a30] p-3 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Music size={20} className="text-[#3BC8E7]" />
                          <span className="text-white text-sm">{songForm.fileName || 'File đã upload'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveAudioFile}
                          className="text-red-400 hover:text-red-500"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={audioFileInputRef}
                      accept="audio/*"
                      onChange={handleAudioFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      disabled={uploadingAudio}
                      className="w-full bg-[#151a30] text-white px-4 py-2 rounded-lg border border-gray-700 hover:border-[#3BC8E7] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingAudio ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          <span>Đang tải... {uploadProgressAudio}%</span>
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          <span>Chọn file nhạc (MP3, WAV - tối đa 20MB)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsAddingSong(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-700 text-white font-bold"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddSong}
                  className="flex-1 py-2 rounded-lg bg-[#3BC8E7] text-black font-bold"
                >
                  Thêm bài hát
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#1E2542] rounded-2xl overflow-hidden border border-gray-700">
          <table className="w-full text-left text-gray-300">
            <thead className="bg-[#151a30] text-gray-400 uppercase text-xs">
              <tr>
                <th className="p-4">Tên bài hát</th>
                <th className="p-4">Thanh nhạc</th>
                <th className="p-4">Lượt nghe</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {albumSongs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Chưa có bài hát nào trong album này
                  </td>
                </tr>
              ) : (
                albumSongs.map((song) => (
                  <tr key={song.id} className="border-b border-gray-700 hover:bg-[#252d4d] transition">
                    <td className="p-4 font-medium text-white flex items-center gap-3">
                      <Music size={20} className="text-[#3BC8E7]" />
                      {song.title}
                    </td>
                    <td className="p-4">
                      {song.fileUrl ? (
                        <CustomAudioPlayer
                          fileUrl={song.fileUrl}
                          isPlaying={playingSongId === song.id && isPlaying}
                          currentTime={playingSongId === song.id ? currentTime : 0}
                          duration={playingSongId === song.id ? duration : 0}
                          onPlay={() => {
                            // Dừng tất cả các bài hát khác
                            Object.values(audioRefs.current).forEach(audio => {
                              if (audio && audio !== audioRefs.current[song.id]) {
                                audio.pause();
                                audio.currentTime = 0;
                              }
                            });
                            setPlayingSongId(song.id);
                            setIsPlaying(true);
                          }}
                          onPause={() => {
                            setIsPlaying(false);
                          }}
                          onTimeUpdate={(time) => {
                            if (playingSongId === song.id) {
                              setCurrentTime(time);
                            }
                          }}
                          onDurationChange={(dur) => {
                            if (playingSongId === song.id) {
                              setDuration(dur);
                            }
                          }}
                          onSeek={(time) => {
                            const audio = audioRefs.current[song.id];
                            if (audio) {
                              audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
                              setCurrentTime(audio.currentTime);
                            }
                          }}
                          audioRef={(ref) => {
                            audioRefs.current[song.id] = ref;
                          }}
                        />
                      ) : (
                        <span className="text-sm text-gray-500 italic">Chưa có file nhạc</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-400">{song.views || 0}</td>
                    <td className="p-4 flex justify-center gap-3">
                      <button
                        onClick={() => handleDeleteSong(song)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Đăng tải của tôi</h2>
        <button
          onClick={openCreateAlbum}
          className="bg-[#3BC8E7] text-black px-4 py-2 rounded-full font-bold hover:bg-[#34b3ce] transition flex items-center gap-2"
        >
          <Plus size={18} /> Tạo Album mới
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm album theo tên..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#1E2542] text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-[#3BC8E7]"
          />
        </div>
      </div>

      {(isCreating || editingAlbum) && (
        <div className="bg-[#1E2542] p-8 rounded-2xl border border-gray-700 shadow-xl mb-6">
          <h3 className="text-2xl font-bold text-white mb-6">
            {editingAlbum ? 'Chỉnh sửa Album' : 'Tạo Album Mới'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Tên Album *</label>
              <input
                type="text"
                value={albumForm.title}
                onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]"
                placeholder="Nhập tên album..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Ngày phát hành</label>
                <input
                  type="date"
                  value={albumForm.releaseDate}
                  onChange={(e) => setAlbumForm({ ...albumForm, releaseDate: e.target.value })}
                  className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Loại Album</label>
                <select
                  value={albumForm.type}
                  onChange={(e) => setAlbumForm({ ...albumForm, type: e.target.value as 'FREE' | 'PREMIUM' })}
                  className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]"
                >
                  <option value="FREE">Miễn phí</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Ảnh bìa album</label>
              <div className="space-y-2">
                {(albumForm.coverImage || albumForm.coverImagePreview) && (
                  <div className="relative w-full aspect-square max-w-xs bg-[#151a30] rounded-lg overflow-hidden border border-gray-700">
                    <img
                      src={albumForm.coverImagePreview || albumForm.coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveCoverImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition"
                    >
                      <XCircle size={20} className="text-white" />
                    </button>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    ref={coverImageInputRef}
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => coverImageInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 hover:border-[#3BC8E7] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingCover ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Đang tải... {uploadProgressCover}%</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        <span>Chọn ảnh bìa (JPEG, PNG - tối đa 5MB)</span>
                      </>
                    )}
                  </button>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingAlbum(null);
                  setAlbumForm({ 
                    title: '', 
                    releaseDate: new Date().toISOString().split('T')[0], 
                    coverImage: '', 
                    coverImageFile: null,
                    coverImagePreview: '',
                    type: 'FREE' 
                  });
                  setError('');
                }}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold"
              >
                Hủy
              </button>
              <button
                onClick={editingAlbum ? handleUpdateAlbum : handleCreateAlbum}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-[#3BC8E7] text-black font-bold flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : editingAlbum ? 'Cập nhật' : 'Tạo Album'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-[#3BC8E7]" size={48} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                className="bg-[#1E2542] rounded-2xl overflow-hidden shadow-lg border border-gray-700 group hover:translate-y-[-5px] transition-all duration-300 cursor-pointer"
                onClick={() => {
                  setSelectedAlbum(album);
                  if (onAlbumClick) onAlbumClick(album);
                }}
              >
                <div className="relative aspect-square overflow-hidden bg-gray-800">
                  {album.coverImage ? (
                    <img
                      src={album.coverImage}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Music size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditAlbum(album);
                      }}
                      className="p-2 bg-white rounded-full hover:scale-110 transition"
                    >
                      <Edit size={20} className="text-black" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAlbum(album);
                      }}
                      className="p-2 bg-white rounded-full hover:scale-110 transition hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg truncate" title={album.title}>
                    {album.title}
                  </h3>
                  <div className="flex justify-between items-center mt-2 text-gray-400 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {album.releaseDate
                        ? new Date(album.releaseDate).toLocaleDateString('vi-VN')
                        : '-'}
                    </span>
                    <span className="bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-300">
                      {album.songCount || 0} bài hát
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="text-gray-400">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyAlbumsTab;

