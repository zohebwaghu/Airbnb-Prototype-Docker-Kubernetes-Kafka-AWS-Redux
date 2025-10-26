import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
  const { user, isAuthenticated, isOwner } = useAuth();
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('properties');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user.user_type === 'owner') {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProperties(),
        fetchBookings()
      ]);
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/properties/owner/properties');
      setProperties(response.data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/users/bookings');
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await axios.put(`/bookings/${bookingId}/status`, { status: 'accepted' });
      fetchBookings(); // Refresh bookings
    } catch (error) {
      setError('Failed to accept booking');
      console.error('Error accepting booking:', error);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await axios.post(`/bookings/${bookingId}/cancel`);
      fetchBookings(); // Refresh bookings
    } catch (error) {
      setError('Failed to cancel booking');
      console.error('Error canceling booking:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', text: 'Pending' },
      accepted: { class: 'status-accepted', text: 'Accepted' },
      cancelled: { class: 'status-cancelled', text: 'Cancelled' }
    };

    const config = statusConfig[status] || { class: 'status-unknown', text: status };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="owner-dashboard-container">
        <div className="error-message">Please log in to view your dashboard</div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="owner-dashboard-container">
        <div className="error-message">Only property owners can access this dashboard</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="owner-dashboard-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="owner-dashboard-container">
      <div className="dashboard-header">
        <h2>Owner Dashboard</h2>
        <p>Welcome back, {user.name}! Manage your properties and bookings.</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'properties' ? 'active' : ''}
          onClick={() => setActiveTab('properties')}
        >
          My Properties ({properties.length})
        </button>
        <button
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => setActiveTab('bookings')}
        >
          Booking Requests ({bookings.filter(b => b.status === 'pending').length})
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeTab === 'properties' && (
        <div className="properties-section">
          <div className="section-header">
            <h3>My Properties</h3>
            <Link to="/owner/add-property" className="add-property-btn">
              + Add New Property
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="no-properties">
              <h4>You haven't listed any properties yet</h4>
              <p>Start by adding your first property to begin hosting</p>
              <Link to="/owner/add-property" className="primary-btn">
                Add Your First Property
              </Link>
            </div>
          ) : (
            <div className="properties-grid">
              {properties.map(property => (
                <div key={property.id} className="property-card">
                  <div className="property-image">
                    {property.primary_image ? (
                      <img src={property.primary_image.startsWith('/uploads') ? property.primary_image : `/uploads/${property.primary_image.replace(/^\/+/, '')}`} alt={property.name} />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>

                  <div className="property-info">
                    <h4>{property.name}</h4>
                    <p className="property-location">{property.city}, {property.country}</p>
                    <p className="property-type">{property.property_type}</p>
                    <p className="property-price">${property.base_price}/night</p>

                    <div className="property-actions">
                      <Link to={`/property/${property.id}`} className="view-btn">
                        View
                      </Link>
                      <button className="edit-btn">Edit</button>
                      <button className="delete-btn">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bookings-section">
          <div className="section-header">
            <h3>Booking Requests</h3>
          </div>

          {bookings.length === 0 ? (
            <div className="no-bookings">
              <h4>No booking requests yet</h4>
              <p>When travelers request to book your properties, they'll appear here</p>
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <div className="booking-property">
                      <h4>{booking.property_name}</h4>
                      <p className="booking-location">{booking.property_location}</p>
                      <p className="booking-dates">
                        {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                      </p>
                    </div>

                    <div className="booking-status">
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>

                  <div className="booking-details">
                    <div className="booking-info">
                      <p><strong>Guest:</strong> {booking.traveler_name}</p>
                      <p><strong>Guests:</strong> {booking.number_of_guests}</p>
                      <p><strong>Total:</strong> ${booking.total_price}</p>
                      {booking.special_requests && (
                        <p><strong>Requests:</strong> {booking.special_requests}</p>
                      )}
                    </div>

                    {booking.status === 'pending' && (
                      <div className="booking-actions">
                        <button
                          className="accept-btn"
                          onClick={() => handleAcceptBooking(booking.id)}
                        >
                          Accept
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {booking.status === 'accepted' && (
                      <div className="accepted-message">
                        <p>✅ Booking accepted</p>
                        <p>Contact guest for check-in details</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
