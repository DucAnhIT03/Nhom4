import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPayments } from '../services/payment.service';
import type { Payment } from '../services/payment.service';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Header from '../components/HomePage/Header';
import Sidebar from '../components/HomePage/Sidebar';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      const paymentData = await getMyPayments();
      // Backend đã trả về plan info trong response, không cần load thêm
      setPayments(paymentData);
    } catch (error) {
      console.error('Error loading payment history:', error);
      alert('Không thể tải lịch sử thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'REFUNDED':
        return <RefreshCw className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Thành công';
      case 'PENDING':
        return 'Đang xử lý';
      case 'FAILED':
        return 'Thất bại';
      case 'REFUNDED':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-500 bg-green-500/10';
      case 'PENDING':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'FAILED':
        return 'text-red-500 bg-red-500/10';
      case 'REFUNDED':
        return 'text-blue-500 bg-blue-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'PAYPAL':
        return 'PayPal';
      case 'CREDIT_CARD':
        return 'Thẻ tín dụng';
      case 'MOMO':
        return 'MoMo';
      case 'ZALO_PAY':
        return 'ZaloPay';
      default:
        return method;
    }
  };

  return (
    <div className="w-[1520px] min-h-screen text-white bg-[#14182A]">
      <Header />
      <Sidebar />

      <div className="ml-[120px] mt-[-500px] pt-8 pb-20 px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </button>
            <div className="h-8 w-px bg-gray-600"></div>
            <h1 className="text-3xl font-bold text-white">Lịch sử thanh toán</h1>
          </div>
          <button
            onClick={loadPaymentHistory}
            className="px-4 py-2 bg-[#3BC8E7] hover:bg-[#2cb1cf] text-[#171C36] rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>

        {/* Payment List */}
        {loading ? (
          <div className="text-center text-white py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3BC8E7]"></div>
            <p className="mt-4">Đang tải...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center text-white py-20">
            <div className="mb-4">
              <svg
                className="w-24 h-24 mx-auto text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-xl text-gray-400">Chưa có lịch sử thanh toán nào</p>
            <button
              onClick={() => navigate('/upgrade')}
              className="mt-6 px-6 py-3 bg-[#3BC8E7] hover:bg-[#2cb1cf] text-[#171C36] rounded-lg font-semibold transition-colors"
            >
              Nâng cấp tài khoản
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-[#1a1a1a] rounded-lg p-6 border border-[#252B4D] hover:border-[#3BC8E7]/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(payment.paymentStatus)}`}>
                        {getStatusIcon(payment.paymentStatus)}
                        <span className="text-sm font-semibold">
                          {getStatusLabel(payment.paymentStatus)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(payment.paymentDate)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Gói đăng ký</p>
                        <p className="text-white font-semibold">
                          {payment.plan?.planName || `Gói #${payment.planId}`}
                        </p>
                        {payment.plan && (
                          <p className="text-xs text-gray-500 mt-1">
                            {payment.plan.durationDay} ngày
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Phương thức thanh toán</p>
                        <p className="text-white font-semibold">
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Số tiền</p>
                        <p className="text-[#3BC8E7] font-bold text-lg">
                          {formatPrice(payment.amount)}
                        </p>
                      </div>
                      {payment.transactionId && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Mã giao dịch</p>
                          <p className="text-white font-mono text-sm">
                            {payment.transactionId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;

