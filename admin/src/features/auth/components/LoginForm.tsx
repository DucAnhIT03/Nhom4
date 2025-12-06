import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getCurrentUser } from '@/services/auth.service';
import './LoginForm.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: 'admin@music.com',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData.email, formData.password);
      
      // Lưu accessToken vào localStorage
      if (response.data?.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
        
        // Lấy thông tin user nếu cần
        try {
          const userProfile = await getCurrentUser();
          localStorage.setItem('user', JSON.stringify(userProfile));
        } catch (userError) {
          console.warn('Không thể lấy thông tin user:', userError);
        }
        
        // Chuyển hướng đến dashboard
        navigate('/dashboard');
      } else {
        setError('Đăng nhập thất bại. Không nhận được token.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1 className="login-title">Đăng nhập</h1>
        
        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          type="submit" 
          className="login-button"
          disabled={loading}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;

