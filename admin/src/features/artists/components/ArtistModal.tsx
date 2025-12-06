import { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { createArtist, updateArtist } from '@/services/artist.service';
import type { Artist, CreateArtistDto, UpdateArtistDto } from '@/services/artist.service';
import { uploadFile } from '@/services/upload.service';
import './ArtistModal.css';

interface ArtistModalProps {
  artist: Artist | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ArtistModal = ({ artist, onClose, onSuccess }: ArtistModalProps) => {
  const [formData, setFormData] = useState({
    artistName: '',
    bio: '',
    avatar: '',
    nationality: '',
    age: '',
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (artist) {
      setFormData({
        artistName: artist.artistName || '',
        bio: artist.bio || '',
        avatar: artist.avatar || '',
        nationality: artist.nationality || '',
        age: artist.age?.toString() || '',
      });
    } else {
      setFormData({
        artistName: '',
        bio: '',
        avatar: '',
        nationality: '',
        age: '',
      });
    }
  }, [artist]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    setError('');

    try {
      const result = await uploadFile(file);
      setFormData((prev) => ({
        ...prev,
        avatar: result.url,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể upload ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      avatar: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (artist) {
        // Update artist
        const updateData: UpdateArtistDto = {
          artistName: formData.artistName,
          bio: formData.bio || undefined,
          avatar: formData.avatar || undefined,
          nationality: formData.nationality || undefined,
          age: formData.age ? parseInt(formData.age) : undefined,
        };
        await updateArtist(artist.id, updateData);
      } else {
        // Create artist
        const createData: CreateArtistDto = {
          artistName: formData.artistName,
          bio: formData.bio || undefined,
          avatar: formData.avatar || undefined,
          nationality: formData.nationality || undefined,
          age: formData.age ? parseInt(formData.age) : undefined,
        };
        await createArtist(createData);
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
            {artist ? 'Chỉnh sửa nghệ sĩ' : 'Thêm nghệ sĩ mới'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tên nghệ sĩ *</label>
              <input
                type="text"
                name="artistName"
                value={formData.artistName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Quốc tịch</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className="form-input"
                placeholder="Ví dụ: Việt Nam"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tuổi</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="form-input"
                placeholder="Ví dụ: 25"
                min="1"
                max="150"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ảnh đại diện</label>
              <div className="avatar-upload-container">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  id="avatar-upload"
                />
                {formData.avatar ? (
                  <div className="avatar-preview-container">
                    <img src={formData.avatar} alt="Avatar preview" className="avatar-preview" />
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
                  <label htmlFor="avatar-upload" className="avatar-upload-label">
                    <Upload size={20} />
                    <span>{uploading ? 'Đang tải...' : 'Chọn ảnh'}</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tiểu sử</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="form-input"
              rows={4}
              placeholder="Nhập tiểu sử nghệ sĩ..."
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : artist ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtistModal;

