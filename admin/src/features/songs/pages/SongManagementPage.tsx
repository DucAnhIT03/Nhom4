import { useState, useEffect } from 'react';
import { Search, Trash2, Edit, Plus } from 'lucide-react';
import { getSongs, deleteSong } from '@/services/song.service';
import type { Song } from '@/services/song.service';
import { getGenresOfSong } from '@/services/genre.service';
import type { Genre } from '@/services/genre.service';
import ConfirmModal from '../../artists/components/ConfirmModal';
import SongModal from '../components/SongModal';
import './SongManagementPage.css';

interface SongWithGenres extends Song {
  genres?: Genre[];
}

const SongManagementPage = () => {
  const [songs, setSongs] = useState<SongWithGenres[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    song: Song | null;
  }>({
    isOpen: false,
    song: null,
  });
  const [songModal, setSongModal] = useState<{
    isOpen: boolean;
    song: Song | null;
  }>({
    isOpen: false,
    song: null,
  });

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    setLoading(true);
    try {
      const data = await getSongs();
      // Load genres cho mỗi bài hát
      const songsWithGenres = await Promise.all(
        (data || []).map(async (song) => {
          try {
            const genres = await getGenresOfSong(song.id);
            return { ...song, genres };
          } catch (error) {
            console.error(`Error loading genres for song ${song.id}:`, error);
            return { ...song, genres: [] };
          }
        })
      );
      setSongs(songsWithGenres);
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = (song: Song) => {
    setConfirmModal({
      isOpen: true,
      song,
    });
  };

  const handleEdit = (song: Song) => {
    setSongModal({
      isOpen: true,
      song,
    });
  };

  const handleAdd = () => {
    setSongModal({
      isOpen: true,
      song: null,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.song) return;

    try {
      const songId = confirmModal.song.id;
      await deleteSong(songId);
      setConfirmModal({ isOpen: false, song: null });
      loadSongs();
      
      // Phát sự kiện để các component khác biết bài hát đã bị xóa
      const event = new CustomEvent('songDeleted', {
        detail: { songId }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Không thể xóa bài hát này');
    }
  };

  const handleModalSuccess = () => {
    setSongModal({ isOpen: false, song: null });
    loadSongs();
  };

  return (
    <div className="song-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý bài hát</h1>
          <p className="page-subtitle">Quản lý tất cả bài hát trong hệ thống</p>
        </div>
        <button className="btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Thêm bài hát
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bài hát..."
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
          <table className="songs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên bài hát</th>
                <th>Nghệ sĩ</th>
                <th>Thể loại</th>
                <th>Lượt nghe</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSongs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    {searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                filteredSongs.map((song) => (
                  <tr key={song.id}>
                    <td>{song.id}</td>
                    <td>
                      <div className="song-title-cell">
                        <span>{song.title}</span>
                      </div>
                    </td>
                    <td>
                      {song.artist ? (
                        <span>{song.artist.artistName}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {song.genres && song.genres.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {song.genres.map((genre) => (
                            <span
                              key={genre.id}
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(59, 200, 231, 0.2)',
                                color: '#3BC8E7',
                                fontSize: '12px',
                              }}
                            >
                              {genre.genreName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span>{song.views || 0}</span>
                    </td>
                    <td>
                      {song.createdAt
                        ? (() => {
                            try {
                              const date = new Date(song.createdAt);
                              if (isNaN(date.getTime())) return '-';
                              return date.toLocaleDateString('vi-VN');
                            } catch {
                              return '-';
                            }
                          })()
                        : '-'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(song)}
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(song)}
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
        title="Xác nhận xóa bài hát"
        message={`Bạn có chắc chắn muốn xóa bài hát "${confirmModal.song?.title}"? Hành động này không thể hoàn tác. Bài hát sẽ bị xóa khỏi tất cả album, playlist, yêu thích và các nơi liên quan.`}
        confirmText="Xóa"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, song: null })}
      />

      {songModal.isOpen && (
        <SongModal
          song={songModal.song}
          onClose={() => setSongModal({ isOpen: false, song: null })}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default SongManagementPage;

