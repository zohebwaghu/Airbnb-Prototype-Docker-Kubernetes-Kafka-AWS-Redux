import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import HostProfile from './pages/HostProfile';
import Bookings from './pages/Bookings';
import Favorites from './pages/Favorites';
import OwnerDashboard from './pages/OwnerDashboard';
import AddProperty from './pages/AddProperty';
import AIAgent from './components/AIAgent';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  const [showAIAgent, setShowAIAgent] = useState(false);

  return (
    <AuthProvider>
      <div className="App">
        <Navbar onAIAgentToggle={() => setShowAIAgent(!showAIAgent)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/host/:id" element={<HostProfile />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/add-property" element={<AddProperty />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        {showAIAgent && <AIAgent onClose={() => setShowAIAgent(false)} />}
      </div>
    </AuthProvider>
  );
}

export default App;
