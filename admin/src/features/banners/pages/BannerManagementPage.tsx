import { useState, useEffect } from 'react';
import { Search, Trash2, Edit, Plus, Eye, EyeOff } from 'lucide-react';
import { getBanners, deleteBanner } from '@/services/banner.service';
import type { Banner } from '@/services/banner.service';
import ConfirmModal from '../../artists/components/ConfirmModal';
import BannerModal from '../components/BannerModal';
import './BannerManagementPage.css';

const BannerManagementPage = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    banner: Banner | null;
  }>({
    isOpen: false,
    banner: null,
  });
  const [bannerModal, setBannerModal] = useState<{
    isOpen: boolean;
    banner: Banner | null;
  }>({
    isOpen: false,
    banner: null,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await getBanners();
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBanners = banners.filter((banner) =>
    banner.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = (banner: Banner) => {
    setConfirmModal({
      isOpen: true,
      banner,
    });
  };

  const handleEdit = (banner: Banner) => {
    setBannerModal({
      isOpen: true,
      banner,
    });
  };

  const handleAdd = () => {
    setBannerModal({
      isOpen: true,
      banner: null,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.banner) return;

    try {
      await deleteBanner(confirmModal.banner.id);
      setConfirmModal({ isOpen: false, banner: null });
      loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Không thể xóa banner này');
    }
  };

  const handleModalSuccess = () => {
    setBannerModal({ isOpen: false, banner: null });
    loadBanners();
  };

  return (
    <div className="banner-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý banner</h1>
          <p className="page-subtitle">Quản lý tất cả banner trong hệ thống</p>
        </div>
        <button className="btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Thêm banner
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề..."
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
          <table className="banners-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ảnh</th>
                <th>Tiêu đề</th>
                <th>Bài hát</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    {searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                filteredBanners.map((banner) => (
                  <tr key={banner.id}>
                    <td>{banner.id}</td>
                    <td>
                      {banner.imageUrl ? (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="banner-image-small"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="banner-title-cell">
                        <span>{banner.title}</span>
                      </div>
                    </td>
                    <td>
                      {banner.song ? (
                        <div className="song-link">
                          <span className="song-title">{banner.song.title}</span>
                          {banner.song.artist && (
                            <span className="song-artist"> - {banner.song.artist.artistName}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          banner.isActive ? 'status-active' : 'status-inactive'
                        }`}
                      >
                        {banner.isActive ? (
                          <>
                            <Eye size={14} />
                            Hoạt động
                          </>
                        ) : (
                          <>
                            <EyeOff size={14} />
                            Tắt
                          </>
                        )}
                      </span>
                    </td>
                    <td>
                      {banner.createdAt
                        ? (() => {
                            try {
                              const date = new Date(banner.createdAt);
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
                          onClick={() => handleEdit(banner)}
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(banner)}
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
        title="Xác nhận xóa banner"
        message={`Bạn có chắc chắn muốn xóa banner "${confirmModal.banner?.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, banner: null })}
      />

      {bannerModal.isOpen && (
        <BannerModal
          banner={bannerModal.banner}
          onClose={() => setBannerModal({ isOpen: false, banner: null })}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default BannerManagementPage;

