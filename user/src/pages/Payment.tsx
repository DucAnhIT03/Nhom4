import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSubscriptionPlanById } from '../services/subscription-plan.service';
import { createPayment, createMomoPayment, PaymentMethod, type PaymentMethod as PaymentMethodType } from '../services/payment.service';
import type { SubscriptionPlan } from '../services/subscription-plan.service';
import { Gem, CreditCard, Wallet, Smartphone, ArrowLeft } from 'lucide-react';

const DURATION_LABELS: Record<number, string> = {
  30: '1 tháng',
  90: '3 tháng',
  180: '6 tháng',
  365: '1 năm',
};

const Payment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>(PaymentMethod.MOMO);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const userIdStr = localStorage.getItem('userId');
    if (userIdStr) {
      setUserId(parseInt(userIdStr));
    }

    if (planId) {
      loadPlan(parseInt(planId));
    } else {
      alert('Không tìm thấy gói subscription');
      navigate('/upgrade');
    }
  }, [planId, navigate]);

  const loadPlan = async (id: number) => {
    try {
      const planData = await getSubscriptionPlanById(id);
      setPlan(planData);
    } catch (error) {
      console.error('Error loading subscription plan:', error);
      alert('Không thể tải thông tin gói subscription');
      navigate('/upgrade');
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

  const handlePayment = async () => {
    if (!plan || !userId) {
      alert('Thông tin không hợp lệ');
      return;
    }

    setProcessing(true);

    try {
      // Nếu là MoMo, tạo payment link và redirect
      if (selectedMethod === PaymentMethod.MOMO) {
        const momoResponse = await createMomoPayment({
          planId: plan.id,
          amount: plan.price,
          planName: plan.planName,
        });

        // Redirect đến MoMo payment page
        window.location.href = momoResponse.payUrl;
        return;
      }

      // Các phương thức thanh toán khác (giữ nguyên logic cũ)
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await createPayment({
        userId,
        planId: plan.id,
        amount: plan.price,
        paymentMethod: selectedMethod,
        transactionId,
      });

      // Cập nhật subscription status trong localStorage
      localStorage.setItem('userSubscription', 'PREMIUM');
      
      alert('Thanh toán thành công! Tài khoản của bạn đã được nâng cấp lên Premium.');
      navigate('/');
    } catch (error: any) {
      console.error('Error processing payment:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.';
      alert(errorMessage);
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { value: PaymentMethod.MOMO, label: 'MoMo', icon: Smartphone, color: 'bg-pink-500' },
    { value: PaymentMethod.ZALO_PAY, label: 'ZaloPay', icon: Smartphone, color: 'bg-blue-500' },
    { value: PaymentMethod.CREDIT_CARD, label: 'Thẻ tín dụng', icon: CreditCard, color: 'bg-indigo-500' },
    { value: PaymentMethod.PAYPAL, label: 'PayPal', icon: Wallet, color: 'bg-blue-600' },
  ];

  if (loading) {
    return (
      <div className="bg-[#14182A] min-h-screen">
        {/* Standalone Header */}
        <div className="bg-[#1B2039] h-20 w-full flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/upgrade')}
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
            <span className="text-sm text-gray-400">Thanh toán</span>
          </div>
        </div>
        
        <div className="pt-12 pb-20 px-6">
          <div className="text-center text-white py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3BC8E7]"></div>
            <p className="mt-4">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="bg-[#14182A] min-h-screen">
      {/* Standalone Header */}
      <div className="bg-[#1B2039] h-20 w-full flex items-center justify-between px-8 shadow-lg">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/upgrade')}
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
          <span className="text-sm text-gray-400">Thanh toán</span>
        </div>
      </div>
      
      <div className="pt-12 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Thanh toán</h1>
            <p className="text-gray-400">Hoàn tất thanh toán để nâng cấp tài khoản</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Thông tin gói */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Gem className="w-6 h-6 text-[#3BC8E7]" />
                  Thông tin gói
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tên gói:</span>
                    <span className="text-white font-semibold">{plan.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Thời hạn:</span>
                    <span className="text-white">{getDurationLabel(plan.durationDay)}</span>
                  </div>
                  {plan.description && (
                    <div className="pt-3 border-t border-gray-700">
                      <p className="text-gray-300 text-sm">{plan.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Phương thức thanh toán</h2>
                <div className="grid grid-cols-2 gap-4">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        onClick={() => setSelectedMethod(method.value)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedMethod === method.value
                            ? 'border-[#3BC8E7] bg-[#3BC8E7]/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`${method.color} p-2 rounded-lg`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-white font-medium">{method.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tổng thanh toán */}
            <div className="lg:col-span-1">
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700 sticky top-20">
                <h2 className="text-xl font-bold text-white mb-4">Tổng thanh toán</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Giá gói:</span>
                    <span className="text-white font-semibold">
                      {formatPrice(plan.price)} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-700">
                    <span className="text-lg font-bold text-white">Tổng cộng:</span>
                    <span className="text-lg font-bold text-[#3BC8E7]">
                      {formatPrice(plan.price)} VNĐ
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full py-3 bg-[#3BC8E7] text-white rounded-lg font-semibold hover:bg-[#2ba8c7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Đang xử lý...' : 'Thanh toán ngay'}
                </button>

                <button
                  onClick={() => navigate('/upgrade')}
                  className="w-full py-3 mt-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Quay lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;

