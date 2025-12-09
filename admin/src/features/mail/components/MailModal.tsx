import { useState, useEffect } from 'react';
import { X, Send, Users, Mail, CheckSquare, Square } from 'lucide-react';
import type { User } from '@/services/user.service';
import './MailModal.css';

interface MailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (subject: string, body: string) => void;
  users: User[];
  selectedUsers: number[];
  onToggleUser: (userId: number) => void;
  onToggleSelectAll: () => void;
  sendToAll: boolean;
  onToggleSendToAll: (value: boolean) => void;
  loading: boolean;
  loadingUsers: boolean;
}

const MailModal = ({
  isOpen,
  onClose,
  onSend,
  users,
  selectedUsers,
  onToggleUser,
  onToggleSelectAll,
  sendToAll,
  onToggleSendToAll,
  loading,
  loadingUsers,
}: MailModalProps) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSubject('');
      setBody('');
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      alert('Vui lòng điền đầy đủ tiêu đề và nội dung email');
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      alert('Vui lòng chọn ít nhất một user hoặc chọn "Gửi cho tất cả user"');
      return;
    }

    onSend(subject, body);
  };

  return (
    <div className="mail-modal-overlay" onClick={onClose}>
      <div className="mail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mail-modal-header">
          <div className="header-title">
            <Mail size={24} />
            <h2>Gửi Email</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mail-modal-content">
          {/* Send To All Option */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={sendToAll}
                onChange={(e) => onToggleSendToAll(e.target.checked)}
              />
              <span>Gửi cho tất cả user trong hệ thống</span>
            </label>
          </div>

          {/* User Selection */}
          {!sendToAll && (
            <div className="form-group">
              <label>
                <Users size={20} />
                Chọn User ({selectedUsers.length} đã chọn)
              </label>
              <div className="user-selection-controls">
                <input
                  type="text"
                  placeholder="Tìm kiếm user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  className="btn-select-all"
                >
                  {selectedUsers.length === users.length ? (
                    <>
                      <CheckSquare size={16} />
                      Bỏ chọn tất cả
                    </>
                  ) : (
                    <>
                      <Square size={16} />
                      Chọn tất cả
                    </>
                  )}
                </button>
              </div>
              <div className="user-list">
                {loadingUsers ? (
                  <div className="loading">Đang tải danh sách user...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="empty">Không tìm thấy user nào</div>
                ) : (
                  filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className={`user-item ${
                        selectedUsers.includes(user.id) ? 'selected' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => onToggleUser(user.id)}
                      />
                      <div className="user-info">
                        <span className="user-name">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="form-group">
            <label>
              <Mail size={20} />
              Tiêu đề Email *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Nhập tiêu đề email..."
              required
              className="form-input"
            />
          </div>

          {/* Body */}
          <div className="form-group">
            <label>
              <Mail size={20} />
              Nội dung Email *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Nhập nội dung email..."
              required
              rows={10}
              className="form-textarea"
            />
          </div>

          {/* Actions */}
          <div className="mail-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                'Đang gửi...'
              ) : (
                <>
                  <Send size={20} />
                  Gửi Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MailModal;

