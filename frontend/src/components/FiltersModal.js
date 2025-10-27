import React, { useState } from 'react';
import './FiltersModal.css';

const FiltersModal = ({ filters, onApply, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setLocalFilters(prev => {
      const amenities = prev.amenities || [];
      const newAmenities = amenities.includes(amenity)
        ? amenities.filter(a => a !== amenity)
        : [...amenities, amenity];
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleClearAll = () => {
    setLocalFilters({
      min_price: '',
      max_price: '',
      bedrooms: '',
      bathrooms: '',
      property_type: '',
      amenities: []
    });
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const amenitiesList = [
    'WiFi',
    'Kitchen',
    'Air Conditioning',
    'Heating',
    'Pool',
    'Gym',
    'Parking',
    'Washer',
    'Dryer',
    'TV',
    'Hot Tub',
    'Pet Friendly',
    'Workspace'
  ];

  return (
    <div className="filters-modal-overlay" onClick={onClose}>
      <div className="filters-modal" onClick={(e) => e.stopPropagation()}>
        <div className="filters-modal-header">
          <h2>Filters</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="filters-modal-body">
          <div className="filter-section">
            <h3>Price range</h3>
            <p className="filter-subtitle">Trip price, includes all fees</p>
            <div className="price-inputs">
              <div className="price-input-group">
                <label>Minimum</label>
                <input
                  type="number"
                  name="min_price"
                  value={localFilters.min_price}
                  onChange={handleChange}
                  placeholder="$0"
                  min="0"
                />
              </div>
              <span className="price-separator">-</span>
              <div className="price-input-group">
                <label>Maximum</label>
                <input
                  type="number"
                  name="max_price"
                  value={localFilters.max_price}
                  onChange={handleChange}
                  placeholder="$1000+"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="filter-divider"></div>

          <div className="filter-section">
            <h3>Rooms and beds</h3>
            <div className="room-filter">
              <label>Bedrooms</label>
              <select
                name="bedrooms"
                value={localFilters.bedrooms}
                onChange={handleChange}
              >
                <option value="">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5+</option>
              </select>
            </div>
            <div className="room-filter">
              <label>Bathrooms</label>
              <select
                name="bathrooms"
                value={localFilters.bathrooms}
                onChange={handleChange}
              >
                <option value="">Any</option>
                <option value="1">1</option>
                <option value="1.5">1.5</option>
                <option value="2">2</option>
                <option value="2.5">2.5</option>
                <option value="3">3+</option>
              </select>
            </div>
          </div>

          <div className="filter-divider"></div>

          <div className="filter-section">
            <h3>Property type</h3>
            <div className="property-types">
              <label className="property-type-option">
                <input
                  type="radio"
                  name="property_type"
                  value=""
                  checked={localFilters.property_type === ''}
                  onChange={handleChange}
                />
                <span>Any</span>
              </label>
              <label className="property-type-option">
                <input
                  type="radio"
                  name="property_type"
                  value="house"
                  checked={localFilters.property_type === 'house'}
                  onChange={handleChange}
                />
                <span>🏠 House</span>
              </label>
              <label className="property-type-option">
                <input
                  type="radio"
                  name="property_type"
                  value="apartment"
                  checked={localFilters.property_type === 'apartment'}
                  onChange={handleChange}
                />
                <span>🏢 Apartment</span>
              </label>
              <label className="property-type-option">
                <input
                  type="radio"
                  name="property_type"
                  value="condo"
                  checked={localFilters.property_type === 'condo'}
                  onChange={handleChange}
                />
                <span>🏘️ Condo</span>
              </label>
              <label className="property-type-option">
                <input
                  type="radio"
                  name="property_type"
                  value="townhouse"
                  checked={localFilters.property_type === 'townhouse'}
                  onChange={handleChange}
                />
                <span>🏘️ Townhouse</span>
              </label>
            </div>
          </div>

          <div className="filter-divider"></div>

          <div className="filter-section">
            <h3>Amenities</h3>
            <div className="amenities-grid">
              {amenitiesList.map(amenity => (
                <label key={amenity} className="amenity-checkbox">
                  <input
                    type="checkbox"
                    checked={(localFilters.amenities || []).includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="filters-modal-footer">
          <button className="clear-all-btn" onClick={handleClearAll}>
            Clear all
          </button>
          <button className="show-results-btn" onClick={handleApply}>
            Show results
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltersModal;

