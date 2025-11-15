// Example: How to use Redux in React components
// This file demonstrates Redux integration patterns

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, logoutUser } from '../store/slices/authSlice';
import { fetchProperties, setFilters } from '../store/slices/propertySlice';
import { createBooking, fetchBookings } from '../store/slices/bookingSlice';

// Example: Login Component with Redux
export const LoginExample = () => {
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogin = async (email, password, userType) => {
    try {
      await dispatch(loginUser({ email, password, userType })).unwrap();
      // Login successful - user is now in Redux store
      console.log('User logged in:', user);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  if (isAuthenticated) {
    return <div>Welcome, {user?.name}!</div>;
  }

  return (
    <div>
      {loading && <p>Logging in...</p>}
      {error && <p>Error: {error}</p>}
      {/* Login form here */}
    </div>
  );
};

// Example: Property Search with Redux
export const PropertySearchExample = () => {
  const dispatch = useDispatch();
  const { properties, loading, filters } = useSelector((state) => state.properties);

  useEffect(() => {
    // Fetch properties when filters change
    dispatch(fetchProperties(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
    // This will trigger useEffect to fetch new properties
  };

  return (
    <div>
      {loading && <p>Loading properties...</p>}
      {properties.map(property => (
        <div key={property.id}>{property.name}</div>
      ))}
    </div>
  );
};

// Example: Create Booking with Redux and Kafka
export const BookingExample = () => {
  const dispatch = useDispatch();
  const { bookings, loading } = useSelector((state) => state.bookings);
  const { user } = useSelector((state) => state.auth);

  const handleCreateBooking = async (bookingData) => {
    try {
      // This will:
      // 1. Publish event to Kafka (via frontend service)
      // 2. Update Redux store with new booking
      await dispatch(createBooking(bookingData)).unwrap();
      console.log('Booking created successfully');
    } catch (err) {
      console.error('Booking failed:', err);
    }
  };

  return (
    <div>
      <button onClick={() => handleCreateBooking({
        property_id: '123',
        check_in_date: '2025-12-01',
        check_out_date: '2025-12-05',
        number_of_guests: 2,
        total_price: 500
      })}>
        Create Booking
      </button>
      {bookings.map(booking => (
        <div key={booking.id}>Booking: {booking.status}</div>
      ))}
    </div>
  );
};

