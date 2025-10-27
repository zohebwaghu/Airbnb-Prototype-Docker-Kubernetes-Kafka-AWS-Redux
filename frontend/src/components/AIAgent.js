import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AIAgent.css';

const AIAgent = ({ onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTravelPlan, setCurrentTravelPlan] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [userBookings, setUserBookings] = useState([]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch user's bookings for context
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await axios.get('/users/bookings');
        setUserBookings(response.data.bookings || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      }
    };
    fetchBookings();
  }, [isAuthenticated]);

  // Extract booking context from most recent booking
  const getBookingContext = useCallback(() => {
    if (userBookings.length > 0) {
      // Prefer upcoming bookings (status: accepted or pending)
      // Filter to show only future bookings
      const today = new Date().toISOString().split('T')[0];
      const upcomingBookings = userBookings.filter(booking => 
        booking.check_in_date >= today && 
        (booking.status === 'accepted' || booking.status === 'pending')
      );
      
      const selectedBooking = upcomingBookings.length > 0 
        ? upcomingBookings[0] 
        : userBookings[0];
      
      if (selectedBooking && selectedBooking.property_location) {
        return {
          location: selectedBooking.property_location,
          start_date: selectedBooking.check_in_date,
          end_date: selectedBooking.check_out_date,
          party_type: `${selectedBooking.number_of_guests} ${selectedBooking.number_of_guests === 1 ? 'guest' : 'guests'}`,
          budget: 'moderate',
          interests: [],
          mobility_needs: null,
          dietary_filters: []
        };
      }
    }
    return null;
  }, [userBookings]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;
    
    if (!isAuthenticated) {
      setError('Please log in to use the AI concierge');
      return;
    }

    const userMsg = inputMessage.trim();
    setInputMessage('');
    setError('');

    // Add user message to chat
    const newUserMessage = { role: 'user', content: userMsg };
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const bookingContext = getBookingContext();
      const conversationHistory = messages.map(m => ({ role: m.role, content: m.content }));

      const response = await axios.post('/agent/chat', {
        user_message: userMsg,
        booking_context: bookingContext,
        conversation_history: conversationHistory
      });

      // Add assistant response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.assistant_message 
      }]);

      // If travel plan was generated, store it
      if (response.data.travel_plan) {
        setCurrentTravelPlan(response.data.travel_plan);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Welcome message on load
  useEffect(() => {
    if (messages.length === 0 && isAuthenticated && userBookings.length >= 0) {
      const bookingContext = getBookingContext();
      let welcomeMessage;
      
      if (bookingContext) {
        const checkInDate = new Date(bookingContext.start_date).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric' 
        });
        welcomeMessage = `Hello! I'm your AI travel concierge. 👋\n\nI can see you have an upcoming trip to ${bookingContext.location} starting ${checkInDate}. I can help you:\n\n• Find restaurants and local cuisine\n• Discover activities and attractions\n• Create a personalized travel plan\n• Get a packing checklist\n• Find local events and weather info\n\nWhat would you like help with?`;
      } else {
        welcomeMessage = `Hello! I'm your AI travel concierge. 👋\n\nI can help you plan amazing trips! I can assist with:\n\n• Restaurant recommendations\n• Activity and attraction suggestions\n• Creating personalized travel plans\n• Packing checklists\n• Local events and weather\n\nWhat would you like help with today?`;
      }
      
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userBookings.length, getBookingContext]);

  return (
    <div className="ai-agent-overlay">
      <div className="ai-agent-container">
        <div className="ai-agent-header">
          <div className="header-content">
            <div className="header-avatar">🤖</div>
            <div>
              <h2>AI Travel Concierge</h2>
              <p className="header-subtitle">Ask me anything about your trip</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              {message.role === 'assistant' && (
                <div className="message-avatar assistant">🤖</div>
              )}
              <div className="message-content">
                <p>{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="message-avatar user">{user?.name?.charAt(0) || 'U'}</div>
              )}
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-avatar assistant">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Travel Plan Display */}
        {currentTravelPlan && (
          <div className="travel-plan-preview">
            <h3>📅 Your Travel Plan</h3>
            <div className="plan-summary">
              <p><strong>Activities:</strong> {currentTravelPlan.activity_cards?.length || 0}</p>
              <p><strong>Restaurants:</strong> {currentTravelPlan.restaurant_recommendations?.length || 0}</p>
              <p><strong>Days:</strong> {currentTravelPlan.day_by_day_plan?.length || 0}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message here..."
            className="chat-input"
            disabled={loading || !isAuthenticated}
          />
          <button 
            type="submit" 
            className="send-btn"
            disabled={loading || !inputMessage.trim() || !isAuthenticated}
          >
            {loading ? '⏳' : '📤'}
          </button>
        </form>

        {/* Example Questions */}
        {messages.length <= 1 && (
          <div className="example-questions">
            <h4>Try asking:</h4>
            <div className="question-chips">
              <button 
                className="chip-btn" 
                onClick={() => setInputMessage("What restaurants do you recommend?")}
              >
                What restaurants do you recommend?
              </button>
              <button 
                className="chip-btn" 
                onClick={() => setInputMessage("Create a travel plan for my trip")}
              >
                Create a travel plan
              </button>
              <button 
                className="chip-btn" 
                onClick={() => setInputMessage("What should I pack?")}
              >
                What should I pack?
              </button>
              <button 
                className="chip-btn" 
                onClick={() => setInputMessage("Are there any events happening?")}
              >
                Local events
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAgent;
