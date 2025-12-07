import { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { createBanner, updateBanner } from '@/services/banner.service';
import type { Banner, CreateBannerDto, UpdateBannerDto } from '@/services/banner.service';
import { getSongs } from '@/services/song.service';
import type { Song } from '@/services/song.service';
import { uploadFile } from '@/services/upload.service';
import './BannerModal.css';

interface BannerModalProps {
  banner: Banner | null;
  onClose: () => void;
  onSuccess: () => void;
}

const BannerModal = ({ banner, onClose, onSuccess }: BannerModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    content: '',
    songId: '',
    isActive: true,
  });
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSongs();
  }, []);

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || '',
        imageUrl: banner.imageUrl || '',
        content: banner.content || '',
        songId: banner.songId ? String(banner.songId) : '',
        isActive: banner.isActive !== undefined ? banner.isActive : true,
      });
    } else {
      setFormData({
        title: '',
        imageUrl: '',
        content: '',
        songId: '',
        isActive: true,
      });
    }
  }, [banner]);

  const loadSongs = async () => {
    setLoadingSongs(true);
    try {
      const data = await getSongs();
      setSongs(data || []);
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setLoadingSongs(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
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
        imageUrl: result.url,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể upload ảnh. Vui lòng thử lại.');
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
      imageUrl: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (banner) {
        // Update banner
        const updateData: UpdateBannerDto = {
          title: formData.title || undefined,
          imageUrl: formData.imageUrl || undefined,
          content: formData.content || undefined,
          songId: formData.songId ? Number(formData.songId) : undefined,
          isActive: formData.isActive,
        };
        await updateBanner(banner.id, updateData);
      } else {
        // Create banner
        const createData: CreateBannerDto = {
          title: formData.title,
          imageUrl: formData.imageUrl,
          content: formData.content || undefined,
          songId: formData.songId ? Number(formData.songId) : undefined,
          isActive: formData.isActive,
        };
        await createBanner(createData);
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
            {banner ? 'Chỉnh sửa banner' : 'Thêm banner mới'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Tiêu đề *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="Nhập tiêu đề banner"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ảnh banner *</label>
            <div className="image-upload-container">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                id="banner-image-upload"
              />
              {formData.imageUrl ? (
                <div className="image-preview-container">
                  <img src={formData.imageUrl} alt="Banner preview" className="image-preview" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="btn-remove-image"
                    title="Xóa ảnh"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label htmlFor="banner-image-upload" className="image-upload-label">
                  <Upload size={20} />
                  <span>{uploading ? `Đang tải... ${uploadProgress}%` : 'Chọn ảnh'}</span>
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
          </div>

          <div className="form-group">
            <label className="form-label">Nội dung</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Nhập nội dung banner (tùy chọn)"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Chọn bài hát</label>
            <select
              name="songId"
              value={formData.songId}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">-- Không chọn --</option>
              {loadingSongs ? (
                <option disabled>Đang tải danh sách bài hát...</option>
              ) : (
                songs.map((song) => (
                  <option key={song.id} value={song.id}>
                    {song.title} {song.artist ? `- ${song.artist.artistName}` : ''}
                  </option>
                ))
              )}
            </select>
            <small className="form-hint">Chọn bài hát để liên kết với banner (tùy chọn)</small>
          </div>

          <div className="form-group">
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="form-checkbox"
              />
              <span>Kích hoạt banner</span>
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading || !formData.imageUrl}>
              {loading ? 'Đang xử lý...' : banner ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BannerModal;

