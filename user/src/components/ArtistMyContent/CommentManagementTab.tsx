import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Reply, Search, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { getMySongs, type MySong } from '../../services/artist-my-content.service';
import { getCommentsBySong, createComment, deleteCommentByArtist, type Comment } from '../../services/comment.service';
import { getCurrentUser } from '../../services/auth.service';

interface CommentManagementTabProps {}

const CommentManagementTab: React.FC<CommentManagementTabProps> = () => {
  const [songs, setSongs] = useState<MySong[]>([]);
  const [selectedSong, setSelectedSong] = useState<MySong | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'time' | 'likes'>('time');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSong) {
      loadComments(selectedSong.id);
    }
  }, [selectedSong, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (user.id) {
        setUserId(user.id);
      }
      const songsResponse = await getMySongs();
      setSongs(songsResponse.data || songsResponse);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    try {
      await deleteCommentByArtist(commentId);
      if (selectedSong) {
        loadComments(selectedSong.id);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể xóa bình luận. Vui lòng thử lại.');
    }
  };

  const handleReply = async (parentCommentId: number) => {
    if (!replyContent.trim() || !userId || !selectedSong) {
      alert('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      await createComment({
        userId,
        songId: selectedSong.id,
        content: replyContent.trim(),
        parentId: parentCommentId,
      });
      setReplyContent('');
      setReplyingTo(null);
      if (selectedSong) {
        loadComments(selectedSong.id);
      }
    } catch (error) {
      console.error('Error replying to comment:', error);
      alert('Không thể gửi phản hồi. Vui lòng thử lại.');
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
    return 'Người dùng';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare size={24} />
          Quản lý bình luận
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Danh sách bài hát */}
        <div className="bg-[#1E2542] rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Danh sách bài hát</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {songs.length === 0 ? (
              <p className="text-gray-400 text-sm">Chưa có bài hát nào</p>
            ) : (
              songs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => setSelectedSong(song)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedSong?.id === song.id
                      ? 'bg-[#3BC8E7] text-black'
                      : 'bg-[#151a30] text-white hover:bg-[#252B4D]'
                  }`}
                >
                  <div className="font-medium">{song.title}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {song.views || 0} lượt nghe
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Danh sách comments */}
        <div className="col-span-2 bg-[#1E2542] rounded-lg p-4">
          {!selectedSong ? (
            <div className="text-center text-gray-400 py-20">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>Chọn một bài hát để xem bình luận</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Bình luận: {selectedSong.title}
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'time' | 'likes')}
                    className="bg-[#151a30] text-white px-3 py-1 rounded-lg text-sm"
                  >
                    <option value="time">Sắp xếp theo thời gian</option>
                    <option value="likes">Sắp xếp theo lượt thích</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bình luận..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && selectedSong) {
                        loadComments(selectedSong.id);
                      }
                    }}
                    className="w-full bg-[#151a30] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3BC8E7]"
                  />
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center text-gray-400 py-10">Đang tải...</div>
                ) : getRootComments().length === 0 ? (
                  <div className="text-center text-gray-400 py-10">
                    <p>Chưa có bình luận nào cho bài hát này</p>
                  </div>
                ) : (
                  getRootComments().map((comment) => {
                    const replies = getReplies(comment.id);
                    const isExpanded = expandedComments.has(comment.id);
                    
                    return (
                      <div key={comment.id} className="bg-[#151a30] rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-[#3BC8E7] flex items-center justify-center text-white font-bold text-sm">
                                {getUserName(comment).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-white">{getUserName(comment)}</div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock size={12} />
                                  {formatDate(comment.createdAt)}
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-300 text-sm mb-3 ml-10">{comment.content}</p>
                            
                            {/* Replies */}
                            {replies.length > 0 && (
                              <div className="ml-10">
                                <button
                                  onClick={() => toggleCommentExpansion(comment.id)}
                                  className="flex items-center gap-1 text-[#3BC8E7] text-sm mb-2 hover:underline"
                                >
                                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  {replies.length} phản hồi
                                </button>
                                
                                {isExpanded && (
                                  <div className="space-y-3 mt-2 border-l-2 border-[#3BC8E7] pl-4">
                                    {replies.map((reply) => (
                                      <div key={reply.id} className="bg-[#0f1320] rounded p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="w-6 h-6 rounded-full bg-[#3BC8E7] flex items-center justify-center text-white font-bold text-xs">
                                            {getUserName(reply).charAt(0).toUpperCase()}
                                          </div>
                                          <div className="text-xs">
                                            <span className="font-semibold text-white">{getUserName(reply)}</span>
                                            <span className="text-gray-400 ml-2">{formatDate(reply.createdAt)}</span>
                                          </div>
                                        </div>
                                        <p className="text-gray-300 text-sm ml-8">{reply.content}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Reply form */}
                            {replyingTo === comment.id ? (
                              <div className="ml-10 mt-3">
                                <textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder="Viết phản hồi..."
                                  className="w-full bg-[#0f1320] text-white rounded px-3 py-2 resize-none text-sm mb-2"
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleReply(comment.id)}
                                    className="px-4 py-1 bg-[#3BC8E7] text-white rounded hover:bg-[#2CC8E5] transition text-sm"
                                  >
                                    Gửi
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyContent('');
                                    }}
                                    className="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-3 ml-10 mt-2">
                                <button
                                  onClick={() => setReplyingTo(comment.id)}
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#3BC8E7] transition"
                                >
                                  <Reply size={14} />
                                  Phản hồi
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition"
                                >
                                  <Trash2 size={14} />
                                  Xóa
                                </button>
                              </div>
                            )}
                          </div>
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
    </div>
  );
};

export default CommentManagementTab;

