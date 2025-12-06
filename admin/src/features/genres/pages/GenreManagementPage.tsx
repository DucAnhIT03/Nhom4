import { useState, useEffect } from 'react';
import { Search, Trash2, Edit, Plus } from 'lucide-react';
import { getGenres, deleteGenre } from '@/services/genre.service';
import type { Genre } from '@/services/genre.service';
import ConfirmModal from '../../artists/components/ConfirmModal';
import GenreModal from '../components/GenreModal';
import './GenreManagementPage.css';

const GenreManagementPage = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    genre: Genre | null;
  }>({
    isOpen: false,
    genre: null,
  });
  const [genreModal, setGenreModal] = useState<{
    isOpen: boolean;
    genre: Genre | null;
  }>({
    isOpen: false,
    genre: null,
  });

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    setLoading(true);
    try {
      const data = await getGenres();
      setGenres(data || []);
    } catch (error) {
      console.error('Error loading genres:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGenres = genres.filter((genre) =>
    genre.genreName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = (genre: Genre) => {
    setConfirmModal({
      isOpen: true,
      genre,
    });
  };

  const handleEdit = (genre: Genre) => {
    setGenreModal({
      isOpen: true,
      genre,
    });
  };

  const handleAdd = () => {
    setGenreModal({
      isOpen: true,
      genre: null,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.genre) return;

    try {
      await deleteGenre(confirmModal.genre.id);
      setConfirmModal({ isOpen: false, genre: null });
      loadGenres();
    } catch (error) {
      console.error('Error deleting genre:', error);
      alert('Không thể xóa thể loại này');
    }
  };

  const handleModalSuccess = () => {
    setGenreModal({ isOpen: false, genre: null });
    loadGenres();
  };

  return (
    <div className="genre-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý thể loại</h1>
          <p className="page-subtitle">Quản lý tất cả thể loại nhạc trong hệ thống</p>
        </div>
        <button className="btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Thêm thể loại
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên thể loại..."
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
          <table className="genres-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên thể loại</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredGenres.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-state">
                    {searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                filteredGenres.map((genre) => (
                  <tr key={genre.id}>
                    <td>{genre.id}</td>
                    <td>
                      <div className="genre-name-cell">
                        {genre.imageUrl && (
                          <img
                            src={genre.imageUrl}
                            alt={genre.genreName}
                            className="genre-image-small"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span className="genre-name">{genre.genreName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(genre)}
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(genre)}
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Xác nhận xóa thể loại"
        message={`Bạn có chắc chắn muốn xóa thể loại "${confirmModal.genre?.genreName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, genre: null })}
      />

      {genreModal.isOpen && (
        <GenreModal
          genre={genreModal.genre}
          onClose={() => setGenreModal({ isOpen: false, genre: null })}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default GenreManagementPage;

