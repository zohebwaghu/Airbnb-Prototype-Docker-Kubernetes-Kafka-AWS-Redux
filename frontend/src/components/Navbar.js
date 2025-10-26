import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ onAIAgentToggle }) => {
  const { user, logout, isAuthenticated, isTraveler, isOwner } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🏠</span>
          Airbnb Clone
        </Link>

        <div className="navbar-menu">
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/properties" className="navbar-link">Properties</Link>

          {isAuthenticated ? (
            <>
              <Link to="/bookings" className="navbar-link">Bookings</Link>
              {isTraveler && <Link to="/favorites" className="navbar-link">Favorites</Link>}
              {isOwner && <Link to="/owner/dashboard" className="navbar-link">Dashboard</Link>}
              <Link to="/profile" className="navbar-link">Profile</Link>

              <button className="ai-agent-btn" onClick={onAIAgentToggle}>
                🤖 AI Agent
              </button>

              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/signup" className="signup-btn">Sign Up</Link>
            </>
          )}
        </div>

        <div className="mobile-menu-toggle">
          <span>☰</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
