import { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { createGenre, updateGenre } from '@/services/genre.service';
import type { Genre, CreateGenreDto, UpdateGenreDto } from '@/services/genre.service';
import { uploadFile } from '@/services/upload.service';
import './GenreModal.css';

interface GenreModalProps {
  genre: Genre | null;
  onClose: () => void;
  onSuccess: () => void;
}

const GenreModal = ({ genre, onClose, onSuccess }: GenreModalProps) => {
  const [formData, setFormData] = useState({
    genreName: '',
    imageUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (genre) {
      setFormData({
        genreName: genre.genreName || '',
        imageUrl: genre.imageUrl || '',
      });
    } else {
      setFormData({
        genreName: '',
        imageUrl: '',
      });
    }
  }, [genre]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (genre) {
        // Update genre
        const updateData: UpdateGenreDto = {
          genreName: formData.genreName || undefined,
          imageUrl: formData.imageUrl || undefined,
        };
        await updateGenre(genre.id, updateData);
      } else {
        // Create genre
        const createData: CreateGenreDto = {
          genreName: formData.genreName,
          imageUrl: formData.imageUrl || undefined,
        };
        await createGenre(createData);
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
            {genre ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Tên thể loại *</label>
            <input
              type="text"
              name="genreName"
              value={formData.genreName}
              onChange={handleChange}
              className="form-input"
              placeholder="Ví dụ: Pop, Rock, Jazz..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ảnh thể loại</label>
            <div className="image-upload-container">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                id="genre-image-upload"
              />
              {formData.imageUrl ? (
                <div className="image-preview-container">
                  <img src={formData.imageUrl} alt="Genre preview" className="image-preview" />
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
                <label htmlFor="genre-image-upload" className="image-upload-label">
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

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : genre ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenreModal;

