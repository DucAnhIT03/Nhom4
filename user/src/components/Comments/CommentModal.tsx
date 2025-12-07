import { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaPaperPlane, FaTrash, FaEdit } from 'react-icons/fa';
import { getCommentsBySong, createComment, deleteComment, updateComment, type Comment } from '../../services/comment.service';
import { getCurrentUser } from '../../services/auth.service';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: number;
  songTitle: string;
}

const CommentModal = ({ isOpen, onClose, songId, songTitle }: CommentModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (isOpen && songId) {
      loadComments();
      loadUserId();
    }
  }, [isOpen, songId, page]);

  const loadUserId = async () => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    } else {
      try {
        const user = await getCurrentUser();
        if (user.id) {
          setUserId(user.id);
          localStorage.setItem('userId', user.id.toString());
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await getCommentsBySong({ songId, page, limit });
      setComments(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userId) {
      alert('Vui lòng đăng nhập và nhập nội dung bình luận');
      return;
    }

    try {
      const comment = await createComment({
        userId,
        songId,
        content: newComment.trim(),
      });
      setComments([comment, ...comments]);
      setNewComment('');
      setTotal(total + 1);
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Không thể thêm bình luận. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    try {
      await deleteComment(id);
      setComments(comments.filter(c => c.id !== id));
      setTotal(total - 1);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Không thể xóa bình luận. Vui lòng thử lại.');
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editContent.trim()) {
      alert('Nội dung bình luận không được để trống');
      return;
    }

    try {
      const updated = await updateComment(id, editContent.trim());
      setComments(comments.map(c => c.id === id ? updated : c));
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Không thể cập nhật bình luận. Vui lòng thử lại.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('vi-VN');
    } else if (days > 0) {
      return `${days} ngày trước`;
    } else if (hours > 0) {
      return `${hours} giờ trước`;
    } else if (minutes > 0) {
      return `${minutes} phút trước`;
    } else {
      return 'Vừa xong';
    }
  };

  const getUserName = (comment: Comment) => {
    if (comment.user) {
      return `${comment.user.firstName} ${comment.user.lastName}`.trim() || comment.user.email;
    }
    return 'Người dùng';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1B2039] rounded-lg w-[90%] max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#252B4D]">
          <div>
            <h2 className="text-xl font-bold text-white">Bình luận</h2>
            <p className="text-sm text-gray-400 mt-1">{songTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Đang tải...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-[#252B4D] pb-4 last:border-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#3BC8E7] flex items-center justify-center text-white font-bold">
                    {getUserName(comment).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{getUserName(comment)}</span>
                      <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                    </div>
                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-[#14182A] text-white rounded px-3 py-2 resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="px-4 py-1 bg-[#3BC8E7] text-white rounded hover:bg-[#2CC8E5] transition"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-300 text-sm mb-2">{comment.content}</p>
                        {userId === comment.userId && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleStartEdit(comment)}
                              className="text-xs text-gray-400 hover:text-[#3BC8E7] transition flex items-center gap-1"
                            >
                              <FaEdit size={10} />
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="text-xs text-gray-400 hover:text-red-400 transition flex items-center gap-1"
                            >
                              <FaTrash size={10} />
                              Xóa
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-[#252B4D]">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-[#252B4D] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2E3358] transition"
            >
              Trước
            </button>
            <span className="text-sm text-gray-400">
              Trang {page} / {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="px-4 py-2 bg-[#252B4D] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2E3358] transition"
            >
              Sau
            </button>
          </div>
        )}

        {/* Add Comment Form */}
        {userId && (
          <form onSubmit={handleSubmit} className="p-6 border-t border-[#252B4D]">
            <div className="flex gap-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                className="flex-1 bg-[#14182A] text-white rounded px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#3BC8E7]"
                rows={3}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-6 py-2 bg-[#3BC8E7] text-white rounded hover:bg-[#2CC8E5] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaPaperPlane />
                Gửi
              </button>
            </div>
          </form>
        )}
        {!userId && (
          <div className="p-6 border-t border-[#252B4D] text-center text-gray-400 text-sm">
            Vui lòng đăng nhập để bình luận
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentModal;

