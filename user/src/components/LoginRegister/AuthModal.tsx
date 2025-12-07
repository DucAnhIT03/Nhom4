import React, { useState } from "react";
import { register, verifyOtp, login, getCurrentUser } from "../../services/auth.service";

// ĐỊNH NGHĨA ẢNH ĐẠI DIỆN MẶC ĐỊNH
// Bạn có thể thay đổi link ảnh tại đây
const AVATAR_ARTIST = "https://cdn-icons-png.flaticon.com/512/3974/3974038.png"; // Ảnh đại diện cho Nghệ sĩ (Ví dụ hình nốt nhạc/micro)
const AVATAR_USER = "https://cdn-icons-png.flaticon.com/512/3177/3177440.png";   // Ảnh đại diện cho User thường

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "register";
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user", // Mặc định là user
  });

  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const inputClass =
    "w-full mb-3 px-3 py-2 rounded bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B2039]";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Hàm lấy avatar dựa trên role
  const getDefaultAvatar = (role: string) => {
    const normalizedRole = role ? role.toLowerCase() : "user";
    if (normalizedRole === "artist") {
      return AVATAR_ARTIST;
    }
    return AVATAR_USER;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // --- 1. ĐĂNG KÝ (REGISTER) ---
      if (mode === "register" && step === "form") {
        // Kiểm tra mật khẩu khớp
        if (formData.password !== formData.confirmPassword) {
          setMessage("❌ Mật khẩu xác nhận không khớp!");
          setLoading(false);
          return;
        }

        // Kiểm tra mật khẩu tối thiểu 6 ký tự
        if (formData.password.length < 6) {
          setMessage("❌ Mật khẩu phải có ít nhất 6 ký tự!");
          setLoading(false);
          return;
        }

        await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        });
        
        // Lưu tạm avatar vào localStorage để nếu đăng nhập ngay thì có ảnh luôn
        localStorage.setItem("avatar", getDefaultAvatar(formData.role));
        
        setMessage("✅ Mã OTP đã gửi về email! Vui lòng kiểm tra hộp thư.");
        setStep("otp");
      }

      // --- 2. XÁC THỰC OTP ---
      else if (mode === "register" && step === "otp") {
        if (otp.length !== 6) {
          setMessage("❌ Mã OTP phải có 6 chữ số!");
          setLoading(false);
          return;
        }

        const response = await verifyOtp({
          email: formData.email,
          otp: otp,
        });

        // Lưu token sau khi verify thành công
        localStorage.setItem("token", response.accessToken);

        // Lấy thông tin user để lưu role
        let userRole = "user";
        try {
          const userProfile = await getCurrentUser();
          if (userProfile.role) {
            // Normalize role: loại bỏ "ROLE_" prefix và chuyển về lowercase
            userRole = userProfile.role.replace(/^ROLE_/i, "").toLowerCase();
            localStorage.setItem("role", userRole);
          }
          if (userProfile.id) {
            localStorage.setItem("userId", userProfile.id.toString());
          }
          if (userProfile.email) {
            localStorage.setItem("email", userProfile.email);
          }
          if (userProfile.firstName && userProfile.lastName) {
            localStorage.setItem("userName", `${userProfile.firstName} ${userProfile.lastName}`);
          }
        } catch (err) {
          console.warn("Không thể lấy thông tin user:", err);
          // Vẫn tiếp tục với role mặc định
          localStorage.setItem("role", "user");
        }
        
        setMessage("✅ Xác thực thành công! Đang đăng nhập...");
        
        // Tự động đăng nhập sau khi verify, điều hướng dựa trên role
        setTimeout(() => {
          if (userRole === "artist") {
            window.location.href = "/artist/dashboard";
          } else {
            window.location.href = "/";
          }
        }, 1000);
      }

      // --- 3. ĐĂNG NHẬP (LOGIN) ---
      else {
        const response = await login({
          email: formData.email,
          password: formData.password,
        });

        // Lưu token
        localStorage.setItem("token", response.accessToken);

        // Lấy thông tin user để lưu role
        let userRole = "user";
        try {
          const userProfile = await getCurrentUser();
          if (userProfile.role) {
            // Normalize role: loại bỏ "ROLE_" prefix và chuyển về lowercase
            userRole = userProfile.role.replace(/^ROLE_/i, "").toLowerCase();
            localStorage.setItem("role", userRole);
          }
          if (userProfile.id) {
            localStorage.setItem("userId", userProfile.id.toString());
          }
          if (userProfile.email) {
            localStorage.setItem("email", userProfile.email);
          }
          if (userProfile.firstName && userProfile.lastName) {
            localStorage.setItem("userName", `${userProfile.firstName} ${userProfile.lastName}`);
          }
        } catch (err) {
          console.warn("Không thể lấy thông tin user:", err);
          // Vẫn tiếp tục với role mặc định
          localStorage.setItem("role", "user");
        }

        setMessage("✅ Đăng nhập thành công!");

        // Điều hướng dựa trên role
        setTimeout(() => {
          if (userRole === "artist") {
            window.location.href = "/artist/dashboard";
          } else {
            window.location.href = "/";
          }
        }, 800);
      }
    } catch (err: any) {
      console.error("Error:", err);
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        "❌ Có lỗi xảy ra! Vui lòng thử lại.";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#3BC8E7] w-[450px] md:w-[500px] rounded-3xl shadow-lg relative p-6 md:p-10 text-black">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-gray-200"
        >
          ×
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-6 text-white text-center">
            {mode === "register"
              ? step === "otp"
                ? "Xác thực Email"
                : "Đăng ký tài khoản"
              : "Đăng nhập"}
          </h2>

          {mode === "register" && step === "otp" ? (
            <>
              <input
                type="text"
                name="otp"
                placeholder="Nhập mã OTP"
                className={inputClass}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button type="submit" className="w-full py-2 mt-2 rounded-3xl bg-[#1B2039] text-white font-semibold">
                Xác thực Email
              </button>
            </>
          ) : (
            <>
              {mode === "register" && (
                <>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Họ"
                    className={inputClass}
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Tên"
                    className={inputClass}
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </>
              )}

              <input
                type="email"
                name="email"
                placeholder="Email"
                className={inputClass}
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu"
                className={inputClass}
                value={formData.password}
                onChange={handleChange}
                required
              />
              {mode === "register" && (
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Xác nhận mật khẩu"
                  className={inputClass}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              )}

              <button type="submit" className="w-full py-2 mt-2 rounded-3xl bg-[#1B2039] text-white font-semibold hover:bg-[#2a3255] transition-colors">
                {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
            </>
          )}
          {message && <p className="text-white mt-3 text-center font-bold text-sm bg-black/20 p-2 rounded">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;