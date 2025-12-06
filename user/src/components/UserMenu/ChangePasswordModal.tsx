import React, { useState } from "react";
import axios from "axios";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validation
    if (formData.newPassword.length < 6) {
      setMessage("❌ Mật khẩu mới phải có ít nhất 6 ký tự!");
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("❌ Mật khẩu xác nhận không khớp!");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.put(
        `${API_BASE_URL}/users/${userId}/change-password`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("✅ Đổi mật khẩu thành công!");
      setTimeout(() => {
        onClose();
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }, 1000);
    } catch (err: any) {
      setMessage(
        err.response?.data?.message || "❌ Có lỗi xảy ra! Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] w-[450px] rounded-2xl shadow-lg relative p-6 border border-[#3BC8E7]/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-[#3BC8E7]"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold mb-6 text-white text-center">
          Đổi mật khẩu
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-white text-sm mb-2">Mật khẩu hiện tại</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-[#0f0f0f] border border-[#3BC8E7]/30 text-white focus:outline-none focus:border-[#3BC8E7]"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm mb-2">Mật khẩu mới</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-[#0f0f0f] border border-[#3BC8E7]/30 text-white focus:outline-none focus:border-[#3BC8E7]"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-white text-sm mb-2">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-[#0f0f0f] border border-[#3BC8E7]/30 text-white focus:outline-none focus:border-[#3BC8E7]"
              required
              minLength={6}
            />
          </div>

          {message && (
            <p className="text-center text-sm font-semibold bg-black/20 p-2 rounded">
              {message}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-[#3BC8E7] text-white font-semibold hover:bg-[#2ba8c7] disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

