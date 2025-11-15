import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, userType }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        userType
      });
      const { token, user } = response.data;
      
      // Store JWT token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Signup failed');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return null;
});

const initialState = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;

