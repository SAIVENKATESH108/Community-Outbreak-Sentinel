import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  const { user, setUser, setIsAshaMode, loginWithOtp, loginWithOAuth } = useAuth();
  const [authMethod, setAuthMethod] = useState('quick'); // 'quick', 'otp', 'oauth'
  const [phone, setPhone] = useState('+91 94480 11223');
  const [selectedRole, setSelectedRole] = useState('asha_worker');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Preset Dummy Credentials Catalog
  const dummyCredentials = [
    {
      id: 'asha',
      name: 'Sunita Devi',
      role: 'asha_worker',
      title: 'Accredited ASHA Field Agent (Ward 2)',
      phone: '+91 94480 11223',
      otp: '123456',
      badge: 'ASHA-KA-0412',
      district: 'Barani District / Zone 3',
      icon: 'health_and_safety',
      color: 'from-amber-600 to-amber-700',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      permissions: ['Door-to-Door Census', 'Rapid Syndromic Screening', 'Water Pot Testing', 'MHU Triage Escalation', 'Submit Reports'],
    },
    {
      id: 'resident',
      name: 'Salim Khan',
      role: 'resident',
      title: 'Citizen Resident / Community Proxy',
      phone: '+91 98451 22340',
      otp: '123456',
      badge: 'ABHA-9821-4401-2093',
      district: 'Kalyanpur Village',
      icon: 'person',
      color: 'from-teal-600 to-teal-700',
      badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
      permissions: ['Submit Symptom Dossier', 'Verbal Autopsy Intakes', 'View Water Boil Advisories', 'Emergency Clinic Call (1199)'],
    },
    {
      id: 'epid',
      name: 'Dr. Evelyn Reed',
      role: 'epidemiologist',
      title: 'Chief Epidemiologist & District Commander',
      phone: '+91 98110 55443',
      otp: '123456',
      badge: 'GOV-EPID-001',
      district: 'Eastern Highland District #04',
      icon: 'analytics',
      color: 'from-emerald-700 to-emerald-800',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      permissions: ['Full GIS Surveillance', 'Run Scan Statistic Sweeps', 'Confirm / Dismiss Outbreaks', 'Fleet MHU Dispatch', 'AI Quota Config'],
    },
  ];

  const handleQuickLogin = (cred) => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setUser({
        id: `usr-${cred.id}-${Date.now()}`,
        fullName: cred.name,
        role: cred.role,
        title: cred.title,
        district: cred.district,
        coverage: cred.role === 'resident' ? 'Household #14' : cred.role === 'asha_worker' ? 'Kalyanpur Ward 2' : '42 Rural Clinics',
        phone: cred.phone,
        badge: cred.badge,
        authProvider: `Dummy Credentials (${cred.role})`,
        permissions: cred.permissions,
      });
      if (cred.role === 'asha_worker') {
        setIsAshaMode(true);
      } else {
        setIsAshaMode(false);
      }
      setLoading(false);
      setSuccessMsg(`Authenticated successfully as ${cred.name} (${cred.role})!`);
      setTimeout(() => {
        onClose();
      }, 500);
    }, 250);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, user_role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
      setOtpSent(true);
      setSuccessMsg(`OTP sent to ${phone}. Demo code: ${data.demo_otp_hint}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return;
    setLoading(true);
    setError(null);
    try {
      await loginWithOtp(phone, otpCode);
      onClose();
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setLoading(true);
    setError(null);
    try {
      await loginWithOAuth(provider, selectedRole);
      onClose();
    } catch (err) {
      setError(err.message || 'OAuth authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-outline-variant/30 flex flex-col gap-4 relative my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-base font-bold text-on-surface">Sentinel RBAC Auth</h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  Gov-Tier 1
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">Role-Based Access Control &amp; Demo Credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-xl font-bold p-1 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Current Active Identity Card */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#144f44] text-white flex items-center justify-center font-bold text-xs">
              {user.fullName ? user.fullName[0] : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-on-surface">{user.fullName}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {user.role}
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant block">{user.title}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-primary font-bold">{user.phone || 'SSO Active'}</span>
        </div>

        {/* Auth Method Navigation Tabs */}
        <div className="flex border-b border-outline-variant/20 text-xs font-bold">
          <button
            onClick={() => { setAuthMethod('quick'); setError(null); }}
            className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              authMethod === 'quick'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">flash_on</span>
            <span>1-Click Dummy Logins</span>
          </button>
          <button
            onClick={() => { setAuthMethod('otp'); setError(null); }}
            className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              authMethod === 'otp'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">sms</span>
            <span>Mobile OTP</span>
          </button>
          <button
            onClick={() => { setAuthMethod('oauth'); setError(null); }}
            className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              authMethod === 'oauth'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">shield</span>
            <span>Gov OAuth / ABHA</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-2.5 rounded-lg bg-error/10 border border-error/30 text-error text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: 1-CLICK DUMMY CREDENTIALS (RBAC PRESETS) */}
        {authMethod === 'quick' && (
          <div className="flex flex-col gap-2.5">
            <span className="text-[11px] text-on-surface-variant font-medium">
              Select an operational role below to instantly authenticate with pre-configured permissions:
            </span>

            <div className="flex flex-col gap-2">
              {dummyCredentials.map((cred) => {
                const isCurrent = user.role === cred.role;
                return (
                  <div
                    key={cred.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-r ${cred.color} text-white flex items-center justify-center shadow-xs`}>
                          <span className="material-symbols-outlined text-[16px]">{cred.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-on-surface">{cred.name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${cred.badgeBg}`}>
                              {cred.role.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant">{cred.title}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={loading || isCurrent}
                        onClick={() => handleQuickLogin(cred)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-primary/20 text-primary cursor-default'
                            : 'bg-primary hover:bg-primary/90 text-on-primary active:scale-95'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[14px]">login</span>
                            <span>Switch Role</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 text-[9px] pt-1.5 border-t border-outline-variant/20">
                      <span className="text-on-surface-variant font-bold">Access:</span>
                      {cred.permissions.slice(0, 3).map((perm, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                          &bull; {perm}
                        </span>
                      ))}
                      {cred.permissions.length > 3 && (
                        <span className="text-primary font-bold">+{cred.permissions.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL MOBILE PHONE & 6-DIGIT OTP */}
        {authMethod === 'otp' && (
          <div className="flex flex-col gap-3">
            {/* Role Radio */}
            <div>
              <label className="text-xs font-bold text-on-surface-variant block mb-1">Target Account Role</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'asha_worker', label: 'ASHA Worker', phone: '+91 94480 11223' },
                  { id: 'resident', label: 'Citizen', phone: '+91 98451 22340' },
                  { id: 'epidemiologist', label: 'Epidemiologist', phone: '+91 98110 55443' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setSelectedRole(r.id); setPhone(r.phone); }}
                    className={`py-1.5 px-2 rounded-lg border text-center text-xs transition-all ${
                      selectedRole === r.id
                        ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                      call
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 94480 11223"
                      className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1 block">
                    Valid demo OTP codes: <code>123456</code> (or <code>729401</code>)
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  {loading && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
                  <span>Request 6-Digit SMS OTP</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-on-surface-variant">
                      Enter 6-Digit OTP Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-primary hover:underline font-bold"
                    >
                      Change Phone
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full py-2 text-center tracking-[8px] font-mono text-lg font-bold bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  {loading && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
                  <span>Verify OTP &amp; Authenticate</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: OAUTH PROVIDERS */}
        {authMethod === 'oauth' && (
          <div className="flex flex-col gap-3 py-1">
            <button
              type="button"
              onClick={() => handleOAuth('abha_gov_id')}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-xs flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
              <span>Ayushman Bharat (ABHA) National Health ID</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-xs flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google Workspace</span>
            </button>
          </div>
        )}

        {/* RBAC Summary Table */}
        <div className="border-t border-outline-variant/20 pt-2 flex items-center justify-between text-[10px] text-on-surface-variant">
          <span className="font-bold uppercase tracking-wider text-primary">Active Token: SHA-256 JWT</span>
          <span>Ministry of Health Certified</span>
        </div>
      </div>
    </div>
  );
}
