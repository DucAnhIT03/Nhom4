import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createUser, updateUser } from '@/services/user.service';
import type { User, CreateUserDto, UpdateUserDto } from '@/services/user.service';
import './UserModal.css';

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UserModal = ({ user, onClose, onSuccess }: UserModalProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    status: 'ACTIVE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
        status: user.status || 'ACTIVE',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (user) {
        // Update user
        const updateData: UpdateUserDto = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          status: formData.status,
        };
        await updateUser(user.id, updateData);
      } else {
        // Create user
        if (!formData.password) {
          setError('Vui lòng nhập mật khẩu');
          setLoading(false);
          return;
        }
        const createData: CreateUserDto = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        };
        await createUser(createData);
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
            {user ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Họ</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tên</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {!user && (
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required={!user}
                minLength={6}
              />
            </div>
          )}

          {user && (
            <div className="form-group">
              <label className="form-label">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input"
              >
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Không hoạt động</option>
                <option value="VERIFY">Chờ xác thực</option>
                <option value="BLOCKED">Bị chặn</option>
              </select>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : user ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;

