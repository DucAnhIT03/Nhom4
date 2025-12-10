import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Search, Clock, Music } from 'lucide-react';
import { getCommentsByUser, deleteCommentByUser, type Comment } from '../../services/comment.service';
import { getCurrentUser } from '../../services/auth.service';
import './UserCommentManagement.css';

interface UserCommentManagementProps {
  userId?: number;
}

const UserCommentManagement: React.FC<UserCommentManagementProps> = ({ userId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadComments();
    }
  }, [currentUserId, currentPage, searchTerm]);

  const loadUserData = async () => {
    try {
      const user = await getCurrentUser();
      const id = userId || user.id;
      setCurrentUserId(id);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadComments = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const response = await getCommentsByUser(
        currentUserId,
        currentPage,
        limit,
        searchTerm || undefined
      );
      setComments(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading comments:', error);
      alert('Không thể tải danh sách bình luận');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    try {
      await deleteCommentByUser(commentId);
      loadComments();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể xóa bình luận. Vui lòng thử lại.');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSongTitle = (comment: Comment) => {
    if (comment.song) {
      return comment.song.title;
    }
    return `Bài hát #${comment.songId}`;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="user-comment-management">
      <div className="comment-header">
        <h2 className="comment-title">
          <MessageSquare size={24} />
          Quản lý bình luận của tôi
        </h2>
        <p className="comment-subtitle">Xem và quản lý tất cả bình luận bạn đã đăng</p>
      </div>

      <div className="comment-search-box">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="Tìm kiếm bình luận..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="comment-stats">
        <div className="stat-item">
          <span className="stat-label">Tổng số bình luận:</span>
          <span className="stat-value">{total}</span>
        </div>
      </div>

      <div className="comments-list">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : comments.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={48} className="empty-icon" />
            <p>{searchTerm ? 'Không tìm thấy bình luận nào' : 'Bạn chưa có bình luận nào'}</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-content-wrapper">
                <div className="comment-header-info">
                  <div className="comment-song-info">
                    <Music size={16} className="song-icon" />
                    <span className="song-title">{getSongTitle(comment)}</span>
                  </div>
                  <div className="comment-date">
                    <Clock size={14} />
                    <span>{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
                
                <div className="comment-content">
                  {comment.content}
                </div>

                {comment.parentId && (
                  <div className="comment-type-badge">
                    <span>Trả lời</span>
                  </div>
                )}

                <div className="comment-actions">
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="delete-btn"
                    title="Xóa bình luận"
                  >
                    <Trash2 size={16} />
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))
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
    </div>
  );
};

export default UserCommentManagement;

