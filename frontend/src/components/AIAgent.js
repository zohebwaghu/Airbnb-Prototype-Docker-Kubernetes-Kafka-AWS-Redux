import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AIAgent.css';

const AIAgent = ({ onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('plan');
  const [loading, setLoading] = useState(false);
  const [travelPlan, setTravelPlan] = useState(null);
  const [error, setError] = useState('');

  // Form state for travel plan generation
  const [formData, setFormData] = useState({
    location: '',
    start_date: '',
    end_date: '',
    party_type: 'solo',
    budget: 'moderate',
    interests: [],
    mobility_needs: '',
    dietary_filters: []
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(item => item)
    }));
  };

  const generateTravelPlan = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please log in to use the AI concierge');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/agent/travel-plan', {
        booking_context: {
          location: formData.location,
          start_date: formData.start_date,
          end_date: formData.end_date,
          party_type: formData.party_type
        },
        preferences: {
          budget: formData.budget,
          interests: formData.interests,
          mobility_needs: formData.mobility_needs || undefined,
          dietary_filters: formData.dietary_filters
        }
      });

      setTravelPlan(response.data);
      setActiveTab('results');
    } catch (err) {
      setError(err.response?.data?.error || (err.response?.status === 401 ? 'Please log in to use the AI concierge' : 'Failed to generate travel plan'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-agent-overlay">
      <div className="ai-agent-container">
        <div className="ai-agent-header">
          <h2>🤖 AI Travel Concierge</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="ai-agent-tabs">
          <button
            className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            Plan Trip
          </button>
          <button
            className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
            disabled={!travelPlan}
          >
            Travel Plan
          </button>
        </div>

        <div className="ai-agent-content">
          {activeTab === 'plan' && (
            <form onSubmit={generateTravelPlan} className="travel-plan-form">
              <div className="form-section">
                <h3>📍 Trip Details</h3>
                <div className="form-group">
                  <label>Destination</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Paris, France"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Check-in Date</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      max={formData.end_date || undefined}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Check-out Date</label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Travel Party</label>
                  <select
                    name="party_type"
                    value={formData.party_type}
                    onChange={handleInputChange}
                  >
                    <option value="solo">Solo</option>
                    <option value="couple">Couple</option>
                    <option value="family">Family</option>
                    <option value="friends">Friends</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3>💰 Preferences</h3>
                <div className="form-group">
                  <label>Budget Level</label>
                  <select
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                  >
                    <option value="budget">Budget</option>
                    <option value="moderate">Moderate</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Interests (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.interests.join(', ')}
                    onChange={(e) => handleArrayInputChange('interests', e.target.value)}
                    placeholder="e.g., museums, food, adventure, shopping"
                  />
                </div>

                <div className="form-group">
                  <label>Mobility Needs (optional)</label>
                  <input
                    type="text"
                    name="mobility_needs"
                    value={formData.mobility_needs}
                    onChange={handleInputChange}
                    placeholder="e.g., wheelchair accessible, no stairs"
                  />
                </div>

                <div className="form-group">
                  <label>Dietary Restrictions (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.dietary_filters.join(', ')}
                    onChange={(e) => handleArrayInputChange('dietary_filters', e.target.value)}
                    placeholder="e.g., vegetarian, vegan, gluten-free"
                  />
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="generate-btn" disabled={loading}>
                {loading ? 'Generating Plan...' : '🎯 Generate Travel Plan'}
              </button>
            </form>
          )}

          {activeTab === 'results' && travelPlan && (
            <div className="travel-plan-results">
              <div className="results-section">
                <h3>📅 Day-by-Day Plan</h3>
                {travelPlan.day_by_day_plan?.map((day, index) => (
                  <div key={index} className="day-plan">
                    <h4>{day.day}</h4>
                    <p><strong>Morning:</strong> {day.morning}</p>
                    <p><strong>Afternoon:</strong> {day.afternoon}</p>
                    <p><strong>Evening:</strong> {day.evening}</p>
                  </div>
                ))}
              </div>

              <div className="results-section">
                <h3>🎯 Activity Recommendations</h3>
                {travelPlan.activity_cards?.map((activity, index) => (
                  <div key={index} className="activity-card">
                    <h4>{activity.title}</h4>
                    <p><strong>Address:</strong> {activity.address}</p>
                    <p><strong>Duration:</strong> {activity.duration}</p>
                    <p><strong>Price:</strong> {activity.price_tier}</p>
                    <div className="activity-tags">
                      {activity.tags.map((tag, i) => (
                        <span key={i} className="tag">{tag}</span>
                      ))}
                    </div>
                    <div className="activity-features">
                      {activity.wheelchair_friendly && <span className="feature">♿ Wheelchair Friendly</span>}
                      {activity.child_friendly && <span className="feature">👶 Child Friendly</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="results-section">
                <h3>🍽️ Restaurant Recommendations</h3>
                {travelPlan.restaurant_recommendations?.map((restaurant, index) => (
                  <div key={index} className="restaurant-card">
                    <h4>{restaurant.name}</h4>
                    <p><strong>Cuisine:</strong> {restaurant.cuisine}</p>
                    <p><strong>Address:</strong> {restaurant.address}</p>
                    <p><strong>Price:</strong> {restaurant.price_tier}</p>
                    <div className="dietary-options">
                      {restaurant.dietary_options.map((option, i) => (
                        <span key={i} className="dietary-tag">{option}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="results-section">
                <h3>🎒 Packing Checklist</h3>
                <ul className="packing-list">
                  {travelPlan.packing_checklist?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAgent;
