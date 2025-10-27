import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Favorites.css';

const Favorites = () => {
  const { user, isAuthenticated, isTraveler } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && isTraveler) {
      fetchFavorites();
    } else if (isAuthenticated && !isTraveler) {
      setLoading(false);
    }
  }, [isAuthenticated, isTraveler]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/users/favorites');
      setFavorites(response.data.favorites || []);
    } catch (error) {
      setError('Failed to load favorites');
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (propertyId) => {
    if (!window.confirm('Remove this property from your favorites?')) {
      return;
    }

    try {
      await axios.delete(`/users/favorites/${propertyId}`);
      // Refresh favorites
      fetchFavorites();
    } catch (error) {
      setError('Failed to remove favorite');
      console.error('Error removing favorite:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="favorites-container">
        <div className="error-message">Please log in to view your favorites</div>
      </div>
    );
  }

  if (!isTraveler) {
    return (
      <div className="favorites-container">
        <div className="error-message">Only travelers can have favorites</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="favorites-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <h2>My Favorite Properties</h2>
        <p>Properties you've saved for later</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="favorites-grid">
        {favorites.length === 0 ? (
          <div className="no-favorites">
            <h3>No favorite properties yet</h3>
            <p>Browse properties and click the heart icon to save them for later</p>
            <Link to="/properties" className="browse-btn">
              Browse Properties
            </Link>
          </div>
        ) : (
          favorites.map(property => (
            <div key={property.id} className="favorite-card">
              <div className="favorite-image">
                {property.primary_image ? (
                  <img src={property.primary_image} alt={property.name} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                <button
                  className="remove-favorite-btn"
                  onClick={() => handleRemoveFavorite(property.id)}
                  title="Remove from favorites"
                >
                  ❤️
                </button>
              </div>

              <div className="favorite-info">
                <div className="favorite-header">
                  <h3>{property.name}</h3>
                  <p className="favorite-location">{property.city}, {property.country}</p>
                </div>

                <div className="favorite-details">
                  <p><strong>Type:</strong> {property.property_type}</p>
                  <p><strong>Bedrooms:</strong> {property.bedrooms}</p>
                  <p><strong>Bathrooms:</strong> {property.bathrooms}</p>
                  <p><strong>Guests:</strong> {property.max_guests}</p>
                  <p><strong>Price:</strong> ${property.base_price}/night</p>
                </div>

                <div className="favorite-actions">
                  <Link to={`/property/${property.id}`} className="view-details-btn">
                    View Details
                  </Link>
                  <Link to={`/property/${property.id}`} className="book-now-btn">
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Favorites;
