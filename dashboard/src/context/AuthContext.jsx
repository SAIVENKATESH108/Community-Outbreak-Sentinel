import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 'usr-epid-001',
    fullName: 'Dr. Evelyn Reed',
    role: 'epidemiologist', // 'epidemiologist', 'asha_worker', 'resident'
    title: 'Chief Epidemiologist',
    district: 'Barani District / Zone 3',
    coverage: '42 Rural Clinics',
    phone: '+91 98451 22340',
    authProvider: 'Gov-Tier OAuth',
  });

  const [isAshaMode, setIsAshaMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAiSettingsModal, setShowAiSettingsModal] = useState(false);

  const loginWithOtp = async (phone, otp) => {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phone, otp_code: otp }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'OTP verification failed');
    }
    const data = await res.json();
    setUser({
      id: `usr-${Date.now()}`,
      fullName: data.user.full_name,
      role: data.user.role,
      title: data.user.role === 'asha_worker' ? 'ASHA Field Worker (Zone 2)' : 'Registered Citizen Resident',
      district: 'Barani District / Zone 3',
      coverage: 'Village Catchment',
      phone: data.user.phone_number,
      authProvider: 'Mobile OTP Verified',
    });
    if (data.user.role === 'asha_worker') {
      setIsAshaMode(true);
    }
    return data;
  };

  const loginWithOAuth = async (provider, role = 'epidemiologist') => {
    const res = await fetch(`${API_BASE}/auth/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, role }),
    });
    if (!res.ok) throw new Error('OAuth authentication failed');
    const data = await res.json();
    setUser({
      id: `usr-${provider}`,
      fullName: data.user.full_name,
      role: data.user.role,
      title: role === 'asha_worker' ? 'ASHA Field Worker' : 'Chief Epidemiologist',
      district: data.user.district,
      coverage: '42 Rural Clinics',
      phone: '+91 94480 11223',
      authProvider: `${provider.toUpperCase()} Single Sign-On`,
    });
    if (role === 'asha_worker') {
      setIsAshaMode(true);
    }
    return data;
  };

  const logout = () => {
    setUser({
      id: 'usr-guest',
      fullName: 'Anonymous Health Worker',
      role: 'resident',
      title: 'Community Health Portal',
      district: 'Barani District',
      coverage: 'Local Area',
      phone: '',
      authProvider: 'Guest',
    });
    setIsAshaMode(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAshaMode,
        setIsAshaMode,
        showAuthModal,
        setShowAuthModal,
        showAiSettingsModal,
        setShowAiSettingsModal,
        loginWithOtp,
        loginWithOAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
