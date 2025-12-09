import { useState } from 'react';
import { Mail, Send, Users, UserCheck } from 'lucide-react';
import { sendBulkMail } from '@/services/mail.service';
import { getUsers, type User } from '@/services/user.service';
import MailModal from '../components/MailModal';
import './MailManagementPage.css';

const MailManagementPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [sendToAll, setSendToAll] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await getUsers(1, 1000); // Lấy tối đa 1000 user
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenModal = async () => {
    if (!sendToAll) {
      await loadUsers();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUsers([]);
    setSendToAll(false);
  };

  const handleSendMail = async (subject: string, body: string) => {
    setLoading(true);
    try {
      const data = {
        subject,
        body,
        ...(sendToAll
          ? { sendToAll: 'true' }
          : selectedUsers.length > 0
          ? { userIds: selectedUsers }
          : {}),
      };

      const result = await sendBulkMail(data);
      alert(
        `Đã gửi email thành công!\nTổng số email: ${result.totalEmails || 1}\nJob IDs: ${result.jobIds?.join(', ') || result.jobId}`
      );
      handleCloseModal();
    } catch (error: any) {
      console.error('Error sending mail:', error);
      alert(`Lỗi khi gửi email: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  return (
    <div className="mail-management-page">
      <div className="page-header">
        <div className="header-content">
          <Mail className="header-icon" />
          <div>
            <h1>Quản lý Gửi Mail</h1>
            <p>Gửi email cho user hoặc tất cả user trong hệ thống</p>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={handleOpenModal}
          disabled={loading}
        >
          <Send size={20} />
          Gửi Mail
        </button>
      </div>

      <div className="mail-stats">
        <div className="stat-card">
          <Users className="stat-icon" />
          <div>
            <h3>Tổng số User</h3>
            <p>{users.length || '...'}</p>
          </div>
        </div>
        <div className="stat-card">
          <UserCheck className="stat-icon" />
          <div>
            <h3>Đã chọn</h3>
            <p>
              {sendToAll
                ? 'Tất cả user'
                : `${selectedUsers.length} user`}
            </p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <MailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSend={handleSendMail}
          users={users}
          selectedUsers={selectedUsers}
          onToggleUser={toggleUserSelection}
          onToggleSelectAll={toggleSelectAll}
          sendToAll={sendToAll}
          onToggleSendToAll={(value) => {
            setSendToAll(value);
            if (value) {
              setSelectedUsers([]);
            }
          }}
          loading={loading}
          loadingUsers={loadingUsers}
        />
      )}
    </div>
  );
};

export default MailManagementPage;

