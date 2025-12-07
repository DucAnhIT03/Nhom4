import { useState, useEffect } from 'react';
import { Search, Trash2, Lock, Unlock, UserCog } from 'lucide-react';
import { getUsers, deleteUser, toggleUserStatus } from '@/services/user.service';
import type { User } from '@/services/user.service';
import ConfirmModal from '../components/ConfirmModal';
import RoleModal from '../components/RoleModal';
import './UserManagementPage.css';

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'block' | 'unblock' | 'delete';
    user: User | null;
  }>({
    isOpen: false,
    type: 'block',
    user: null,
  });
  const [roleModal, setRoleModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({
    isOpen: false,
    user: null,
  });
  const limit = 10;

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers(currentPage, limit, searchTerm);
      setUsers(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset về trang đầu khi tìm kiếm
  };

  const handleDelete = (user: User) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      user,
    });
  };

  const handleBlock = (user: User) => {
    setConfirmModal({
      isOpen: true,
      type: 'block',
      user,
    });
  };

  const handleUnblock = (user: User) => {
    setConfirmModal({
      isOpen: true,
      type: 'unblock',
      user,
    });
  };

  const handleAssignRole = (user: User) => {
    setRoleModal({
      isOpen: true,
      user,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.user) return;

    try {
      if (confirmModal.type === 'delete') {
        await deleteUser(confirmModal.user.id);
      } else if (confirmModal.type === 'block') {
        await toggleUserStatus(confirmModal.user.id, 'BLOCKED');
      } else if (confirmModal.type === 'unblock') {
        await toggleUserStatus(confirmModal.user.id, 'ACTIVE');
      }
      setConfirmModal({ isOpen: false, type: 'block', user: null });
      loadUsers();
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Không thể thực hiện thao tác này');
    }
  };

  const getRoleDisplay = (user: User) => {
    if (user.roles && user.roles.length > 0) {
      return user.roles.map((r) => r.roleName.replace('ROLE_', '')).join(', ');
    }
    return user.role?.replace('ROLE_', '') || 'USER';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="user-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý người dùng</h1>
          <p className="page-subtitle">Quản lý tất cả người dùng trong hệ thống</p>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Loại tài khoản</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    {searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      {user.firstName} {user.lastName}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className="role-badge">{getRoleDisplay(user)}</span>
                    </td>
                    <td>
                      <span className={`status-badge status-${user.status?.toLowerCase()}`}>
                        {user.status === 'BLOCKED' ? 'BỊ KHÓA' : 
                         user.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : 
                         user.status === 'VERIFY' ? 'CHỜ XÁC THỰC' : 
                         user.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                        : '-'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-role"
                          onClick={() => handleAssignRole(user)}
                          title="Gán quyền"
                        >
                          <UserCog size={16} />
                        </button>
                        {user.status === 'BLOCKED' ? (
                          <button
                            className="btn-icon btn-unblock"
                            onClick={() => handleUnblock(user)}
                            title="Mở khóa"
                          >
                            <Unlock size={16} />
                          </button>
                        ) : (
                          <button
                            className="btn-icon btn-block"
                            onClick={() => handleBlock(user)}
                            title="Khóa tài khoản"
                          >
                            <Lock size={16} />
                          </button>
                        )}
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(user)}
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </button>
          <span className="pagination-info">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === 'delete'
            ? 'Xác nhận xóa người dùng'
            : confirmModal.type === 'block'
            ? 'Xác nhận khóa tài khoản'
            : 'Xác nhận mở khóa tài khoản'
        }
        message={
          confirmModal.type === 'delete'
            ? `Bạn có chắc chắn muốn xóa người dùng "${confirmModal.user?.firstName} ${confirmModal.user?.lastName}"? Hành động này không thể hoàn tác.`
            : confirmModal.type === 'block'
            ? `Bạn có chắc chắn muốn khóa tài khoản của "${confirmModal.user?.firstName} ${confirmModal.user?.lastName}"? Người dùng này sẽ không thể đăng nhập vào hệ thống.`
            : `Bạn có chắc chắn muốn mở khóa tài khoản của "${confirmModal.user?.firstName} ${confirmModal.user?.lastName}"?`
        }
        confirmText={
          confirmModal.type === 'delete'
            ? 'Xóa'
            : confirmModal.type === 'block'
            ? 'Khóa'
            : 'Mở khóa'
        }
        type={confirmModal.type === 'delete' ? 'danger' : 'warning'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal({ isOpen: false, type: 'block', user: null })}
      />

      <RoleModal
        user={roleModal.user}
        isOpen={roleModal.isOpen}
        onClose={() => setRoleModal({ isOpen: false, user: null })}
        onSuccess={() => {
          setRoleModal({ isOpen: false, user: null });
          loadUsers();
        }}
      />
    </div>
  );
};

export default UserManagementPage;

