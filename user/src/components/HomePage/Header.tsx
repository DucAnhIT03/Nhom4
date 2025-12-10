import React, { useEffect, useState, useCallback } from "react";
import { FaSearch } from "react-icons/fa";
import AuthModal from "../LoginRegister/AuthModal";
import UserMenuDropdown from "../UserMenu/UserMenuDropdown";
import LanguageDropdown from "../Language/LanguageDropdown";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";

const Header: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string>("");
  const [userName, setUserName] = useState<string | null>(null);

  const navigate = useNavigate();
  const { t } = useLanguage();

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

  // Hàm load role từ API - sử dụng useCallback để tránh re-create function
  const loadRoleFromAPI = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setRole(null);
      return;
    }

    try {
      const { getCurrentUser } = await import("../../services/auth.service");
      const userProfile = await getCurrentUser();
      if (userProfile.role) {
        // Normalize role: loại bỏ "ROLE_" prefix và chuyển về lowercase
        const normalizedRole = userProfile.role.replace(/^ROLE_/i, "").toLowerCase();
        setRole(normalizedRole);
        localStorage.setItem("role", normalizedRole);
      }
      if ((userProfile as any).profileImage) {
        localStorage.setItem("avatar", (userProfile as any).profileImage);
        setAvatar((userProfile as any).profileImage);
      }
      if (userProfile.firstName && userProfile.lastName) {
        const fullName = `${userProfile.firstName} ${userProfile.lastName}`;
        localStorage.setItem("userName", fullName);
        setUserName(fullName);
      }
    } catch (err) {
      console.warn("Không thể lấy thông tin user từ API:", err);
      // Giữ nguyên từ localStorage nếu API lỗi
      const r = localStorage.getItem("role");
      const a = localStorage.getItem("avatar");
      const name = localStorage.getItem("userName");
      setRole(r);
      setAvatar(a || getDefaultAvatar(r));
      setUserName(name);
    }
  }, []); // Empty dependency array vì function không phụ thuộc vào props/state

  const loadUserInfo = () => {
    const token = localStorage.getItem("token");
    const r = localStorage.getItem("role");
    const a = localStorage.getItem("avatar");
    const name = localStorage.getItem("userName");
    
    // Normalize role từ localStorage
    if (r) {
      const normalizedRole = r.replace(/^ROLE_/i, "").toLowerCase();
      setRole(normalizedRole);
    } else if (token) {
      // Nếu có token nhưng chưa có role, thử lấy lại
      loadRoleFromAPI();
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
    
    // Refresh role từ API ngay lập tức
    loadRoleFromAPI();
    
    // Tự động refresh role mỗi 30 giây để cập nhật khi admin gán quyền
    const intervalId = setInterval(() => {
      loadRoleFromAPI();
    }, 30000); // 30 giây
    
    // Refresh role khi user quay lại tab/window (focus)
    const handleFocus = () => {
      loadRoleFromAPI();
    };
    window.addEventListener("focus", handleFocus);
    
    // Lắng nghe sự kiện storage để cập nhật khi login/logout từ tab khác
    const handleStorageChange = () => {
      loadUserInfo();
      loadUserAvatar();
      loadRoleFromAPI();
    };
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadRoleFromAPI]); // Thêm loadRoleFromAPI vào dependency array

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
      <div className="bg-[#1B2039] h-20 ml-20 w-auto flex items-center justify-between px-6 relative z-[100]">
        {/* LEFT SIDE */}
        <div className="flex items-center">
          <div className="flex items-center w-[260px] h-10 rounded-md overflow-hidden shadow border bg-amber-50">
            <input
              className="flex-1 px-3 text-sm text-gray-600"
              placeholder={t('common.searchPlaceholder')}
            />
            <button className="w-[46px] h-full bg-[#25C3E7] flex items-center justify-center">
              <FaSearch className="text-white" size={14} />
            </button>
          </div>
          <span className="text-[#3BC8E7] ml-[35px] text-[15px]">{t('common.trendingSongs')} :</span>
          <span className="text-white ml-1 text-[15px]">Dream your moments, Until I Met You, Gim</span>
          <button
            onClick={() => navigate("/upgrade")}
            className="ml-[35px] bg-gradient-to-r from-[#3BC8E7] to-[#25C3E7] text-white px-4 py-1.5 rounded-lg text-[14px] font-semibold hover:from-[#2ba8c7] hover:to-[#1fa3c2] transition-all shadow-lg relative group"
            title="Chọn gói phù hợp với bạn và tận hưởng trải nghiệm âm nhạc không giới hạn"
          >
            {t('common.upgradePremium')}
          </button>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center space-x-6 text-white">
          {/* Logo */}
          <div className="flex items-center mr-4">
            <img
              src="/Sidebar/logo.png"
              alt="Logo"
              className="w-12 h-12 object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
              onError={(e) => {
                console.error('Logo failed to load:', e);
                // Fallback: thử các đường dẫn khác nhau
                const img = e.target as HTMLImageElement;
                const currentSrc = img.src;
                
                if (!currentSrc.includes('./Sidebar/logo.png')) {
                  img.src = './Sidebar/logo.png';
                } else if (!currentSrc.includes(window.location.origin + '/Sidebar/logo.png')) {
                  img.src = window.location.origin + '/Sidebar/logo.png';
                } else {
                  // Nếu tất cả đều fail, hiển thị placeholder text
                  img.style.display = 'none';
                  const placeholder = document.createElement('span');
                  placeholder.textContent = 'Logo';
                  placeholder.className = 'text-white text-sm font-semibold cursor-pointer';
                  placeholder.onclick = () => navigate("/");
                  img.parentElement?.appendChild(placeholder);
                }
              }}
            />
          </div>
          <LanguageDropdown />

          {/* Chưa đăng nhập */}
          {!role && (
            <>
              <button
                onClick={() => openModal("register")}
                className="bg-[#3BC8E7] w-[100px] h-[48px] rounded-2xl font-semibold"
              >
                {t('common.register')}
              </button>
              <button
                onClick={() => openModal("login")}
                className="bg-[#3BC8E7] w-[100px] h-[48px] rounded-2xl font-semibold"
              >
                {t('common.login')}
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
                  {t('common.adminPage')}
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
