import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Bookings.css';

const Bookings = () => {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, accepted, cancelled

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/users/bookings');
      setBookings(response.data.bookings || []);
    } catch (error) {
      setError('Failed to load bookings');
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await axios.post(`/bookings/${bookingId}/cancel`);
      // Refresh bookings
      fetchBookings();
    } catch (error) {
      setError('Failed to cancel booking');
      console.error('Error canceling booking:', error);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', text: 'Pending' },
      accepted: { class: 'status-accepted', text: 'Accepted' },
      cancelled: { class: 'status-cancelled', text: 'Cancelled' },
      completed: { class: 'status-completed', text: 'Completed' }
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
      <div className="bookings-container">
        <div className="error-message">Please log in to view your bookings</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bookings-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="bookings-container">
      <div className="bookings-header">
        <h2>My Bookings</h2>
        <p>Manage your reservations and travel plans</p>
      </div>

      <div className="bookings-filters">
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All Bookings
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={filter === 'accepted' ? 'active' : ''}
            onClick={() => setFilter('accepted')}
          >
            Accepted
          </button>
          <button
            className={filter === 'cancelled' ? 'active' : ''}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="bookings-list">
        {filteredBookings.length === 0 ? (
          <div className="no-bookings">
            <h3>No bookings found</h3>
            <p>
              {filter === 'all'
                ? "You haven't made any bookings yet"
                : `No ${filter} bookings found`}
            </p>
          </div>
        ) : (
          filteredBookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-property">
                  <h3>{booking.property_name}</h3>
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
                  <p><strong>Guests:</strong> {booking.number_of_guests}</p>
                  <p><strong>Total Price:</strong> ${booking.total_price}</p>
                  {booking.special_requests && (
                    <p><strong>Special Requests:</strong> {booking.special_requests}</p>
                  )}
                </div>

                <div className="booking-actions">
                  {booking.status === 'pending' && (
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel Booking
                    </button>
                  )}

                  {booking.status === 'accepted' && (
                    <div className="accepted-message">
                      <p>✅ Your booking has been accepted!</p>
                      <p>Contact the host for check-in details</p>
                    </div>
                  )}

                  {booking.status === 'cancelled' && (
                    <div className="cancelled-message">
                      <p>❌ This booking has been cancelled</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="booking-footer">
                <p className="booking-date">
                  Booked on: {formatDate(booking.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Bookings;
