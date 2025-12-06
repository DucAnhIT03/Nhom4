import { useState, useEffect } from "react"; // Thêm useEffect để lấy role khi component mount
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
  FaTachometerAlt, // 1. Import icon cho Dashboard
} from "react-icons/fa";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState("user"); // State lưu role
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);

  // 2. Giả lập lấy role từ localStorage (hoặc bạn thay bằng Context/Redux)
  useEffect(() => {
    // Ví dụ: Lấy item 'role' đã lưu khi đăng nhập
    const role = localStorage.getItem("role"); 
    // Nếu không có thì mặc định là user, nếu có thì set vào state
    if (role) setUserRole(role);
  }, []);

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
  // Nếu là artist, chèn thêm nút Dashboard vào trước hoặc sau các mục khác
  let finalMenuItems = [...menuItems];
  
  if (userRole === "artist") {
    finalMenuItems.push({
      icon: <FaTachometerAlt className="text-yellow-400" />, // Highlight icon một chút
      label: "Artist Dashboard",
      path: "/artist/dashboard",
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
            className={`flex items-center gap-3 w-full px-5 py-2 text-white transition-colors duration-200 
              ${item.label === "Artist Dashboard" ? "hover:bg-[#E52C2C] bg-[#3a4063]" : "hover:bg-[#2CC8E5]"}
            `}
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