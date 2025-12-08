import { useState, useEffect } from 'react';
import { Search, Trash2, Edit, Plus } from 'lucide-react';
import { getSubscriptionPlans, deleteSubscriptionPlan } from '@/services/subscription-plan.service';
import type { SubscriptionPlan } from '@/services/subscription-plan.service';
import ConfirmModal from '../../artists/components/ConfirmModal';
import SubscriptionPlanModal from '../components/SubscriptionPlanModal';
import './SubscriptionPlanManagementPage.css';

const DURATION_LABELS: Record<number, string> = {
  30: '1 tháng',
  90: '3 tháng',
  180: '6 tháng',
  365: '1 năm',
};

const SubscriptionPlanManagementPage = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    plan: SubscriptionPlan | null;
  }>({
    isOpen: false,
    plan: null,
  });
  const [planModal, setPlanModal] = useState<{
    isOpen: boolean;
    plan: SubscriptionPlan | null;
  }>({
    isOpen: false,
    plan: null,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await getSubscriptionPlans();
      setPlans(response.data || []);
    } catch (error: any) {
      console.error('Error loading subscription plans:', error);
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách gói subscription';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter((plan) =>
    plan.planName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    setConfirmModal({
      isOpen: true,
      plan,
    });
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setPlanModal({
      isOpen: true,
      plan,
    });
  };

  const handleAdd = () => {
    setPlanModal({
      isOpen: true,
      plan: null,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.plan) return;

    try {
      await deleteSubscriptionPlan(confirmModal.plan.id);
      setConfirmModal({ isOpen: false, plan: null });
      alert('Xóa gói subscription thành công!');
      loadPlans();
    } catch (error: any) {
      console.error('Error deleting subscription plan:', error);
      const errorMessage = error.response?.data?.message || 'Không thể xóa gói subscription này';
      alert(errorMessage);
    }
  };

  const handleModalSuccess = () => {
    setPlanModal({ isOpen: false, plan: null });
    loadPlans();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const getDurationLabel = (days: number) => {
    return DURATION_LABELS[days] || `${days} ngày`;
  };

  return (
    <div className="subscription-plan-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý giá tài khoản Premium</h1>
          <p className="page-subtitle">Quản lý các gói subscription và giá cho tài khoản Premium</p>
        </div>
        <button className="btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Thêm gói mới
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên gói..."
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
          <table className="subscription-plans-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên gói</th>
                <th>Thời hạn</th>
                <th>Giá (VNĐ)</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    {searchTerm ? 'Không tìm thấy kết quả' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.id}</td>
                    <td>
                      <span className="plan-name">{plan.planName}</span>
                    </td>
                    <td>
                      <span className="duration-badge">{getDurationLabel(plan.durationDay)}</span>
                    </td>
                    <td>
                      <span className="price-value">{formatPrice(plan.price)} VNĐ</span>
                    </td>
                    <td>
                      <span className="description-text" title={plan.description || ''}>
                        {plan.description || '-'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEdit(plan)}
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(plan)}
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
        title="Xác nhận xóa gói subscription"
        message={`Bạn có chắc chắn muốn xóa gói "${confirmModal.plan?.planName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, plan: null })}
      />

      {planModal.isOpen && (
        <SubscriptionPlanModal
          plan={planModal.plan}
          onClose={() => setPlanModal({ isOpen: false, plan: null })}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default SubscriptionPlanManagementPage;

