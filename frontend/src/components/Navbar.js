import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ onAIAgentToggle }) => {
  const { user, logout, isAuthenticated, isTraveler, isOwner } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowDropdown(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            airbnb
          </Link>

          <div className="navbar-search" onClick={() => navigate('/properties')}>
            <input type="text" placeholder="Start your search" readOnly />
            <div className="search-icon">
              🔍
            </div>
          </div>

          <div className="navbar-menu">
            {isOwner && (
              <Link to="/owner/add-property" className="navbar-link">
                List your property
              </Link>
            )}

            <div className="navbar-profile" onClick={() => setShowDropdown(!showDropdown)}>
              <span className="menu-icon">☰</span>
              <div className="profile-icon">
                {user ? user.name?.charAt(0).toUpperCase() : '👤'}
              </div>

              {showDropdown && (
                <div className="dropdown-menu">
                  {isAuthenticated ? (
                    <>
                      <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                        Profile
                      </Link>
                      <Link to="/bookings" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                        My Bookings
                      </Link>
                      {isTraveler && (
                        <Link to="/favorites" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                          Favorites
                        </Link>
                      )}
                      {isOwner && (
                        <Link to="/owner/dashboard" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                          Dashboard
                        </Link>
                      )}
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item" onClick={handleLogout}>
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/signup" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                        Sign up
                      </Link>
                      <Link to="/login" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                        Log in
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {isAuthenticated && (
        <button className="ai-agent-btn" onClick={onAIAgentToggle} title="AI Travel Assistant">
          🤖
        </button>
      )}
    </>
  );
};

export default Navbar;
