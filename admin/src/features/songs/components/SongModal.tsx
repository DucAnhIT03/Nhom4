import { useState, useEffect, useRef } from 'react';
import { X, Upload, Music, ChevronDown } from 'lucide-react';
import { createSong, updateSong } from '@/services/song.service';
import type { Song, CreateSongDto, UpdateSongDto } from '@/services/song.service';
import { getArtists } from '@/services/artist.service';
import type { Artist } from '@/services/artist.service';
import { getGenres, getGenresOfSong, updateSongGenres } from '@/services/genre.service';
import type { Genre } from '@/services/genre.service';
import { uploadFile } from '@/services/upload.service';
import './SongModal.css';

interface SongModalProps {
  song: Song | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SongModal = ({ song, onClose, onSuccess }: SongModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    artistId: '',
    fileUrl: '',
  });
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [artistsData, genresData] = await Promise.all([
          getArtists(1, 1000), // Get all artists
          getGenres(),
        ]);
        setArtists(artistsData.data || []);
        setGenres(genresData || []);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title || '',
        artistId: song.artistId?.toString() || '',
        fileUrl: song.fileUrl || '',
      });
      setShowAudioPlayer(false);
      // Load genres của bài hát
      const loadSongGenres = async () => {
        try {
          const songGenres = await getGenresOfSong(song.id);
          setSelectedGenres(songGenres.map((g) => g.id));
        } catch (err) {
          console.error('Error loading song genres:', err);
        }
      };
      loadSongGenres();
    } else {
      setFormData({
        title: '',
        artistId: '',
        fileUrl: '',
      });
      setSelectedGenres([]);
      setShowAudioPlayer(false);
    }
    // Reset audio player when song changes
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [song]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleGenreToggle = (genreId: number) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      } else {
        return [...prev, genreId];
      }
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        genreDropdownRef.current &&
        !genreDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGenreDropdownOpen(false);
      }
    };

    if (isGenreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isGenreDropdownOpen]);

  const getSelectedGenresText = () => {
    if (selectedGenres.length === 0) {
      return 'Chọn thể loại';
    }
    const selectedGenreNames = genres
      .filter((g) => selectedGenres.includes(g.id))
      .map((g) => g.genreName);
    return selectedGenreNames.join(', ');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - chỉ cho phép audio files
    if (!file.type.startsWith('audio/')) {
      setError('Vui lòng chọn file audio (mp3, wav, m4a, etc.)');
      return;
    }

    // Validate file size (max 50MB cho audio)
    if (file.size > 50 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 50MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const result = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });
      setFormData((prev) => ({
        ...prev,
        fileUrl: result.url,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể upload file. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      fileUrl: '',
    }));
    setShowAudioPlayer(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let songId: number;
      
      if (song) {
        // Update song
        const updateData: UpdateSongDto = {
          title: formData.title || undefined,
          artistId: formData.artistId ? parseInt(formData.artistId) : undefined,
          fileUrl: formData.fileUrl || undefined,
        };
        await updateSong(song.id, updateData);
        songId = song.id;
      } else {
        // Create song
        if (!formData.artistId) {
          setError('Vui lòng chọn nghệ sĩ');
          setLoading(false);
          return;
        }
        if (!formData.fileUrl) {
          setError('Vui lòng upload file nhạc');
          setLoading(false);
          return;
        }
        const createData: CreateSongDto = {
          title: formData.title,
          artistId: parseInt(formData.artistId),
          fileUrl: formData.fileUrl,
        };
        const newSong = await createSong(createData);
        songId = newSong.id;
      }

      // Cập nhật thể loại cho bài hát (có thể gửi mảng rỗng để xóa tất cả thể loại)
      await updateSongGenres(songId, selectedGenres);
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {song ? 'Chỉnh sửa bài hát' : 'Thêm bài hát mới'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Tên bài hát *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nghệ sĩ *</label>
            <select
              name="artistId"
              value={formData.artistId}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Chọn nghệ sĩ</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.artistName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">File nhạc *</label>
            <div className="audio-upload-container">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="file-input"
                id="audio-upload"
              />
              {formData.fileUrl ? (
                <div className="audio-preview-container">
                  <div className="audio-preview">
                    <Music size={24} />
                    <div className="audio-info">
                      <span className="audio-name">File đã tải lên</span>
                      <button
                        type="button"
                        onClick={() => setShowAudioPlayer(!showAudioPlayer)}
                        className="audio-link-button"
                      >
                        {showAudioPlayer ? 'Ẩn player' : 'Nghe thử'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="btn-remove-audio"
                      title="Xóa file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {showAudioPlayer && (
                    <div className="audio-player-wrapper">
                      <audio
                        ref={audioRef}
                        src={formData.fileUrl}
                        controls
                        className="audio-player"
                        preload="metadata"
                      >
                        Trình duyệt của bạn không hỗ trợ phát audio.
                      </audio>
                    </div>
                  )}
                </div>
              ) : (
                <label htmlFor="audio-upload" className="audio-upload-label">
                  <Upload size={20} />
                  <span>{uploading ? `Đang tải... ${uploadProgress}%` : 'Chọn file nhạc'}</span>
                  {uploading && (
                    <div className="upload-progress-bar">
                      <div 
                        className="upload-progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </label>
              )}
            </div>
            <p className="form-hint">Chấp nhận: MP3, WAV, M4A, OGG (tối đa 50MB)</p>
          </div>

          <div className="form-group">
            <label className="form-label">Thể loại</label>
            <div className="genre-dropdown-wrapper" ref={genreDropdownRef}>
              <div
                className="genre-dropdown-trigger"
                onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
              >
                <span className={selectedGenres.length === 0 ? 'genre-placeholder' : ''}>
                  {getSelectedGenresText()}
                </span>
                <ChevronDown
                  size={20}
                  className={`genre-chevron ${isGenreDropdownOpen ? 'open' : ''}`}
                />
              </div>
              {isGenreDropdownOpen && (
                <div className="genre-dropdown-menu">
                  {genres.length === 0 ? (
                    <div className="genre-dropdown-item disabled">
                      Chưa có thể loại nào. Vui lòng thêm thể loại trước.
                    </div>
                  ) : (
                    genres.map((genre) => (
                      <label
                        key={genre.id}
                        className="genre-dropdown-item"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedGenres.includes(genre.id)}
                          onChange={() => handleGenreToggle(genre.id)}
                          className="genre-checkbox"
                        />
                        <span>{genre.genreName}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : song ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SongModal;

