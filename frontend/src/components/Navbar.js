import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ onAIAgentToggle }) => {
  const { user, logout, isAuthenticated, isTraveler, isOwner } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

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

            <div className="navbar-profile" ref={dropdownRef}>
              <button 
                type="button"
                className="profile-btn" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('CLICKED HAMBURGER!!!');
                  setShowDropdown(prev => {
                    console.log('Toggling dropdown from', prev, 'to', !prev);
                    return !prev;
                  });
                }}
                style={{
                  cursor: 'pointer',
                  zIndex: 1000
                }}
              >
                <span className="menu-icon" style={{ pointerEvents: 'none' }}>☰</span>
                <div className="profile-icon" style={{ pointerEvents: 'none' }}>
                  {user ? user.name?.charAt(0).toUpperCase() : '👤'}
                </div>
              </button>

              {showDropdown && (
                <div className="dropdown-menu">
                  {isAuthenticated ? (
                    <>
                      {isTraveler && (
                        <>
                          <Link to="/favorites" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                            Favorites
                          </Link>
                          <Link to="/bookings" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                            Trips
                          </Link>
                        </>
                      )}
                              {isOwner && (
                                <>
                                  <Link to="/owner/dashboard" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                    My Properties
                                  </Link>
                                  <Link to="/bookings" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                    Booking Requests
                                  </Link>
                                </>
                              )}
                      <div className="dropdown-divider"></div>
                      <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                        Account Settings
                      </Link>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item" onClick={handleLogout}>
                        Log out
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

      {isAuthenticated && isTraveler && (
        <button className="ai-agent-btn" onClick={onAIAgentToggle} title="AI Travel Assistant">
          🤖
        </button>
      )}
    </>
  );
};

export default Navbar;
