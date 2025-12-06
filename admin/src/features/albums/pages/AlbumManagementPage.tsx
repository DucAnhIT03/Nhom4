import { useState, useEffect } from 'react';
import { Search, Trash2, Edit, Plus, Music, X } from 'lucide-react';
import { getAlbums, deleteAlbum, getSongsByAlbumId } from '@/services/album.service';
import type { Album } from '@/services/album.service';
import type { Song } from '@/services/song.service';
import { deleteSong } from '@/services/song.service';
import ConfirmModal from '../../artists/components/ConfirmModal';
import AlbumModal from '../components/AlbumModal';
import './AlbumManagementPage.css';

const AlbumManagementPage = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    album: Album | null;
  }>({
    isOpen: false,
    album: null,
  });
  const [albumModal, setAlbumModal] = useState<{
    isOpen: boolean;
    album: Album | null;
  }>({
    isOpen: false,
    album: null,
  });
  const [songsModal, setSongsModal] = useState<{
    isOpen: boolean;
    album: Album | null;
    songs: Song[];
    loading: boolean;
  }>({
    isOpen: false,
    album: null,
    songs: [],
    loading: false,
  });

  useEffect(() => {
    loadAlbums();
  }, []);

  // Lắng nghe sự kiện khi bài hát bị xóa từ trang quản lý bài hát
  useEffect(() => {
    const handleSongDeleted = async () => {
      // Nếu modal đang mở, reload danh sách bài hát
      if (songsModal.isOpen && songsModal.album) {
        try {
          const songs = await getSongsByAlbumId(songsModal.album.id);
          setSongsModal((prev) => ({
            ...prev,
            songs,
            loading: false,
          }));
        } catch (error) {
          console.error('Error reloading songs:', error);
        }
      }
    };

    window.addEventListener('songDeleted', handleSongDeleted);
    return () => {
      window.removeEventListener('songDeleted', handleSongDeleted);
    };
  }, [songsModal.isOpen, songsModal.album]);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const data = await getAlbums();
      setAlbums(data || []);
    } catch (error) {
      console.error('Error loading albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlbums = albums.filter((album) =>
    album.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = (album: Album) => {
    setConfirmModal({
      isOpen: true,
      album,
    });
  };

  const handleEdit = (album: Album) => {
    setAlbumModal({
      isOpen: true,
      album,
    });
  };

  const handleAdd = () => {
    setAlbumModal({
      isOpen: true,
      album: null,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.album) return;

    try {
      await deleteAlbum(confirmModal.album.id);
      setConfirmModal({ isOpen: false, album: null });
      loadAlbums();
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Không thể xóa album này');
    }
  };

  const handleModalSuccess = () => {
    setAlbumModal({ isOpen: false, album: null });
    loadAlbums();
  };

  const handleViewSongs = async (album: Album) => {
    setSongsModal({
      isOpen: true,
      album,
      songs: [],
      loading: true,
    });

    try {
      const songs = await getSongsByAlbumId(album.id);
      setSongsModal((prev) => ({
        ...prev,
        songs,
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading songs:', error);
      setSongsModal((prev) => ({
        ...prev,
        songs: [],
        loading: false,
      }));
    }
  };

  const handleDeleteSong = async (song: Song) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài hát "${song.title}"?`)) {
      return;
    }

    try {
      await deleteSong(song.id);
      // Reload danh sách bài hát
      if (songsModal.album) {
        const songs = await getSongsByAlbumId(songsModal.album.id);
        setSongsModal((prev) => ({
          ...prev,
          songs,
        }));
      }
    } catch (error) {
      console.error('Error deleting song:', error);
      alert('Không thể xóa bài hát này');
    }
  };

  return (
    <div className="album-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý album</h1>
          <p className="page-subtitle">Quản lý tất cả album trong hệ thống</p>
        </div>
        <button className="btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Thêm album
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên album..."
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
          <table className="albums-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên album</th>
                <th>Nghệ sĩ</th>
                <th>Loại</th>
                <th>Ngày phát hành</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlbums.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    {searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                filteredAlbums.map((album) => (
                  <tr key={album.id}>
                    <td>{album.id}</td>
                    <td>
                      <div className="album-title-cell">
                        {album.coverImage && (
                          <img
                            src={album.coverImage}
                            alt={album.title}
                            className="album-cover-small"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span
                          className="album-title-clickable"
                          onClick={() => handleViewSongs(album)}
                          title="Xem danh sách bài hát"
                        >
                          {album.title}
                        </span>
                      </div>
                    </td>
                    <td>
                      {album.artist ? (
                        <span>Nghệ sĩ: {album.artist.artistName}</span>
                      ) : album.genre ? (
                        <span>Thể loại: {album.genre.genreName}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span className={`album-type-badge ${album.type.toLowerCase()}`}>
                        {album.type === 'FREE' ? 'Miễn phí' : 'Premium'}
                      </span>
                    </td>
                    <td>
                      {album.releaseDate
                        ? (() => {
                            try {
                              const date = new Date(album.releaseDate);
                              if (isNaN(date.getTime())) return '-';
                              return date.toLocaleDateString('vi-VN');
                            } catch {
                              return '-';
                            }
                          })()
                        : '-'}
                    </td>
                    <td>
                      {album.createdAt
                        ? (() => {
                            try {
                              const date = new Date(album.createdAt);
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
                          onClick={() => handleEdit(album)}
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(album)}
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
        title="Xác nhận xóa album"
        message={`Bạn có chắc chắn muốn xóa album "${confirmModal.album?.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, album: null })}
      />

      {albumModal.isOpen && (
        <AlbumModal
          album={albumModal.album}
          onClose={() => setAlbumModal({ isOpen: false, album: null })}
          onSuccess={handleModalSuccess}
        />
      )}

      {songsModal.isOpen && (
        <div className="modal-overlay" onClick={() => setSongsModal({ isOpen: false, album: null, songs: [], loading: false })}>
          <div className="songs-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="songs-modal-header">
              <div>
                <h2 className="songs-modal-title">
                  <Music size={24} style={{ marginRight: '8px' }} />
                  Danh sách bài hát của album "{songsModal.album?.title}"
                </h2>
                <p className="songs-modal-subtitle">
                  {songsModal.loading ? 'Đang tải...' : `${songsModal.songs.length} bài hát`}
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => setSongsModal({ isOpen: false, album: null, songs: [], loading: false })}
              >
                <X size={20} />
              </button>
            </div>

            <div className="songs-modal-body">
              {songsModal.loading ? (
                <div className="loading">Đang tải danh sách bài hát...</div>
              ) : songsModal.songs.length === 0 ? (
                <div className="empty-state">Album này chưa có bài hát nào</div>
              ) : (
                <table className="songs-list-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên bài hát</th>
                      <th>Nghe</th>
                      <th>Lượt xem</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {songsModal.songs.map((song) => (
                      <tr key={song.id}>
                        <td>{song.id}</td>
                        <td>{song.title}</td>
                        <td>
                          {song.fileUrl ? (
                            <audio
                              controls
                              className="song-audio-player"
                              preload="metadata"
                            >
                              <source src={song.fileUrl} type="audio/mpeg" />
                              <source src={song.fileUrl} type="audio/wav" />
                              <source src={song.fileUrl} type="audio/m4a" />
                              <source src={song.fileUrl} type="audio/ogg" />
                              Trình duyệt của bạn không hỗ trợ phát audio.
                            </audio>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>{song.views || 0}</td>
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
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDeleteSong(song)}
                            title="Xóa bài hát"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumManagementPage;

