import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createSubscriptionPlan, updateSubscriptionPlan } from '@/services/subscription-plan.service';
import type { SubscriptionPlan, CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '@/services/subscription-plan.service';
import './SubscriptionPlanModal.css';

interface SubscriptionPlanModalProps {
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DURATION_OPTIONS = [
  { label: '1 tháng', value: 30 },
  { label: '3 tháng', value: 90 },
  { label: '6 tháng', value: 180 },
  { label: '1 năm', value: 365 },
];

const SubscriptionPlanModal = ({ plan, onClose, onSuccess }: SubscriptionPlanModalProps) => {
  const [formData, setFormData] = useState({
    planName: '',
    price: '',
    durationDay: 30,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (plan) {
      setFormData({
        planName: plan.planName || '',
        price: plan.price.toString() || '',
        durationDay: plan.durationDay || 30,
        description: plan.description || '',
      });
    } else {
      setFormData({
        planName: '',
        price: '',
        durationDay: 30,
        description: '',
      });
    }
  }, [plan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'durationDay' ? parseInt(value) : name === 'price' ? value : value,
    }));
    setError('');
  };

  const formatDurationLabel = (days: number) => {
    const option = DURATION_OPTIONS.find(opt => opt.value === days);
    return option ? option.label : `${days} ngày`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        setError('Giá phải là số dương lớn hơn 0');
        setLoading(false);
        return;
      }

      if (plan) {
        // Update plan
        const updateData: UpdateSubscriptionPlanDto = {
          planName: formData.planName || undefined,
          price: price,
          durationDay: formData.durationDay,
          description: formData.description || undefined,
        };
        await updateSubscriptionPlan(plan.id, updateData);
        alert('Cập nhật gói subscription thành công!');
      } else {
        // Create plan
        const createData: CreateSubscriptionPlanDto = {
          planName: formData.planName,
          price: price,
          durationDay: formData.durationDay,
          description: formData.description || undefined,
        };
        await createSubscriptionPlan(createData);
        alert('Tạo gói subscription thành công!');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {plan ? 'Chỉnh sửa gói subscription' : 'Thêm gói subscription mới'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Tên gói *</label>
            <input
              type="text"
              name="planName"
              value={formData.planName}
              onChange={handleChange}
              className="form-input"
              placeholder="Ví dụ: Premium 1 tháng, Premium 3 tháng..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Thời hạn *</label>
            <select
              name="durationDay"
              value={formData.durationDay}
              onChange={handleChange}
              className="form-input"
              required
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="form-hint">Thời hạn: {formatDurationLabel(formData.durationDay)}</p>
          </div>

          <div className="form-group">
            <label className="form-label">Giá (VNĐ) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="form-input"
              placeholder="Ví dụ: 99000"
              min="0.01"
              step="0.01"
              required
            />
            {formData.price && (
              <p className="form-hint">
                {parseFloat(formData.price).toLocaleString('vi-VN')} VNĐ
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input form-textarea"
              placeholder="Mô tả về gói subscription..."
              rows={4}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : plan ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionPlanModal;

