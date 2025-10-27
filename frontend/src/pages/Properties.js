import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Properties.css';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    city: '',
    country: '',
    check_in_date: '',
    check_out_date: '',
    guests: 1,
    min_price: '',
    max_price: '',
    bedrooms: '',
    property_type: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/properties');
      setProperties(response.data.properties || []);
    } catch (error) {
      setError('Failed to load properties');
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await axios.get(`/properties?${queryParams}`);
      setProperties(response.data.properties || []);
    } catch (error) {
      setError('Failed to filter properties');
      console.error('Error filtering properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      city: '',
      country: '',
      check_in_date: '',
      check_out_date: '',
      guests: 1,
      min_price: '',
      max_price: '',
      bedrooms: '',
      property_type: ''
    });
    fetchProperties();
  };

  if (loading) {
    return (
      <div className="properties-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="properties-container">
      <div className="properties-header">
        <h2>Find Your Perfect Stay</h2>
        <p>Discover amazing properties around the world</p>
      </div>

      <div className="search-filters">
        <form onSubmit={handleFilterSubmit} className="filter-form">
          <div className="filter-row">
            <div className="filter-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Where are you going?"
              />
            </div>

            <div className="filter-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="City name"
              />
            </div>

            <div className="filter-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={filters.country}
                onChange={handleFilterChange}
                placeholder="Country name"
              />
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Check-in</label>
              <input
                type="date"
                name="check_in_date"
                value={filters.check_in_date}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>Check-out</label>
              <input
                type="date"
                name="check_out_date"
                value={filters.check_out_date}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>Guests</label>
              <select
                name="guests"
                value={filters.guests}
                onChange={handleFilterChange}
              >
                <option value={1}>1 Guest</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4 Guests</option>
                <option value={5}>5+ Guests</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Min Price</label>
              <input
                type="number"
                name="min_price"
                value={filters.min_price}
                onChange={handleFilterChange}
                placeholder="Min price"
                min="0"
              />
            </div>

            <div className="filter-group">
              <label>Max Price</label>
              <input
                type="number"
                name="max_price"
                value={filters.max_price}
                onChange={handleFilterChange}
                placeholder="Max price"
                min="0"
              />
            </div>

            <div className="filter-group">
              <label>Bedrooms</label>
              <select
                name="bedrooms"
                value={filters.bedrooms}
                onChange={handleFilterChange}
              >
                <option value="">Any</option>
                <option value={1}>1 Bedroom</option>
                <option value={2}>2 Bedrooms</option>
                <option value={3}>3 Bedrooms</option>
                <option value={4}>4+ Bedrooms</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Property Type</label>
              <select
                name="property_type"
                value={filters.property_type}
                onChange={handleFilterChange}
              >
                <option value="">Any</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit" className="search-btn">Search</button>
            <button type="button" onClick={clearFilters} className="clear-btn">Clear Filters</button>
          </div>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="properties-grid">
        {properties.length === 0 ? (
          <div className="no-properties">
            <h3>No properties found</h3>
            <p>Try adjusting your search filters</p>
          </div>
        ) : (
          properties.map(property => (
            <Link key={property.id} to={`/property/${property.id}`} className="property-card">
              <div className="property-image">
                {property.primary_image ? (
                  <img src={property.primary_image} alt={property.name} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>

              <div className="property-info">
                <div className="property-header">
                  <h3>{property.name}</h3>
                  <p className="property-location">{property.city}, {property.country}</p>
                </div>

                <div className="property-details">
                  <span className="property-type">{property.property_type}</span>
                  <span className="property-specs">{property.bedrooms} bed · {property.bathrooms} bath · {property.max_guests} guests</span>
                </div>

                <div className="property-price">
                  <strong>${property.base_price}</strong> night
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Properties;
