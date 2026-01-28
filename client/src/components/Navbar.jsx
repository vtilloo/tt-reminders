import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">TT Reminders</Link>
        <div className="navbar-links">
          {user ? (
            <>
              <Link to="/dashboard">Classes</Link>
              <Link to="/analytics">Analytics</Link>
              <Link to="/settings">Settings</Link>
              {user.is_admin ? <Link to="/admin">Admin</Link> : null}
              <button onClick={handleLogout} className="btn btn-outline btn-small">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-small">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
