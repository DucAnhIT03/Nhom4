import { useState, useEffect } from 'react';
import { Search, Trash2, MessageSquare, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { deleteComment, getCommentsBySong } from '@/services/comment.service';
import { getSongs } from '@/services/song.service';
import type { Comment } from '@/services/comment.service';
import type { Song } from '@/services/song.service';
import ConfirmModal from '../../users/components/ConfirmModal';
import './CommentManagementPage.css';

const CommentManagementPage = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [songsLoading, setSongsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'likes'>('time');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    comment: Comment | null;
  }>({
    isOpen: false,
    comment: null,
  });
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadSongs();
  }, []);

  useEffect(() => {
    if (selectedSong) {
      loadComments(selectedSong.id);
    } else {
      setComments([]);
    }
  }, [selectedSong, sortBy]);

  const loadSongs = async () => {
    try {
      setSongsLoading(true);
      const songsData = await getSongs();
      setSongs(Array.isArray(songsData) ? songsData : []);
    } catch (error) {
      console.error('Error loading songs:', error);
      alert('Không thể tải danh sách bài hát');
    } finally {
      setSongsLoading(false);
    }
  };

  const loadComments = async (songId: number) => {
    try {
      setLoading(true);
      const response = await getCommentsBySong({ songId, page: 1, limit: 100 });
      let commentsData = response.data;

      // Sắp xếp
      if (sortBy === 'time') {
        commentsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      // Lọc theo search term
      if (searchTerm) {
        commentsData = commentsData.filter(c => 
          c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.user && `${c.user.firstName} ${c.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
      alert('Không thể tải bình luận. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = (comment: Comment) => {
    setConfirmModal({
      isOpen: true,
      comment,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.comment) return;

    try {
      await deleteComment(confirmModal.comment.id);
      setConfirmModal({ isOpen: false, comment: null });
      if (selectedSong) {
        loadComments(selectedSong.id);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Không thể xóa bình luận');
    }
  };

  const toggleCommentExpansion = (commentId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const getReplies = (commentId: number): Comment[] => {
    return comments.filter(c => c.parentId === commentId);
  };

  const getRootComments = (): Comment[] => {
    return comments.filter(c => !c.parentId);
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

  const getUserName = (comment: Comment) => {
    if (comment.user) {
      return `${comment.user.firstName} ${comment.user.lastName}`.trim() || comment.user.email;
    }
    return `User #${comment.userId}`;
  };

  return (
    <div className="comment-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <MessageSquare size={24} />
            Quản lý bình luận
          </h1>
          <p className="page-subtitle">Quản lý bình luận của nghệ sĩ và user theo bài hát</p>
        </div>
      </div>

      <div className="comment-layout">
        {/* Danh sách bài hát */}
        <div className="songs-sidebar">
          <h3 className="songs-sidebar-title">Danh sách bài hát</h3>
          <div className="songs-list">
            {songsLoading ? (
              <div className="loading">Đang tải...</div>
            ) : songs.length === 0 ? (
              <p className="empty-text">Chưa có bài hát nào</p>
            ) : (
              songs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => setSelectedSong(song)}
                  className={`song-item ${selectedSong?.id === song.id ? 'active' : ''}`}
                >
                  <div className="song-item-title">{song.title}</div>
                  <div className="song-item-meta">
                    {song.views || 0} lượt nghe
                    {song.artist && ` • ${song.artist.artistName}`}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Danh sách comments */}
        <div className="comments-section">
          {!selectedSong ? (
            <div className="empty-state-large">
              <MessageSquare size={48} className="empty-icon" />
              <p>Chọn một bài hát để xem bình luận</p>
            </div>
          ) : (
            <>
              <div className="comments-header">
                <h3 className="comments-title">
                  Bình luận: {selectedSong.title}
                </h3>
                <div className="comments-controls">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'time' | 'likes')}
                    className="sort-select"
                  >
                    <option value="time">Sắp xếp theo thời gian</option>
                    <option value="likes">Sắp xếp theo lượt thích</option>
                  </select>
                </div>
              </div>

              <div className="search-container">
                <div className="search-box">
                  <Search className="search-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bình luận..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="comments-list">
                {loading ? (
                  <div className="loading">Đang tải...</div>
                ) : getRootComments().length === 0 ? (
                  <div className="empty-state">
                    <MessageSquare size={48} className="empty-icon" />
                    <p>Chưa có bình luận nào cho bài hát này</p>
                  </div>
                ) : (
                  getRootComments().map((comment) => {
                    const replies = getReplies(comment.id);
                    const isExpanded = expandedComments.has(comment.id);
                    
                    return (
                      <div key={comment.id} className="comment-card">
                        <div className="comment-header-info">
                          <div className="comment-user">
                            <div className="user-avatar-circle">
                              {comment.user?.profileImage ? (
                                <img
                                  src={comment.user.profileImage}
                                  alt={getUserName(comment)}
                                  className="user-avatar-img"
                                />
                              ) : (
                                <span>{getUserName(comment).charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="user-details">
                              <div className="user-name">{getUserName(comment)}</div>
                              <div className="comment-date-info">
                                <Clock size={12} />
                                <span>{formatDate(comment.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="comment-content-text">{comment.content}</div>
                        
                        {/* Replies */}
                        {replies.length > 0 && (
                          <div className="replies-section">
                            <button
                              onClick={() => toggleCommentExpansion(comment.id)}
                              className="replies-toggle"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              {replies.length} phản hồi
                            </button>
                            
                            {isExpanded && (
                              <div className="replies-list">
                                {replies.map((reply) => (
                                  <div key={reply.id} className="reply-card">
                                    <div className="reply-header">
                                      <div className="user-avatar-circle small">
                                        {reply.user?.profileImage ? (
                                          <img
                                            src={reply.user.profileImage}
                                            alt={getUserName(reply)}
                                            className="user-avatar-img"
                                          />
                                        ) : (
                                          <span>{getUserName(reply).charAt(0).toUpperCase()}</span>
                                        )}
                                      </div>
                                      <div className="reply-user-info">
                                        <span className="reply-user-name">{getUserName(reply)}</span>
                                        <span className="reply-date">{formatDate(reply.createdAt)}</span>
                                      </div>
                                    </div>
                                    <div className="reply-content">{reply.content}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="comment-actions">
                          <button
                            onClick={() => handleDelete(comment)}
                            className="action-btn delete-btn"
                            title="Xóa bình luận"
                          >
                            <Trash2 size={16} />
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Xác nhận xóa bình luận"
        message={`Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, comment: null })}
      />
    </div>
  );
};

export default CommentManagementPage;
