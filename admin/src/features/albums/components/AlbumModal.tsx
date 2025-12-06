import { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { createAlbum, updateAlbum } from '@/services/album.service';
import type { Album, CreateAlbumDto, UpdateAlbumDto } from '@/services/album.service';
import { getArtists } from '@/services/artist.service';
import type { Artist } from '@/services/artist.service';
import { getGenres } from '@/services/genre.service';
import type { Genre } from '@/services/genre.service';
import { uploadFile } from '@/services/upload.service';
import './AlbumModal.css';

interface AlbumModalProps {
  album: Album | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AlbumModal = ({ album, onClose, onSuccess }: AlbumModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    albumOwnerType: 'artist' as 'artist' | 'genre',
    artistId: '',
    genreId: '',
    releaseDate: '',
    coverImage: '',
    type: 'FREE' as 'FREE' | 'PREMIUM',
  });
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [artistsData, genresData] = await Promise.all([
          getArtists(1, 1000),
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
    if (album) {
      const ownerType = album.artistId ? 'artist' : 'genre';
      setFormData({
        title: album.title || '',
        albumOwnerType: ownerType,
        artistId: album.artistId?.toString() || '',
        genreId: album.genreId?.toString() || '',
        releaseDate: album.releaseDate
          ? new Date(album.releaseDate).toISOString().split('T')[0]
          : '',
        coverImage: album.coverImage || '',
        type: album.type || 'FREE',
      });
    } else {
      setFormData({
        title: '',
        albumOwnerType: 'artist',
        artistId: '',
        genreId: '',
        releaseDate: '',
        coverImage: '',
        type: 'FREE',
      });
    }
  }, [album]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };
      // Khi thay đổi loại album, reset giá trị của loại kia
      if (name === 'albumOwnerType') {
        if (value === 'artist') {
          newData.genreId = '';
        } else {
          newData.artistId = '';
        }
      }
      return newData;
    });
    setError('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 5MB');
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
        coverImage: result.url,
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

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      coverImage: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (album) {
        // Update album
        const updateData: UpdateAlbumDto = {
          title: formData.title || undefined,
          artistId: formData.albumOwnerType === 'artist' && formData.artistId ? parseInt(formData.artistId) : undefined,
          genreId: formData.albumOwnerType === 'genre' && formData.genreId ? parseInt(formData.genreId) : undefined,
          releaseDate: formData.releaseDate || undefined,
          coverImage: formData.coverImage || undefined,
          type: formData.type || undefined,
        };
        await updateAlbum(album.id, updateData);
      } else {
        // Create album
        if (formData.albumOwnerType === 'artist' && !formData.artistId) {
          setError('Vui lòng chọn nghệ sĩ');
          setLoading(false);
          return;
        }
        if (formData.albumOwnerType === 'genre' && !formData.genreId) {
          setError('Vui lòng chọn thể loại');
          setLoading(false);
          return;
        }
        const createData: CreateAlbumDto = {
          title: formData.title,
          artistId: formData.albumOwnerType === 'artist' && formData.artistId ? parseInt(formData.artistId) : undefined,
          genreId: formData.albumOwnerType === 'genre' && formData.genreId ? parseInt(formData.genreId) : undefined,
          releaseDate: formData.releaseDate || undefined,
          coverImage: formData.coverImage || undefined,
          type: formData.type,
        };
        await createAlbum(createData);
      }

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
            {album ? 'Chỉnh sửa album' : 'Thêm album mới'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Tên album *</label>
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
            <label className="form-label">Loại album *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="albumOwnerType"
                  value="artist"
                  checked={formData.albumOwnerType === 'artist'}
                  onChange={handleChange}
                  className="radio-input"
                />
                <span>Album của nghệ sĩ</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="albumOwnerType"
                  value="genre"
                  checked={formData.albumOwnerType === 'genre'}
                  onChange={handleChange}
                  className="radio-input"
                />
                <span>Album của thể loại nhạc</span>
              </label>
            </div>
          </div>

          {formData.albumOwnerType === 'artist' ? (
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
          ) : (
            <div className="form-group">
              <label className="form-label">Thể loại *</label>
              <select
                name="genreId"
                value={formData.genreId}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Chọn thể loại</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.genreName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Loại *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="FREE">Miễn phí</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Ngày phát hành</label>
            <input
              type="date"
              name="releaseDate"
              value={formData.releaseDate}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ảnh bìa</label>
            <div className="image-upload-container">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                id="image-upload"
              />
              {formData.coverImage ? (
                <div className="image-preview-container">
                  <div className="image-preview">
                    <img src={formData.coverImage} alt="Cover" className="preview-image" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="btn-remove-image"
                      title="Xóa ảnh"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="image-upload" className="image-upload-label">
                  <Upload size={20} />
                  <span>{uploading ? `Đang tải... ${uploadProgress}%` : 'Chọn ảnh bìa'}</span>
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
            <p className="form-hint">Chấp nhận: JPG, PNG, GIF (tối đa 5MB)</p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : album ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlbumModal;

