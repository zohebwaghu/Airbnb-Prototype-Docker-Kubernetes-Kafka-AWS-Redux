import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './HostProfile.css';

const HostProfile = () => {
  const { id } = useParams();
  const [host, setHost] = useState(null);
  const [hostProperties, setHostProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHostData();
  }, [id]);

  const fetchHostData = async () => {
    try {
      setLoading(true);
      // Fetch host details
      const hostResponse = await axios.get(`/users/${id}`);
      setHost(hostResponse.data.user);

      // Fetch host's properties
      const propertiesResponse = await axios.get(`/properties?owner_id=${id}`);
      setHostProperties(propertiesResponse.data.properties || []);
    } catch (error) {
      setError('Failed to load host profile');
      console.error('Error fetching host data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="host-profile-container">
        <div className="loading-spinner"><div className="spinner"></div></div>
      </div>
    );
  }

  if (error || !host) {
    return (
      <div className="host-profile-container">
        <div className="error-message">{error || 'Host not found'}</div>
      </div>
    );
  }

  return (
    <div className="host-profile-wrapper">
      {/* Host Header */}
      <div className="host-profile-header">
        <div className="host-profile-avatar-section">
          <div className="host-profile-avatar-xl">
            {host.name?.charAt(0).toUpperCase()}
          </div>
          <div className="host-profile-info">
            <h1>{host.name}</h1>
            <p className="host-superhost-badge">⭐ Superhost</p>
          </div>
        </div>
      </div>

      {/* Host Stats */}
      <div className="host-stats-section">
        <div className="host-stat-item">
          <div className="stat-number">124</div>
          <div className="stat-label">Reviews</div>
        </div>
        <div className="stat-divider"></div>
        <div className="host-stat-item">
          <div className="stat-number">4.8 ⭐</div>
          <div className="stat-label">Rating</div>
        </div>
        <div className="stat-divider"></div>
        <div className="host-stat-item">
          <div className="stat-number">3</div>
          <div className="stat-label">Years hosting</div>
        </div>
      </div>

      <div className="host-content-grid">
        <div className="host-left-column">
          {/* About Host */}
          <div className="host-section">
            <h2>About {host.name}</h2>
            <div className="host-details">
              <p className="host-detail-item">
                <span className="detail-icon">📍</span>
                <span>Lives in {host.city}, {host.country}</span>
              </p>
              <p className="host-detail-item">
                <span className="detail-icon">💬</span>
                <span>Speaks English</span>
              </p>
              <p className="host-detail-item">
                <span className="detail-icon">⏱️</span>
                <span>Response rate: 100%</span>
              </p>
              <p className="host-detail-item">
                <span className="detail-icon">✉️</span>
                <span>Response time: within an hour</span>
              </p>
            </div>
          </div>

          {/* Host Bio */}
          <div className="host-section">
            <h3>More about {host.name}</h3>
            <p className="host-bio-text">
              {host.name} is a Superhost. Superhosts are experienced, highly rated hosts who are committed to providing great stays for guests. 
              They have excellent communication skills, are responsive to inquiries, and always strive to make their guests feel welcome.
            </p>
          </div>

          {/* Host Reviews */}
          <div className="host-section">
            <h2>Reviews about {host.name}</h2>
            <div className="host-reviews-grid">
              <div className="host-review-card">
                <div className="review-header">
                  <div className="reviewer-avatar">A</div>
                  <div className="reviewer-info">
                    <p className="reviewer-name">Alex</p>
                    <p className="review-date">November 2024</p>
                  </div>
                </div>
                <p className="review-text">
                  {host.name} was an amazing host! Very responsive and helpful with all our questions. The place was exactly as described.
                </p>
              </div>
              <div className="host-review-card">
                <div className="review-header">
                  <div className="reviewer-avatar">L</div>
                  <div className="reviewer-info">
                    <p className="reviewer-name">Lisa</p>
                    <p className="review-date">October 2024</p>
                  </div>
                </div>
                <p className="review-text">
                  Great host! Made us feel very welcome and provided excellent local recommendations. Would definitely stay again.
                </p>
              </div>
              <div className="host-review-card">
                <div className="review-header">
                  <div className="reviewer-avatar">R</div>
                  <div className="reviewer-info">
                    <p className="reviewer-name">Robert</p>
                    <p className="review-date">September 2024</p>
                  </div>
                </div>
                <p className="review-text">
                  Excellent communication and a wonderful property. {host.name} went above and beyond to ensure our stay was perfect.
                </p>
              </div>
            </div>
            <button className="show-all-reviews-btn">Show all reviews</button>
          </div>
        </div>

        <div className="host-right-column">
          {/* Contact Card */}
          <div className="host-contact-card">
            <h3>Contact {host.name}</h3>
            <p className="contact-info">
              <span className="detail-icon">📧</span>
              {host.email}
            </p>
            {host.phone && (
              <p className="contact-info">
                <span className="detail-icon">📱</span>
                {host.phone}
              </p>
            )}
            <button className="contact-host-btn-large">Message Host</button>
            <p className="contact-note">
              To protect your payment, never transfer money or communicate outside of the Airbnb website or app.
            </p>
          </div>
        </div>
      </div>

      {/* Host's Listings */}
      {hostProperties.length > 0 && (
        <div className="host-listings-section">
          <h2>{host.name}'s listings</h2>
          <div className="host-listings-grid">
            {hostProperties.map(property => (
              <Link key={property.id} to={`/property/${property.id}`} className="host-listing-card">
                <div className="listing-image">
                  <img src={property.primary_image} alt={property.name} />
                </div>
                <div className="listing-info">
                  <p className="listing-location">{property.city}, {property.country}</p>
                  <p className="listing-name">{property.name}</p>
                  <p className="listing-price">
                    <strong>${property.base_price}</strong> night
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HostProfile;

