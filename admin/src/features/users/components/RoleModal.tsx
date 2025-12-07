import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getAllRoles, updateUserRoles } from '@/services/user.service';
import type { User, Role } from '@/services/user.service';
import './RoleModal.css';

interface RoleModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RoleModal = ({ user, isOpen, onClose, onSuccess }: RoleModalProps) => {
  if (!isOpen) return null;
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRoles();
    if (user) {
      // Lấy roles hiện tại của user
      const currentRoles = user.roles?.map((r) => r.roleName) || [];
      setSelectedRoles(currentRoles);
    }
  }, [user]);

  const loadRoles = async () => {
    try {
      const roles = await getAllRoles();
      setAllRoles(roles);
    } catch (err) {
      console.error('Error loading roles:', err);
      setError('Không thể tải danh sách quyền');
    }
  };

  const handleRoleToggle = (roleName: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleName)) {
        return prev.filter((r) => r !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (selectedRoles.length === 0) {
      setError('Vui lòng chọn ít nhất một quyền');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await updateUserRoles(user.id, selectedRoles);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật quyền. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    return roleName.replace('ROLE_', '');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content role-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Gán quyền cho người dùng</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {user && (
          <div className="role-modal-user-info">
            <p>
              <strong>Người dùng:</strong> {user.firstName} {user.lastName}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Chọn quyền</label>
            <div className="roles-checkbox-group">
              {allRoles.map((role) => (
                <label key={role.id} className="role-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.roleName)}
                    onChange={() => handleRoleToggle(role.roleName)}
                    className="role-checkbox"
                  />
                  <span className="role-checkbox-text">{getRoleDisplayName(role.roleName)}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Cập nhật quyền'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleModal;

