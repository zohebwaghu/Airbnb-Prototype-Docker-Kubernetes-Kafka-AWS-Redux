import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { publishBookingEvent } from '../../services/kafkaService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Async thunks
export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      // Publish to Kafka (frontend as producer)
      await publishBookingEvent('booking-created', bookingData);
      
      // Also make API call for immediate response
      const response = await axios.post(`${API_URL}/bookings`, bookingData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create booking');
    }
  }
);

export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/bookings`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch bookings');
    }
  }
);

export const fetchFavorites = createAsyncThunk(
  'bookings/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/favorites`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch favorites');
    }
  }
);

export const addFavorite = createAsyncThunk(
  'bookings/addFavorite',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/favorites`, { property_id: propertyId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add favorite');
    }
  }
);

const initialState = {
  bookings: [],
  favorites: [],
  currentBooking: null,
  loading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    updateBookingStatus: (state, action) => {
      const { bookingId, status } = action.payload;
      const booking = state.bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.status = status;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings.push(action.payload);
        state.currentBooking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch favorites
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload;
      })
      // Add favorite
      .addCase(addFavorite.fulfilled, (state, action) => {
        state.favorites.push(action.payload);
      });
  },
});

export const { updateBookingStatus, clearError } = bookingSlice.actions;
export default bookingSlice.reducer;

