import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { isUserPremium } from '../services/subscription.service';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');

  useEffect(() => {
    const resultCode = searchParams.get('resultCode');
    const orderId = searchParams.get('orderId');
    const message = searchParams.get('message');

    if (resultCode === '0') {
      // Thanh toán thành công
      setStatus('success');
      setMessage('Thanh toán thành công! Tài khoản của bạn đã được nâng cấp lên Premium.');
      
      // Refresh premium status từ server
      const userId = localStorage.getItem('userId');
      if (userId) {
        // Đợi một chút để backend xử lý callback trước
        setTimeout(async () => {
          await isUserPremium(parseInt(userId));
          // Trigger storage event để các component khác cập nhật
          window.dispatchEvent(new Event('storage'));
        }, 1000);
      }
      
      // Redirect về trang chủ sau 3 giây
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      // Thanh toán thất bại
      setStatus('failed');
      setMessage(message || 'Thanh toán thất bại. Vui lòng thử lại.');
      
      // Redirect về trang upgrade sau 3 giây
      setTimeout(() => {
        navigate('/upgrade');
      }, 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="bg-[#14182A] min-h-screen flex items-center justify-center">
      <div className="bg-[#1a1a1a] rounded-xl p-8 max-w-md w-full mx-4 border border-gray-700">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-[#3BC8E7] mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-white mb-2">Đang xử lý...</h2>
              <p className="text-gray-400">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Thanh toán thành công!</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <button
                onClick={() => navigate('/')}
                className="bg-[#3BC8E7] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#2ba8c7] transition-all"
              >
                Về trang chủ
              </button>
            </>
          )}
          
          {status === 'failed' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Thanh toán thất bại</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <button
                onClick={() => navigate('/upgrade')}
                className="bg-[#3BC8E7] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#2ba8c7] transition-all"
              >
                Thử lại
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;

