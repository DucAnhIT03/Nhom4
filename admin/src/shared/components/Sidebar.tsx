import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Music,
  Disc,
  Tag,
  Album,
  Image,
  CreditCard,
  Mail,
  LogOut
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Quản lý người dùng', path: '/dashboard/users', hasArrow: true },
    { icon: Music, label: 'Quản lý nghệ sĩ', path: '/dashboard/artists', hasArrow: true },
    { icon: Album, label: 'Quản lý album', path: '/dashboard/albums', hasArrow: true },
    { icon: Disc, label: 'Quản lý bài hát', path: '/dashboard/songs', hasArrow: true },
    { icon: Tag, label: 'Quản lý thể loại', path: '/dashboard/genres', hasArrow: true },
    { icon: Image, label: 'Quản lý banner', path: '/dashboard/banners', hasArrow: true },
    { icon: CreditCard, label: 'Quản lý giá Premium', path: '/dashboard/subscription-plans', hasArrow: true },
    { icon: Mail, label: 'Quản lý Mail', path: '/dashboard/mail', hasArrow: true },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">M</div>
          <span className="logo-text">MUSIC ADMIN</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="nav-icon" size={20} />
              <span className="nav-label">{item.label}</span>
              {item.hasArrow && (
                <span className="nav-arrow">›</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="nav-item logout-btn">
          <LogOut className="nav-icon" size={20} />
          <span className="nav-label">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

