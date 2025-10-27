import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import FiltersModal from '../components/FiltersModal';
import './Properties.css';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    check_in_date: '',
    check_out_date: '',
    guests: 1
  });

  const [advancedFilters, setAdvancedFilters] = useState({
    min_price: '',
    max_price: '',
    bedrooms: '',
    bathrooms: '',
    property_type: '',
    amenities: []
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          if (Array.isArray(value) && value.length > 0) {
            queryParams.append(key, value.join(','));
          } else if (!Array.isArray(value)) {
            queryParams.append(key, value);
          }
        }
      });

      const url = queryParams.toString() ? `/properties?${queryParams}` : '/properties';
      const response = await axios.get(url);
      setProperties(response.data.properties || []);
    } catch (error) {
      setError('Failed to load properties');
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFilterChange = (e) => {
    setSearchFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setHasSearched(true);
    const allFilters = { ...searchFilters, ...advancedFilters };
    await fetchProperties(allFilters);
  };

  const handleAdvancedFiltersApply = (filters) => {
    setAdvancedFilters(filters);
    setShowFiltersModal(false);
    const allFilters = { ...searchFilters, ...filters };
    fetchProperties(allFilters);
  };

  const clearAllFilters = () => {
    setSearchFilters({
      location: '',
      check_in_date: '',
      check_out_date: '',
      guests: 1
    });
    setAdvancedFilters({
      min_price: '',
      max_price: '',
      bedrooms: '',
      bathrooms: '',
      property_type: '',
      amenities: []
    });
    setHasSearched(false);
    fetchProperties();
  };

  return (
    <div className="properties-container">
      <div className="properties-header">
        <h2>Find Your Perfect Stay</h2>
        <p>Discover amazing properties around the world</p>
      </div>

      <div className="search-section">
        <form onSubmit={handleSearchSubmit} className="simple-search-form">
          <div className="search-inputs">
            <div className="search-input-group">
              <label>Where</label>
              <input
                type="text"
                name="location"
                value={searchFilters.location}
                onChange={handleSearchFilterChange}
                placeholder="Search destinations"
              />
            </div>

            <div className="search-input-group">
              <label>Check in</label>
              <input
                type="date"
                name="check_in_date"
                value={searchFilters.check_in_date}
                onChange={handleSearchFilterChange}
              />
            </div>

            <div className="search-input-group">
              <label>Check out</label>
              <input
                type="date"
                name="check_out_date"
                value={searchFilters.check_out_date}
                onChange={handleSearchFilterChange}
              />
            </div>

            <div className="search-input-group">
              <label>Guests</label>
              <select
                name="guests"
                value={searchFilters.guests}
                onChange={handleSearchFilterChange}
              >
                <option value={1}>1 Guest</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4 Guests</option>
                <option value={5}>5 Guests</option>
                <option value={6}>6 Guests</option>
                <option value={7}>7 Guests</option>
                <option value={8}>8+ Guests</option>
              </select>
            </div>

            <button type="submit" className="search-btn">
              <span className="search-icon">🔍</span> Search
            </button>
          </div>
        </form>

        {hasSearched && (
          <div className="filters-bar">
            <button className="filters-btn" onClick={() => setShowFiltersModal(true)}>
              <span>⚙️</span> Filters
            </button>
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {loading && <div className="loading-spinner"><div className="spinner"></div></div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && (
        <div className="properties-results">
          <div className="results-header">
            <h3>{properties.length} stays {searchFilters.location && `in ${searchFilters.location}`}</h3>
          </div>

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
      )}

      {showFiltersModal && (
        <FiltersModal
          filters={advancedFilters}
          onApply={handleAdvancedFiltersApply}
          onClose={() => setShowFiltersModal(false)}
        />
      )}
    </div>
  );
};

export default Properties;
