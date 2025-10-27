import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PhotoGalleryModal from '../components/PhotoGalleryModal';
import ImageLightbox from '../components/ImageLightbox';
import './PropertyDetails.css';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isTraveler } = useAuth();

  const [property, setProperty] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
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
  const [showGallery, setShowGallery] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchProperty();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (property && isAuthenticated && isTraveler) {
      checkFavoriteStatus();
    }
  }, [property, isAuthenticated, isTraveler, id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/properties/${id}`);
      setProperty(response.data.property);
      
      // Fetch similar properties
      await fetchSimilarProperties(response.data.property.city, response.data.property.id);
    } catch (error) {
      setError('Failed to load property details');
      console.error('Error fetching property:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const favResponse = await axios.get('/users/favorites');
      const favorites = favResponse.data.favorites || [];
      setIsFavorite(favorites.some(fav => fav.id === parseInt(id)));
    } catch (error) {
      console.error('Error checking favorites:', error);
    }
  };

  const fetchSimilarProperties = async (city, propertyId) => {
    try {
      const response = await axios.get(`/properties?city=${city}&limit=4`);
      const filtered = (response.data.properties || []).filter(p => p.id !== parseInt(propertyId)).slice(0, 4);
      setSimilarProperties(filtered);
    } catch (error) {
      console.error('Error fetching similar properties:', error);
    }
  };

  const handleBookingInputChange = (e) => {
    setBookingForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      // Store property ID to save after login
      localStorage.setItem('pendingFavorite', id);
      navigate('/login', { state: { from: `/property/${id}` } });
      return;
    }

    if (!isTraveler) {
      return;
    }

    try {
      setFavoriteLoading(true);
      if (isFavorite) {
        // Remove from favorites
        await axios.delete(`/users/favorites/${id}`);
        setIsFavorite(false);
      } else {
        // Add to favorites
        await axios.post(`/users/favorites/${id}`);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Check for pending favorite after login
  useEffect(() => {
    const checkPendingFavorite = async () => {
      const pendingFavorite = localStorage.getItem('pendingFavorite');
      if (pendingFavorite && isAuthenticated && isTraveler && pendingFavorite === id) {
        localStorage.removeItem('pendingFavorite');
        try {
          await axios.post(`/users/favorites/${id}`);
          setIsFavorite(true);
        } catch (error) {
          console.error('Error saving pending favorite:', error);
        }
      }
    };
    
    if (isAuthenticated) {
      checkPendingFavorite();
    }
  }, [isAuthenticated, isTraveler, id]);

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
      const bookingData = {
        property_id: parseInt(id),
        check_in_date: bookingForm.check_in_date,
        check_out_date: bookingForm.check_out_date,
        number_of_guests: bookingForm.number_of_guests
      };
      
      // Only include special_requests if it's not empty
      if (bookingForm.special_requests && bookingForm.special_requests.trim()) {
        bookingData.special_requests = bookingForm.special_requests;
      }
      
      await axios.post('/bookings', bookingData);

      setBookingMessage('Booking request submitted successfully!');
      setTimeout(() => setBookingMessage(''), 3000);
    } catch (error) {
      setBookingMessage(error.response?.data?.error || 'Failed to submit booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="property-details-container">
        <div className="loading-spinner"><div className="spinner"></div></div>
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

  const amenitiesList = typeof property.amenities === 'string' 
    ? JSON.parse(property.amenities) 
    : property.amenities || [];

  return (
    <div className="property-details-wrapper">
      {/* Title Section */}
      <div className="property-details-header">
        <div className="header-left">
          <h1>{property.name}</h1>
          <div className="header-info">
            <span className="location-link">📍 {property.city}, {property.country}</span>
          </div>
        </div>
        {(!isAuthenticated || isTraveler) && (
          <button 
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={toggleFavorite}
            disabled={favoriteLoading}
          >
            {isFavorite ? '❤️ Saved' : '🤍 Save'}
          </button>
        )}
      </div>

      {/* Photo Gallery */}
      <div className="property-gallery-airbnb">
        {property.images && property.images.length > 0 ? (
          <>
            <div className="gallery-main-large" onClick={() => {
              setLightboxIndex(0);
              setShowLightbox(true);
            }}>
              <img src={property.images[0].image_url} alt={property.name} />
            </div>
            <div className="gallery-grid-small">
              {property.images.slice(1, 5).map((image, index) => (
                <div key={index} className="gallery-item-small" onClick={() => {
                  setLightboxIndex(index + 1);
                  setShowLightbox(true);
                }}>
                  <img src={image.image_url} alt={`${property.name} - ${image.category}`} />
                </div>
              ))}
            </div>
            <button className="view-all-photos-btn-airbnb" onClick={() => setShowGallery(true)}>
              <span>⊞</span> Show all photos
            </button>
          </>
        ) : (
          <div className="no-gallery">No Images Available</div>
        )}
      </div>

      {showGallery && (
        <PhotoGalleryModal
          property={property}
          images={property.images}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Main Content */}
      <div className="property-main-content">
        <div className="property-left-column">
          {/* Header with host */}
          <div className="property-header-section">
            <div>
              <h2>{property.property_type} in {property.city}</h2>
              <div className="property-stats-inline">
                {property.max_guests} guests · {property.bedrooms} bedroom{property.bedrooms > 1 ? 's' : ''} · {property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}
              </div>
            </div>
            <Link to={`/host/${property.owner_id}`} className="host-avatar-large">
              {property.owner_name?.charAt(0).toUpperCase()}
            </Link>
          </div>

          <hr className="divider-light" />

          {/* Description */}
          <div className="property-section">
            <p className="property-description">{property.description}</p>
          </div>

          <hr className="divider-light" />

          {/* Amenities */}
          <div className="property-section">
            <h3>What this place offers</h3>
            <div className="amenities-list">
              {amenitiesList.slice(0, 10).map((amenity, index) => (
                <div key={index} className="amenity-item">
                  <span className="amenity-icon">✓</span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
            {amenitiesList.length > 10 && (
              <button className="show-all-amenities-btn">
                Show all {amenitiesList.length} amenities
              </button>
            )}
          </div>

          <hr className="divider-light" />

          {/* Ratings and Reviews */}
          <div className="property-section">
            <div className="reviews-header">
              <h3>
                <span className="star-icon">⭐</span> 4.8 · 127 reviews
              </h3>
            </div>
            <div className="reviews-grid">
              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar">M</div>
                  <div className="reviewer-info">
                    <p className="reviewer-name">Maria</p>
                    <p className="review-date">October 2024</p>
                  </div>
                </div>
                <p className="review-text">
                  Amazing place! The location was perfect and the host was very responsive. Would definitely stay here again.
                </p>
              </div>
              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar">J</div>
                  <div className="reviewer-info">
                    <p className="reviewer-name">James</p>
                    <p className="review-date">September 2024</p>
                  </div>
                </div>
                <p className="review-text">
                  Great experience. The property was exactly as described and very clean. Highly recommend!
                </p>
              </div>
              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar">S</div>
                  <div className="reviewer-info">
                    <p className="reviewer-name">Sarah</p>
                    <p className="review-date">September 2024</p>
                  </div>
                </div>
                <p className="review-text">
                  Beautiful property with stunning views. The host provided excellent recommendations for local restaurants.
                </p>
              </div>
              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-avatar">D</div>
                  <div className="reviewer-info">
                    <p className="reviewer-name">David</p>
                    <p className="review-date">August 2024</p>
                  </div>
                </div>
                <p className="review-text">
                  Perfect spot for our vacation. Everything was as expected and check-in was seamless.
                </p>
              </div>
            </div>
          </div>

          <hr className="divider-light" />

          {/* About the Host */}
          <div className="property-section">
            <h3>Meet your host</h3>
            <Link to={`/host/${property.owner_id}`} className="host-profile-card">
              <div className="host-card-left">
                <div className="host-avatar-xl">
                  {property.owner_name?.charAt(0).toUpperCase()}
                </div>
                <div className="host-card-info">
                  <h4>{property.owner_name}</h4>
                  <p className="host-joined">Joined in 2022</p>
                </div>
              </div>
              <div className="host-card-stats">
                <p><strong>124</strong> Reviews</p>
                <p><span className="star-icon">⭐</span> <strong>4.8</strong> Rating</p>
                <p><strong>3</strong> Years hosting</p>
              </div>
            </Link>
            <div className="host-description">
              <p>During your stay</p>
              <p className="host-bio">
                {property.owner_name} is a Superhost. Superhosts are experienced, highly rated hosts who are committed to providing great stays for guests.
              </p>
              <p className="host-contact">Contact: {property.owner_email}</p>
              <button className="contact-host-btn">Message host</button>
            </div>
          </div>

          <hr className="divider-light" />

          {/* Things to Know */}
          <div className="property-section">
            <h3>Things to know</h3>
            <div className="things-to-know-grid">
              <div className="know-section">
                <h4>House rules</h4>
                <ul className="know-list">
                  <li>Check-in: 3:00 PM - 10:00 PM</li>
                  <li>Checkout before 11:00 AM</li>
                  <li>Maximum {property.max_guests} guests</li>
                  <li>No pets allowed</li>
                  <li>No smoking</li>
                </ul>
              </div>
              <div className="know-section">
                <h4>Safety & property</h4>
                <ul className="know-list">
                  <li>Smoke alarm installed</li>
                  <li>Carbon monoxide alarm</li>
                  <li>Fire extinguisher</li>
                  <li>First aid kit</li>
                  <li>Pool/hot tub without a gate or lock</li>
                </ul>
              </div>
              <div className="know-section">
                <h4>Cancellation policy</h4>
                <ul className="know-list">
                  <li>Free cancellation for 48 hours</li>
                  <li>Cancel before check-in for a partial refund</li>
                  <li>Review the full cancellation policy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Card */}
        <div className="property-right-column">
          <div className="booking-card-sticky">
            <div className="booking-card-header">
              <div className="price-display">
                <span className="price-amount">${property.base_price}</span>
                <span className="price-unit">night</span>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit} className="booking-form-card">
              <div className="booking-inputs-grid">
                <div className="booking-input-item">
                  <label>CHECK-IN</label>
                  <input
                    type="date"
                    name="check_in_date"
                    value={bookingForm.check_in_date}
                    onChange={handleBookingInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    max={bookingForm.check_out_date || undefined}
                    required
                  />
                </div>
                <div className="booking-input-item">
                  <label>CHECKOUT</label>
                  <input
                    type="date"
                    name="check_out_date"
                    value={bookingForm.check_out_date}
                    onChange={handleBookingInputChange}
                    min={bookingForm.check_in_date || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="booking-input-item full-width">
                <label>GUESTS</label>
                <select
                  name="number_of_guests"
                  value={bookingForm.number_of_guests}
                  onChange={handleBookingInputChange}
                  required
                >
                  {[...Array(property.max_guests).keys()].map(i => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} guest{i > 0 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="reserve-btn" disabled={bookingLoading}>
                {bookingLoading ? 'Processing...' : 'Reserve'}
              </button>

              {bookingMessage && (
                <div className={`booking-message ${bookingMessage.includes('success') ? 'success' : 'error'}`}>
                  {bookingMessage}
                </div>
              )}

              <p className="no-charge-text">You won't be charged yet</p>

              {calculateNights() > 0 && (
                <div className="price-breakdown">
                  <div className="price-row">
                    <span>${property.base_price} x {calculateNights()} nights</span>
                    <span>${(toNum(property.base_price) * calculateNights()).toFixed(2)}</span>
                  </div>
                  <div className="price-row">
                    <span>Cleaning fee</span>
                    <span>${toNum(property.cleaning_fee).toFixed(2)}</span>
                  </div>
                  <div className="price-row">
                    <span>Service fee</span>
                    <span>${toNum(property.service_fee).toFixed(2)}</span>
                  </div>
                  <hr className="divider-light" />
                  <div className="price-row total">
                    <span>Total</span>
                    <span>${calculateTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Similar Listings */}
      {similarProperties.length > 0 && (
        <div className="similar-listings-section">
          <h2>Explore other options in {property.city}</h2>
          <div className="similar-listings-grid">
            {similarProperties.map(similar => (
              <Link key={similar.id} to={`/property/${similar.id}`} className="similar-property-card">
                <div className="similar-property-image">
                  <img src={similar.primary_image} alt={similar.name} />
                </div>
                <div className="similar-property-info">
                  <p className="similar-property-location">{similar.city}, {similar.country}</p>
                  <p className="similar-property-name">{similar.name}</p>
                  <p className="similar-property-price">
                    <strong>${similar.base_price}</strong> night
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {showLightbox && property.images && (
        <ImageLightbox
          images={property.images}
          initialIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
};

export default PropertyDetails;

