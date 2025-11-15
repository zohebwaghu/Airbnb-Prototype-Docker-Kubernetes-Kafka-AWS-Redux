import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Async thunks
export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`${API_URL}/properties?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch properties');
    }
  }
);

export const fetchPropertyDetails = createAsyncThunk(
  'properties/fetchPropertyDetails',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/properties/${propertyId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch property details');
    }
  }
);

const initialState = {
  properties: [],
  currentProperty: null,
  filters: {
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    minPrice: 0,
    maxPrice: 10000,
  },
  loading: false,
  error: null,
};

const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearCurrentProperty: (state) => {
      state.currentProperty = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch properties
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch property details
      .addCase(fetchPropertyDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertyDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProperty = action.payload;
      })
      .addCase(fetchPropertyDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearFilters, clearCurrentProperty } = propertySlice.actions;
export default propertySlice.reducer;

