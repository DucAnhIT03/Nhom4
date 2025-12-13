import { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaPaperPlane, FaTrash, FaEdit } from 'react-icons/fa';
import { getCommentsBySong, createComment, deleteComment, updateComment, type Comment } from '../../services/comment.service';
import { getCurrentUser } from '../../services/auth.service';
import { useLanguage } from '../../contexts/LanguageContext';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: number;
  songTitle: string;
}

const CommentModal = ({ isOpen, onClose, songId, songTitle }: CommentModalProps) => {
  const { t } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
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
      // Đảm bảo chỉ lấy comments gốc (không phải reply) để tránh duplicate
      const rootComments = response.data.filter(comment => !comment.parentId);
      setComments(rootComments);
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
      alert(t('comments.pleaseLoginAndEnter'));
      return;
    }

    try {
      const comment = await createComment({
        userId,
        songId,
        content: newComment.trim(),
      });
      setComments([{ ...comment, replies: [] }, ...comments]);
      setNewComment('');
      setTotal(total + 1);
    } catch (error) {
      console.error('Error creating comment:', error);
      alert(t('comments.cannotAdd'));
    }
  };

  const handleReply = async (parentId: number) => {
    if (!replyContent.trim() || !userId) {
      alert(t('comments.pleaseLoginAndEnter'));
      return;
    }

    try {
      const reply = await createComment({
        userId,
        songId,
        content: replyContent.trim(),
        parentId,
      });
      
      // Cập nhật comment gốc để thêm reply vào (không reload để tránh flicker)
      setComments(comments.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...(comment.replies || []), reply] }
          : comment
      ));
      
      setReplyContent('');
      setReplyingId(null);
    } catch (error) {
      console.error('Error creating reply:', error);
      alert(t('comments.cannotAdd'));
    }
  };

  const handleDelete = async (id: number, isReply: boolean = false, parentId?: number) => {
    if (!confirm(t('comments.confirmDelete'))) {
      return;
    }

    try {
      await deleteComment(id);
      
      if (isReply && parentId) {
        // Xóa reply khỏi comment gốc
        setComments(comments.map(comment => 
          comment.id === parentId 
            ? { ...comment, replies: (comment.replies || []).filter(r => r.id !== id) }
            : comment
        ));
      } else {
        // Xóa comment gốc
        setComments(comments.filter(c => c.id !== id));
        setTotal(total - 1);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(t('comments.cannotDelete'));
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editContent.trim()) {
      alert(t('comments.contentNotEmpty'));
      return;
    }

    try {
      const updated = await updateComment(id, editContent.trim());
      setComments(comments.map(c => c.id === id ? updated : c));
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert(t('comments.cannotUpdate'));
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
      return `${days} ${t('comments.daysAgo')}`;
    } else if (hours > 0) {
      return `${hours} ${t('comments.hoursAgo')}`;
    } else if (minutes > 0) {
      return `${minutes} ${t('comments.minutesAgo')}`;
    } else {
      return t('comments.justNow');
    }
  };

  const getUserName = (comment: Comment) => {
    if (comment.user) {
      return `${comment.user.firstName} ${comment.user.lastName}`.trim() || comment.user.email;
    }
    return t('comments.user');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1B2039] rounded-lg w-[90%] max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#252B4D]">
          <div>
            <h2 className="text-xl font-bold text-white">{t('comments.title')}</h2>
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
            <div className="text-center text-gray-400 py-8">{t('common.loading')}</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {t('comments.noComments')}
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-[#252B4D] pb-4 last:border-0">
                <div className="flex items-start gap-3">
                  {comment.user?.profileImage ? (
                    <img
                      src={comment.user.profileImage}
                      alt={getUserName(comment)}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#3BC8E7]"
                      onError={(e) => {
                        // Ẩn ảnh và hiển thị avatar với chữ cái đầu
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-10 h-10 rounded-full bg-[#3BC8E7] flex items-center justify-center text-white font-bold ${comment.user?.profileImage ? 'hidden' : ''}`}
                  >
                    {getUserName(comment).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{getUserName(comment)}</span>
                      {comment.user?.isArtist && (
                        <span className="text-xs text-[#3BC8E7] font-medium">• Nghệ sĩ</span>
                      )}
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
                            {t('comments.save')}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                          >
                            {t('comments.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-300 text-sm mb-2">{comment.content}</p>
                        <div className="flex gap-3 items-center">
                          {userId && (
                            <button
                              onClick={() => setReplyingId(replyingId === comment.id ? null : comment.id)}
                              className="text-xs text-gray-400 hover:text-[#3BC8E7] transition flex items-center gap-1"
                            >
                              <FaPaperPlane size={10} />
                              {t('comments.reply')}
                            </button>
                          )}
                          {userId === comment.userId && (
                            <>
                              <button
                                onClick={() => handleStartEdit(comment)}
                                className="text-xs text-gray-400 hover:text-[#3BC8E7] transition flex items-center gap-1"
                              >
                                <FaEdit size={10} />
                                {t('comments.edit')}
                              </button>
                              <button
                                onClick={() => handleDelete(comment.id)}
                                className="text-xs text-gray-400 hover:text-red-400 transition flex items-center gap-1"
                              >
                                <FaTrash size={10} />
                                {t('comments.delete')}
                              </button>
                            </>
                          )}
                        </div>
                        
                        {/* Reply form */}
                        {replyingId === comment.id && (
                          <div className="mt-3 space-y-2">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder={t('comments.enterReply')}
                              className="w-full bg-[#14182A] text-white rounded px-3 py-2 resize-none text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReply(comment.id)}
                                disabled={!replyContent.trim()}
                                className="px-3 py-1 bg-[#3BC8E7] text-white rounded hover:bg-[#2CC8E5] transition disabled:opacity-50 text-sm"
                              >
                                {t('comments.send')}
                              </button>
                              <button
                                onClick={() => {
                                  setReplyingId(null);
                                  setReplyContent('');
                                }}
                                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm"
                              >
                                {t('comments.cancel')}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-4 ml-4 pl-4 border-l-2 border-[#3BC8E7] space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-3">
                                {reply.user?.profileImage ? (
                                  <img
                                    src={reply.user.profileImage}
                                    alt={getUserName(reply)}
                                    className="w-8 h-8 rounded-full object-cover border-2 border-[#3BC8E7]"
                                    onError={(e) => {
                                      // Ẩn ảnh và hiển thị avatar với chữ cái đầu
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) {
                                        fallback.style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`w-8 h-8 rounded-full bg-[#3BC8E7] flex items-center justify-center text-white font-bold text-xs ${reply.user?.profileImage ? 'hidden' : ''}`}
                                >
                                  {getUserName(reply).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-white text-sm">{getUserName(reply)}</span>
                                    {reply.user?.isArtist && (
                                      <span className="text-xs text-[#3BC8E7] font-medium">• Nghệ sĩ</span>
                                    )}
                                    <span className="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-gray-300 text-sm mb-2">{reply.content}</p>
                                  {userId === reply.userId && (
                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => handleDelete(reply.id, true, comment.id)}
                                        className="text-xs text-gray-400 hover:text-red-400 transition flex items-center gap-1"
                                      >
                                        <FaTrash size={10} />
                                        {t('comments.delete')}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
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
              {t('common.previous')}
            </button>
            <span className="text-sm text-gray-400">
              {t('common.page')} {page} / {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="px-4 py-2 bg-[#252B4D] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2E3358] transition"
            >
              {t('common.next')}
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
                placeholder={t('comments.enterComment')}
                className="flex-1 bg-[#14182A] text-white rounded px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#3BC8E7]"
                rows={3}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-6 py-2 bg-[#3BC8E7] text-white rounded hover:bg-[#2CC8E5] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaPaperPlane />
                {t('comments.send')}
              </button>
            </div>
          </form>
        )}
        {!userId && (
          <div className="p-6 border-t border-[#252B4D] text-center text-gray-400 text-sm">
            {t('alerts.pleaseLogin')}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentModal;

