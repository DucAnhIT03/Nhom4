import React, { useState, useEffect } from "react";
import { getCurrentUser } from "../../services/auth.service";
import axios from "axios";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    age: "",
    nationality: "",
    profileImage: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUserInfo();
    }
  }, [isOpen]);

  const loadUserInfo = async () => {
    try {
      const user = await getCurrentUser();
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        age: user.age?.toString() || "",
        nationality: user.nationality || "",
        profileImage: (user as any).profileImage || "",
      });
      if ((user as any).profileImage) {
        setAvatarPreview((user as any).profileImage);
      }
    } catch (err) {
      console.error("Error loading user info:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("❌ Kích thước file không được vượt quá 5MB!");
        return;
      }

      // Kiểm tra loại file
      if (!file.type.startsWith("image/")) {
        setMessage("❌ Vui lòng chọn file ảnh!");
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId") || (await getCurrentUser()).id;
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      let profileImageUrl = formData.profileImage;

      // Upload avatar nếu có file mới
      if (avatarFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", avatarFile);

        try {
          const uploadResponse = await axios.post(
            `${API_BASE_URL}/upload/single`,
            formDataUpload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );
          profileImageUrl = uploadResponse.data.url || uploadResponse.data.path || uploadResponse.data;
        } catch (uploadErr: any) {
          setMessage("❌ Lỗi upload ảnh: " + (uploadErr.response?.data?.message || "Vui lòng thử lại"));
          setLoading(false);
          return;
        }
      }

      // Cập nhật thông tin user (sử dụng endpoint /auth/me để user tự cập nhật profile)
      await axios.put(
        `${API_BASE_URL}/auth/me`,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          age: formData.age ? parseInt(formData.age, 10) : undefined,
          nationality: formData.nationality || undefined,
          profileImage: profileImageUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Cập nhật localStorage
      if (formData.firstName && formData.lastName) {
        localStorage.setItem("userName", `${formData.firstName} ${formData.lastName}`);
      }
      localStorage.setItem("email", formData.email);
      localStorage.setItem("userId", userId.toString());
      if (profileImageUrl) {
        localStorage.setItem("avatar", profileImageUrl);
      }

      setMessage("✅ Cập nhật thông tin thành công!");
      setTimeout(() => {
        onClose();
        window.location.reload();
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
          Chỉnh sửa thông tin
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="relative">
              <img
                src={avatarPreview || formData.profileImage || "https://cdn-icons-png.flaticon.com/512/1077/1077012.png"}
                alt="Avatar"
                className="w-24 h-24 rounded-full border-2 border-[#3BC8E7] object-cover"
              />
              {avatarPreview && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs">Xem trước</span>
                </div>
              )}
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <span className="text-[#3BC8E7] text-sm hover:underline">
                Chọn ảnh đại diện
              </span>
            </label>
            {avatarFile && (
              <p className="text-gray-400 text-xs">
                {avatarFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-white text-sm mb-2">Họ</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-[#0f0f0f] border border-[#3BC8E7]/30 text-white focus:outline-none focus:border-[#3BC8E7]"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm mb-2">Tên</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-[#0f0f0f] border border-[#3BC8E7]/30 text-white focus:outline-none focus:border-[#3BC8E7]"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-[#0f0f0f] border border-[#3BC8E7]/30 text-white focus:outline-none focus:border-[#3BC8E7]"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm mb-2">Tuổi</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="1"
              max="120"
              className="w-full px-4 py-2 rounded-lg bg-[#0f0f0f] border border-[#3BC8E7]/30 text-white focus:outline-none focus:border-[#3BC8E7]"
              placeholder="Nhập tuổi của bạn"
            />
          </div>

          <div>
            <label className="block text-white text-sm mb-2">Quốc tịch</label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-[#0f0f0f] border border-[#3BC8E7]/30 text-white focus:outline-none focus:border-[#3BC8E7]"
              placeholder="Ví dụ: Việt Nam, USA, etc."
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
              {loading ? "Đang xử lý..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
