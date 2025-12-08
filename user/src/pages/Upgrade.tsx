import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubscriptionPlans } from '../services/subscription-plan.service';
import type { SubscriptionPlan } from '../services/subscription-plan.service';
import { Gem, Check, ArrowLeft } from 'lucide-react';

const DURATION_LABELS: Record<number, string> = {
  30: '1 tháng',
  90: '3 tháng',
  180: '6 tháng',
  365: '1 năm',
};

const Upgrade = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await getSubscriptionPlans();
      setPlans(response.data || []);
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      alert('Không thể tải danh sách gói subscription');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const getDurationLabel = (days: number) => {
    return DURATION_LABELS[days] || `${days} ngày`;
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    navigate(`/payment?planId=${plan.id}`);
  };

  return (
    <div className="bg-[#14182A] min-h-screen">
      {/* Standalone Header */}
      <div className="bg-[#1B2039] h-20 w-full flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-[#3BC8E7] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Quay lại</span>
          </button>
          <div className="h-8 w-px bg-gray-600"></div>
          <img
            src="./Sidebar/logo.png"
            alt="Logo"
            className="w-12 h-12"
          />
          <span className="text-white text-lg font-semibold">The Miraculous</span>
        </div>
        <div className="text-white">
          <span className="text-sm text-gray-400">Nâng cấp tài khoản</span>
        </div>
      </div>
      
      <div className="pt-12 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Nâng cấp tài khoản Premium
            </h1>
            <p className="text-gray-400 text-lg">
              Chọn gói phù hợp với bạn và tận hưởng trải nghiệm âm nhạc không giới hạn
            </p>
          </div>

          {loading ? (
            <div className="text-center text-white py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3BC8E7]"></div>
              <p className="mt-4">Đang tải...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center text-white py-20">
              <p className="text-xl">Không có gói subscription nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-[#1a1a1a] rounded-xl p-6 border-2 transition-all cursor-pointer hover:scale-105 ${
                    selectedPlan?.id === plan.id
                      ? 'border-[#3BC8E7] shadow-lg shadow-[#3BC8E7]/20'
                      : 'border-gray-700 hover:border-[#3BC8E7]/50'
                  }`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Gem className="w-6 h-6 text-[#3BC8E7]" />
                      <h3 className="text-xl font-bold text-white">{plan.planName}</h3>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-gray-400">VNĐ</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {getDurationLabel(plan.durationDay)}
                    </p>
                  </div>

                  {plan.description && (
                    <p className="text-gray-300 text-sm mb-6">{plan.description}</p>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-[#3BC8E7] flex-shrink-0" />
                      <span className="text-sm">Nghe nhạc không giới hạn</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-[#3BC8E7] flex-shrink-0" />
                      <span className="text-sm">Tải nhạc chất lượng cao</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-[#3BC8E7] flex-shrink-0" />
                      <span className="text-sm">Nghe nhạc Premium</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="w-5 h-5 text-[#3BC8E7] flex-shrink-0" />
                      <span className="text-sm">Không quảng cáo</span>
                    </div>
                  </div>

                  <button
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      selectedPlan?.id === plan.id
                        ? 'bg-[#3BC8E7] text-white hover:bg-[#2ba8c7]'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(plan);
                    }}
                  >
                    Chọn gói này
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upgrade;

