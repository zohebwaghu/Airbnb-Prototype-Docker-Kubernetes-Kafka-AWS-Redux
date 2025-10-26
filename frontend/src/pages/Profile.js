import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, isOwner } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    about_me: '',
    city: '',
    country: '',
    languages: '',
    gender: '',
    location: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        about_me: user.about_me || '',
        city: user.city || '',
        country: user.country || '',
        languages: user.languages || '',
        gender: user.gender || '',
        location: user.location || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage(result.error);
      }
    } catch (error) {
      setMessage('Failed to update profile');
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="error-message">Please log in to view your profile</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        <p>Manage your account information</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            {user.profile_picture ? (
              <img src={user.profile_picture} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>

          <div className="profile-info">
            <h3>{user.name}</h3>
            <p className="user-type">{isOwner ? 'Property Owner' : 'Traveler'}</p>
            <p className="user-email">{user.email}</p>
          </div>
        </div>

        <div className="profile-form-section">
          <h3>Update Profile Information</h3>

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="about_me">About Me</label>
              <textarea
                id="about_me"
                name="about_me"
                value={formData.about_me}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter your city"
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter your country"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="languages">Languages</label>
                <input
                  type="text"
                  id="languages"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  placeholder="e.g., English, Spanish, French"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {user.user_type === 'owner' && (
              <div className="form-group">
                <label htmlFor="location">Property Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter your property location"
                />
              </div>
            )}

            <button type="submit" className="update-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
