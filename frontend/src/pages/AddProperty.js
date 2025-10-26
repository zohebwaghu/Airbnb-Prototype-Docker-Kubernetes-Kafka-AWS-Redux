import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AddProperty.css';

const AddProperty = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    property_type: 'apartment',
    location: '',
    city: '',
    country: '',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 1,
    base_price: '',
    cleaning_fee: 0,
    service_fee: 0,
    amenities: []
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [amenityInput, setAmenityInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated || user.user_type !== 'owner') {
      setMessage('Only property owners can add properties');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/properties', formData);

      setMessage('Property added successfully!');
      setTimeout(() => {
        navigate('/owner/dashboard');
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to add property');
      console.error('Error adding property:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="add-property-container">
        <div className="error-message">Please log in to add a property</div>
      </div>
    );
  }

  if (user.user_type !== 'owner') {
    return (
      <div className="add-property-container">
        <div className="error-message">Only property owners can add properties</div>
      </div>
    );
  }

  return (
    <div className="add-property-container">
      <div className="add-property-header">
        <h2>Add New Property</h2>
        <p>List your property for travelers to discover</p>
      </div>

      <div className="add-property-form-container">
        <form onSubmit={handleSubmit} className="add-property-form">
          <div className="form-section">
            <h3>Basic Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Property Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Cozy Apartment in Downtown"
                />
              </div>

              <div className="form-group">
                <label htmlFor="property_type">Property Type *</label>
                <select
                  id="property_type"
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  required
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Describe your property, its features, and what makes it special..."
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Street Address *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="Full street address"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="City name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country *</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  placeholder="Country name"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Property Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bedrooms">Bedrooms *</label>
                <select
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  required
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} Bedroom{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bathrooms">Bathrooms *</label>
                <select
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  required
                >
                  <option value={0.5}>0.5 Bathroom</option>
                  <option value={1}>1 Bathroom</option>
                  <option value={1.5}>1.5 Bathrooms</option>
                  <option value={2}>2 Bathrooms</option>
                  <option value={2.5}>2.5 Bathrooms</option>
                  <option value={3}>3 Bathrooms</option>
                  <option value={3.5}>3.5 Bathrooms</option>
                  <option value={4}>4+ Bathrooms</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="max_guests">Max Guests *</label>
                <select
                  id="max_guests"
                  name="max_guests"
                  value={formData.max_guests}
                  onChange={handleChange}
                  required
                >
                  {Array.from({ length: 16 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="base_price">Price per Night ($) *</label>
                <input
                  type="number"
                  id="base_price"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  required
                  min="1"
                  step="0.01"
                  placeholder=" nightly rate"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cleaning_fee">Cleaning Fee ($)</label>
                <input
                  type="number"
                  id="cleaning_fee"
                  name="cleaning_fee"
                  value={formData.cleaning_fee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="service_fee">Service Fee ($)</label>
                <input
                  type="number"
                  id="service_fee"
                  name="service_fee"
                  value={formData.service_fee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Amenities</h3>

            <div className="amenities-input">
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    placeholder="Add an amenity (e.g., WiFi, Kitchen)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAmenity}
                  className="add-amenity-btn"
                >
                  Add
                </button>
              </div>
            </div>

            {formData.amenities.length > 0 && (
              <div className="amenities-list">
                {formData.amenities.map((amenity, index) => (
                  <span key={index} className="amenity-tag">
                    {amenity}
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(amenity)}
                      className="remove-amenity"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Adding Property...' : 'Add Property'}
            </button>
            <button type="button" onClick={() => navigate('/owner/dashboard')} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProperty;
