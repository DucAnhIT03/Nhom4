import { useState, useEffect, useCallback } from "react"; // Thêm useEffect và useCallback
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCopy,
  FaMicrophone,
  FaBriefcase,
  FaGem,
  FaDownload,
  FaHeart,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaFolderOpen, // Icon cho "Đăng tải của tôi"
} from "react-icons/fa";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState("user"); // State lưu role
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);

  // 2. Lấy role từ localStorage và refresh từ API
  // Hàm load role từ API - sử dụng useCallback để tránh re-create function
  const loadRoleFromAPI = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserRole("user");
      return;
    }

    try {
      const { getCurrentUser } = await import("../../services/auth.service");
      const userProfile = await getCurrentUser();
      if (userProfile.role) {
        // Normalize role: loại bỏ "ROLE_" prefix và chuyển về lowercase
        const normalizedRole = userProfile.role.replace(/^ROLE_/i, "").toLowerCase();
        setUserRole(normalizedRole);
        localStorage.setItem("role", normalizedRole);
      }
    } catch (err) {
      console.warn("Không thể lấy role từ API:", err);
      // Giữ nguyên role từ localStorage nếu API lỗi
      const storedRole = localStorage.getItem("role");
      if (storedRole) {
        const normalizedRole = storedRole.replace(/^ROLE_/i, "").toLowerCase();
        setUserRole(normalizedRole);
      }
    }
  }, []); // Empty dependency array vì function không phụ thuộc vào props/state

  useEffect(() => {
    // Lấy role từ localStorage trước (để hiển thị nhanh)
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      // Normalize role: loại bỏ "ROLE_" prefix và chuyển về lowercase
      const normalizedRole = storedRole.replace(/^ROLE_/i, "").toLowerCase();
      setUserRole(normalizedRole);
    }

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

    // Cleanup
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadRoleFromAPI]); // Thêm loadRoleFromAPI vào dependency array

  const menuItems = [
    { icon: <FaHome />, label: "Discover", path: "/" },
    { icon: <FaCopy />, label: "Albums", path: "/album" },
    { icon: <FaMicrophone />, label: "Artists", path: "/artists" },
    { icon: <FaBriefcase />, label: "Genres", path: "/genres" },
    { icon: <FaGem />, label: "Top Tracks", path: "/toptracks" },
  ];

  const bottomItems = [
    { icon: <FaDownload />, label: "Downloads", path: "/dowload" },
    { icon: <FaHeart />, label: "Favourites", path: "/favorite" },
    { icon: <FaClock />, label: "History", path: "/history" },
  ];

  // 3. Tạo danh sách items cuối cùng dựa trên role
  // Nếu là artist, chèn thêm nút "Đăng tải của tôi"
  let finalMenuItems = [...menuItems];
  
  // Normalize userRole để đảm bảo so sánh đúng
  const normalizedRole = userRole?.replace(/^ROLE_/i, "").toLowerCase();
  
  if (normalizedRole === "artist") {
    finalMenuItems.push({
      icon: <FaFolderOpen className="text-cyan-400" />, // Icon cho "Đăng tải của tôi"
      label: "Đăng tải của tôi",
      path: "/artist/dashboard?tab=my-content", // Link trực tiếp đến tab "Đăng tải của tôi"
    });
  }

  // Gộp với bottomItems (hoặc tách riêng tùy thiết kế)
  const allItems = [...finalMenuItems, ...bottomItems];

  return (
    <div
      className={`${
        isOpen ? "w-56" : "w-20"
      } h-[591px] bg-[#1B2039] mt-[-80px] transition-all duration-300 relative flex flex-col justify-between`}
    >
      {/* Toggle Arrow */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[293px] bg-[#1B2039] text-white rounded-full p-1 z-10"
      >
        {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      {/* Logo */}
      <div className="flex flex-col items-center mt-[40px]">
        <img
          src="./Sidebar/logo.png"
          alt="Logo"
          className="w-[78px] h-[78px]"
        />
        {isOpen && (
          <p className="text-white text-sm font-semibold mt-2">The Miraculous</p>
        )}
      </div>

      {/* Main Menu */}
      {/* Thêm overflow-y-auto để nếu menu dài quá thì cuộn được */}
      <nav className="flex flex-col gap-3 mb-[20px] overflow-y-auto no-scrollbar">
        {allItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            // Thêm điều kiện logic style: Nếu là Dashboard thì background khác một chút để nổi bật
            className="flex items-center gap-3 w-full px-5 py-2 text-white transition-colors duration-200 hover:bg-[#2CC8E5]"
          >
            <span className="text-lg">{item.icon}</span>
            {isOpen && <span className="text-sm whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;