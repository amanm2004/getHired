import { FaFileAlt, FaMagic, FaSearch, FaSignOutAlt, FaUser } from "react-icons/fa";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Sidebar() {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/signin");
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link to="/" className="logo">
        GetHired
      </Link>

      {/* Navigation */}
      <nav>
        <NavLink to="/job-search" className="nav-link">
          <FaSearch className="icon" /> Job Search
        </NavLink>
        <NavLink to="/resume-builder" className="nav-link">
          <FaFileAlt className="icon" /> Resume Builder
        </NavLink>
        <NavLink to="/resume-analyzer" className="nav-link">
          <FaMagic className="icon" /> Resume Analyzer
        </NavLink>
      </nav>

      {/* User Info Section */}
      <div className="sidebar-footer">
        {isAuthenticated && user ? (
          <div className="user-info">
            <div className="user-details">
              <div className="user-avatar">
                <FaUser />
              </div>
              <div className="user-text">
                <p className="user-name">{user.full_name}</p>
                <p className="user-email">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Sign Out">
              <FaSignOutAlt />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/signin" className="auth-link">Sign In</Link>
            <span className="auth-divider">|</span>
            <Link to="/signup" className="auth-link">Sign Up</Link>
          </div>
        )}
      </div>
    </aside>
  );
}