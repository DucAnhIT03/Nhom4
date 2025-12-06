import { useState, useEffect } from 'react';
import { Search, Trash2, Edit, Plus } from 'lucide-react';
import { getArtists, deleteArtist } from '@/services/artist.service';
import type { Artist } from '@/services/artist.service';
import ConfirmModal from '../components/ConfirmModal';
import ArtistModal from '../components/ArtistModal';
import './ArtistManagementPage.css';

const ArtistManagementPage = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    artist: Artist | null;
  }>({
    isOpen: false,
    artist: null,
  });
  const [artistModal, setArtistModal] = useState<{
    isOpen: boolean;
    artist: Artist | null;
  }>({
    isOpen: false,
    artist: null,
  });
  const limit = 10;

  useEffect(() => {
    loadArtists();
  }, [currentPage, searchTerm]);

  const loadArtists = async () => {
    setLoading(true);
    try {
      const response = await getArtists(currentPage, limit, searchTerm);
      setArtists(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset về trang đầu khi tìm kiếm
  };

  const handleDelete = (artist: Artist) => {
    setConfirmModal({
      isOpen: true,
      artist,
    });
  };

  const handleEdit = (artist: Artist) => {
    setArtistModal({
      isOpen: true,
      artist,
    });
  };

  const handleAdd = () => {
    setArtistModal({
      isOpen: true,
      artist: null,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.artist) return;

    try {
      await deleteArtist(confirmModal.artist.id);
      setConfirmModal({ isOpen: false, artist: null });
      loadArtists();
    } catch (error) {
      console.error('Error deleting artist:', error);
      alert('Không thể xóa nghệ sĩ này');
    }
  };

  const handleModalSuccess = () => {
    setArtistModal({ isOpen: false, artist: null });
    loadArtists();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="artist-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý nghệ sĩ</h1>
          <p className="page-subtitle">Quản lý tất cả nghệ sĩ trong hệ thống</p>
        </div>
        <button className="btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Thêm nghệ sĩ
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên nghệ sĩ..."
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
          <table className="artists-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên nghệ sĩ</th>
                <th>Quốc tịch</th>
                <th>Tuổi</th>
                <th>Tiểu sử</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {artists.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    {searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                artists.map((artist) => (
                  <tr key={artist.id}>
                    <td>{artist.id}</td>
                    <td>
                      <div className="artist-name-cell">
                        {artist.avatar && (
                          <img
                            src={artist.avatar}
                            alt={artist.artistName}
                            className="artist-avatar-small"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span>{artist.artistName}</span>
                      </div>
                    </td>
                    <td>
                      {artist.nationality ? (
                        <span>{artist.nationality}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {artist.age ? (
                        <span>{artist.age}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="bio-cell">
                        {artist.bio ? (
                          <span title={artist.bio}>
                            {artist.bio.length > 50
                              ? `${artist.bio.substring(0, 50)}...`
                              : artist.bio}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {artist.createdAt
                        ? new Date(artist.createdAt).toLocaleDateString('vi-VN')
                        : '-'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(artist)}
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(artist)}
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
        title="Xác nhận xóa nghệ sĩ"
        message={`Bạn có chắc chắn muốn xóa nghệ sĩ "${confirmModal.artist?.artistName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, artist: null })}
      />

      {artistModal.isOpen && (
        <ArtistModal
          artist={artistModal.artist}
          onClose={() => setArtistModal({ isOpen: false, artist: null })}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default ArtistManagementPage;

