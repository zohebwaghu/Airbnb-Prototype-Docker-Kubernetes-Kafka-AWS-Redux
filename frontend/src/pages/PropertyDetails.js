import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './PropertyDetails.css';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isTraveler } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingForm, setBookingForm] = useState({
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    special_requests: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/properties/${id}`);
      setProperty(response.data.property);
    } catch (error) {
      setError('Failed to load property details');
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingInputChange = (e) => {
    setBookingForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isTraveler) {
      setBookingMessage('Only travelers can make bookings');
      return;
    }

    try {
      setBookingLoading(true);
      const response = await axios.post('/bookings', {
        property_id: parseInt(id),
        ...bookingForm
      });

      setBookingMessage('Booking request submitted successfully!');
      setBookingForm({
        check_in_date: '',
        check_out_date: '',
        number_of_guests: 1,
        special_requests: ''
      });
    } catch (error) {
      setBookingMessage(error.response?.data?.error || 'Failed to submit booking');
      console.error('Error creating booking:', error);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="property-details-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="property-details-container">
        <div className="error-message">
          {error || 'Property not found'}
        </div>
      </div>
    );
  }

  const calculateNights = () => {
    if (!bookingForm.check_in_date || !bookingForm.check_out_date) return 0;
    const checkIn = new Date(bookingForm.check_in_date);
    const checkOut = new Date(bookingForm.check_out_date);
    const diffTime = Math.abs(checkOut - checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const toNum = (v) => typeof v === 'number' ? v : parseFloat(v || 0);

  const calculateTotalPrice = () => {
    const nights = calculateNights();
    const base = toNum(property.base_price);
    const cleaning = toNum(property.cleaning_fee);
    const service = toNum(property.service_fee);
    return (base * nights) + cleaning + service;
  };

  return (
    <div className="property-details-container">
      <div className="property-gallery">
        <div className="main-image">
          {property.images && property.images.length > 0 ? (
            <img src={property.images[0]} alt={property.name} />
          ) : (
            <div className="no-image">No Image Available</div>
          )}
        </div>
      </div>

      <div className="property-content">
        <div className="property-header">
          <div className="property-title">
            <h1>{property.name}</h1>
            <p className="property-location">{property.location}</p>
            <p className="property-type">🏠 {property.property_type}</p>
          </div>

          <div className="host-info">
            <p><strong>Hosted by:</strong> {property.owner_name}</p>
            <p><strong>Contact:</strong> {property.owner_email}</p>
          </div>
        </div>

        <div className="property-details-grid">
          <div className="property-info">
            <h3>About this property</h3>
            <p>{property.description}</p>

            <div className="property-features">
              <h4>Features</h4>
              <div className="features-grid">
                <div className="feature-item">
                  <span className="feature-icon">🛏️</span>
                  <span>{property.bedrooms} Bedrooms</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🚿</span>
                  <span>{property.bathrooms} Bathrooms</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">👥</span>
                  <span>Up to {property.max_guests} guests</span>
                </div>
              </div>
            </div>

            {property.amenities && (
              <div className="amenities">
                <h4>Amenities</h4>
                <div className="amenities-list">
                  {Array.isArray(property.amenities) ? (
                    property.amenities.map((amenity, index) => (
                      <span key={index} className="amenity-tag">{amenity}</span>
                    ))
                  ) : (
                    <span className="amenity-tag">Amenities information not available</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="booking-section">
            <div className="booking-card">
              <h3>Book this property</h3>
              <div className="price-info">
                <p className="price-per-night">
                  <strong>${property.base_price}</strong> per night
                </p>
                {bookingForm.check_in_date && bookingForm.check_out_date && (
                  <div className="booking-summary">
                    <p>{calculateNights()} nights × ${property.base_price} = ${(property.base_price * calculateNights()).toFixed(2)}</p>
                    <p>Cleaning fee: ${property.cleaning_fee}</p>
                    <p>Service fee: ${property.service_fee}</p>
                    <p className="total-price"><strong>Total: ${calculateTotalPrice().toFixed(2)}</strong></p>
                  </div>
                )}
              </div>

              <form onSubmit={handleBookingSubmit} className="booking-form">
                <div className="form-group">
                  <label>Check-in Date</label>
                  <input
                    type="date"
                    name="check_in_date"
                    value={bookingForm.check_in_date}
                    onChange={handleBookingInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Check-out Date</label>
                  <input
                    type="date"
                    name="check_out_date"
                    value={bookingForm.check_out_date}
                    onChange={handleBookingInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Number of Guests</label>
                  <select
                    name="number_of_guests"
                    value={bookingForm.number_of_guests}
                    onChange={handleBookingInputChange}
                    required
                  >
                    {Array.from({ length: property.max_guests }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Special Requests (Optional)</label>
                  <textarea
                    name="special_requests"
                    value={bookingForm.special_requests}
                    onChange={handleBookingInputChange}
                    placeholder="Any special requests or requirements..."
                    rows="3"
                  />
                </div>

                {bookingMessage && (
                  <div className={`booking-message ${bookingMessage.includes('success') ? 'success' : 'error'}`}>
                    {bookingMessage}
                  </div>
                )}

                <button type="submit" className="book-btn" disabled={bookingLoading}>
                  {bookingLoading ? 'Submitting Booking...' : 'Request to Book'}
                </button>

                {!isAuthenticated && (
                  <p className="login-prompt">
                    <a href="/login">Log in</a> or <a href="/signup">sign up</a> to book this property
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
