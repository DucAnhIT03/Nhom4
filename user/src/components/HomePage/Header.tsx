import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { IoLanguage } from "react-icons/io5";
import AuthModal from "../LoginRegister/AuthModal";
import UserMenuDropdown from "../UserMenu/UserMenuDropdown";
import { useNavigate } from "react-router-dom";

const Header: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string>("");
  const [userName, setUserName] = useState<string | null>(null);

  const navigate = useNavigate();

  // Avatar mặc định theo role
  const getDefaultAvatar = (role: string | null) => {
    switch (role) {
      case "admin":
        return "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; // admin icon
      case "artist":
        return "https://cdn-icons-png.flaticon.com/512/4140/4140044.png"; // artist icon
      case "user":
        return "https://cdn-icons-png.flaticon.com/512/1077/1077012.png"; // user icon
      default:
        return "https://cdn-icons-png.flaticon.com/512/147/147142.png"; // chung
    }
  };

  const loadUserInfo = () => {
    const token = localStorage.getItem("token");
    const r = localStorage.getItem("role");
    const a = localStorage.getItem("avatar");
    const name = localStorage.getItem("userName");
    
    // Nếu có token nhưng chưa có role, thử lấy lại
    if (token && !r) {
      // Có thể gọi API để lấy role nếu cần
      // Tạm thời set role mặc định
      localStorage.setItem("role", "user");
      setRole("user");
    } else {
      setRole(r);
    }
    setAvatar(a || getDefaultAvatar(r));
    setUserName(name);
  };

  const loadUserAvatar = async () => {
    const token = localStorage.getItem("token");
    const r = localStorage.getItem("role");
    if (token && r) {
      try {
        const { getCurrentUser } = await import("../../services/auth.service");
        const user = await getCurrentUser();
        if ((user as any).profileImage) {
          localStorage.setItem("avatar", (user as any).profileImage);
          setAvatar((user as any).profileImage);
        }
      } catch (err) {
        // Nếu lỗi, giữ nguyên avatar hiện tại
      }
    }
  };

  useEffect(() => {
    loadUserInfo();
    loadUserAvatar(); // Load avatar từ API nếu có
    
    // Lắng nghe sự kiện storage để cập nhật khi login/logout từ tab khác
    const handleStorageChange = () => {
      loadUserInfo();
      loadUserAvatar();
    };
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const openModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setIsModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("avatar");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    setRole(null);
    setAvatar(getDefaultAvatar(null));
    setUserName(null);
  };

  return (
    <>
      <div className="bg-[#1B2039] h-20 ml-20 w-auto flex items-center justify-between px-6">
        {/* LEFT SIDE */}
        <div className="flex items-center">
          <div className="flex items-center w-[260px] h-10 rounded-md overflow-hidden shadow border bg-amber-50">
            <input
              className="flex-1 px-3 text-sm text-gray-600"
              placeholder="Search Music..."
            />
            <button className="w-[46px] h-full bg-[#25C3E7] flex items-center justify-center">
              <FaSearch className="text-white" size={14} />
            </button>
          </div>
          <span className="text-[#3BC8E7] ml-[35px] text-[15px]">Trending Songs :</span>
          <span className="text-white ml-1 text-[15px]">Dream your moments, Until I Met You, Gim</span>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center space-x-6 text-white">
          <div className="flex items-center cursor-pointer">
            Languages <IoLanguage className="ml-2" />
          </div>

          {/* Chưa đăng nhập */}
          {!role && (
            <>
              <button
                onClick={() => openModal("register")}
                className="bg-[#3BC8E7] w-[100px] h-[48px] rounded-2xl font-semibold"
              >
                Register
              </button>
              <button
                onClick={() => openModal("login")}
                className="bg-[#3BC8E7] w-[100px] h-[48px] rounded-2xl font-semibold"
              >
                Login
              </button>
            </>
          )}

          {/* Đã đăng nhập */}
          {role && (
            <>
              <UserMenuDropdown
                avatar={avatar}
                userName={userName || undefined}
                onLogout={handleLogout}
              />

              {role === "admin" && (
                <button
                  onClick={() => navigate("/admin")}
                  className="bg-[#3BC8E7] px-4 py-2 rounded-xl font-semibold hover:bg-[#36B0D9]"
                >
                  Trang Admin
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          loadUserInfo(); // cập nhật Header sau login
        }}
        mode={authMode}
      />
    </>
  );
};

export default Header;
