import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, isTraveler, isOwner } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Airbnb Clone</h1>
          <p>Find amazing places to stay and become a host</p>
          {!isAuthenticated && (
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary">Get Started</Link>
              <Link to="/properties" className="btn btn-secondary">Browse Properties</Link>
            </div>
          )}
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Why Choose Us?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏠</div>
              <h3>Unique Stays</h3>
              <p>From cozy apartments to luxury villas, find the perfect place for your trip.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Travel Assistant</h3>
              <p>Get personalized travel recommendations with our AI concierge service.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Best Prices</h3>
              <p>Find great deals and save money on your accommodations.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Global Reach</h3>
              <p>Book properties in destinations around the world.</p>
            </div>
          </div>
        </div>
      </section>

      {isAuthenticated && (
        <section className="dashboard">
          <div className="container">
            <h2>Your Dashboard</h2>
            <div className="dashboard-cards">
              {isTraveler && (
                <>
                  <Link to="/properties" className="dashboard-card">
                    <div className="card-icon">🔍</div>
                    <h3>Browse Properties</h3>
                    <p>Find and book your next stay</p>
                  </Link>
                  <Link to="/bookings" className="dashboard-card">
                    <div className="card-icon">📅</div>
                    <h3>My Bookings</h3>
                    <p>View your upcoming trips</p>
                  </Link>
                  <Link to="/favorites" className="dashboard-card">
                    <div className="card-icon">❤️</div>
                    <h3>Favorites</h3>
                    <p>Your saved properties</p>
                  </Link>
                </>
              )}

              {isOwner && (
                <>
                  <Link to="/owner/dashboard" className="dashboard-card">
                    <div className="card-icon">📊</div>
                    <h3>Owner Dashboard</h3>
                    <p>Manage your properties</p>
                  </Link>
                  <Link to="/owner/add-property" className="dashboard-card">
                    <div className="card-icon">➕</div>
                    <h3>Add Property</h3>
                    <p>List a new property</p>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="cta">
        <div className="container">
          <h2>Ready to start your journey?</h2>
          {!isAuthenticated ? (
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary">Join Now</Link>
              <Link to="/properties" className="btn btn-secondary">Explore Properties</Link>
            </div>
          ) : (
            <p>You're all set! Start exploring our features above.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
