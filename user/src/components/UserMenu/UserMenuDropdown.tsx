import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gem } from "lucide-react";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import { isUserPremium } from "../../services/subscription.service";

interface UserMenuDropdownProps {
  avatar: string;
  userName?: string;
  onLogout: () => void;
}

const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  avatar,
  userName,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkPremium = async () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const premium = await isUserPremium(parseInt(userId));
        setIsPremium(premium);
      }
    };
    checkPremium();
    
    // Refresh premium status mỗi 30 giây
    const interval = setInterval(checkPremium, 30000);
    return () => clearInterval(interval);
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative z-[10000]" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="focus:outline-none flex items-center gap-2"
        >
          <img
            src={avatar}
            className="w-10 h-10 rounded-full border-2 border-white cursor-pointer hover:border-[#3BC8E7] transition-colors"
            alt="avatar"
          />
          {isPremium && (
            <Gem className="w-5 h-5 text-[#3BC8E7] flex-shrink-0" />
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] rounded-lg shadow-xl border border-[#3BC8E7]/20 z-[10000] overflow-hidden">
            <div className="py-2">
              {userName && (
                <div className="px-4 py-2 border-b border-[#3BC8E7]/20">
                  <p className="text-white font-semibold text-sm">{userName}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {localStorage.getItem("email") || ""}
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setShowEditProfile(true);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-[#3BC8E7]/10 transition-colors flex items-center gap-3"
              >
                <svg
                  className="w-5 h-5 text-[#3BC8E7]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Chỉnh sửa thông tin</span>
              </button>

              <button
                onClick={() => {
                  setShowChangePassword(true);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-[#3BC8E7]/10 transition-colors flex items-center gap-3"
              >
                <svg
                  className="w-5 h-5 text-[#3BC8E7]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                <span>Đổi mật khẩu</span>
              </button>

              <button
                onClick={() => {
                  navigate("/upgrade");
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-white hover:bg-[#3BC8E7]/10 transition-colors flex items-center gap-3"
              >
                <svg
                  className="w-5 h-5 text-[#3BC8E7]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Nâng cấp tài khoản</span>
              </button>

              <div className="border-t border-[#3BC8E7]/20 my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showEditProfile && (
        <EditProfileModal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </>
  );
};

export default UserMenuDropdown;

