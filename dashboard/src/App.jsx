import React, { useState } from 'react';
import { ClusterProvider, useClusters } from './context/ClusterContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClusterMap } from './components/ClusterMap';
import { ClusterList } from './components/ClusterList';
import { ClusterDetail } from './components/ClusterDetail';
import { FieldClinicFeeds } from './components/FieldClinicFeeds';
import { VectorWaterTesting } from './components/VectorWaterTesting';
import { TransmissionModels } from './components/TransmissionModels';
import { InterventionDispatch } from './components/InterventionDispatch';
import { MobilePortal } from './components/mobile/MobilePortal';
import { AuthModal } from './components/AuthModal';
import { AshaFieldSurveyMode } from './components/AshaFieldSurveyMode';
import { AiVoiceSettingsModal } from './components/AiVoiceSettingsModal';

function DashboardContent() {
  const { clusters, selectedCluster, refreshClusters, runSweep, loading, error, lastRefreshed } = useClusters();
  const {
    user,
    isAshaMode,
    setIsAshaMode,
    showAuthModal,
    setShowAuthModal,
    showAiSettingsModal,
    setShowAiSettingsModal,
  } = useAuth();

  const getInitialTab = () => {
    const h = window.location.hash.replace('#', '');
    if (['surveillance', 'clinic-feeds', 'water-testing', 'models', 'dispatch'].includes(h)) return h;
    return 'surveillance';
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [showMobileModal, setShowMobileModal] = useState(() => {
    const h = window.location.hash.replace('#', '');
    return h === 'mobile' || h === 'wizard' || h === 'splash';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    window.location.hash = tab;
    setShowMobileModal(false);
  };

  React.useEffect(() => {
    const onHashChange = () => {
      const h = window.location.hash.replace('#', '');
      if (h === 'mobile' || h === 'wizard' || h === 'splash') {
        setShowMobileModal(true);
      } else if (h === 'asha') {
        setIsAshaMode(true);
        setShowMobileModal(false);
      } else if (h === 'auth') {
        setShowAuthModal(true);
        setShowMobileModal(false);
      } else if (h === 'ai-models') {
        setShowAiSettingsModal(true);
        setShowMobileModal(false);
      } else if (['surveillance', 'clinic-feeds', 'water-testing', 'models', 'dispatch'].includes(h)) {
        setActiveTabState(h);
        setIsAshaMode(false);
        setShowMobileModal(false);
      }
    };
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (showMobileModal) {
    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col overflow-hidden">
        <MobilePortal
          onClosePreview={() => {
            setShowMobileModal(false);
            window.location.hash = activeTab;
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface font-body-md text-on-surface antialiased overflow-hidden">
      {/* Stitch Master Header with Safe Bounds */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/30">
        <div className="h-28 w-full flex flex-col justify-between">
          {/* Top Row: Responsive, Balanced & Unclipped */}
          <div className="h-16 px-4 lg:px-6 flex items-center justify-between gap-3 w-full">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 border border-primary/20 shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <circle cx="12" cy="11" r="3" />
                  <path d="M12 5v3M12 14v3M5 11h3M14 11h3" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base lg:text-lg text-primary tracking-tight font-black">
                    SENTINEL
                  </span>
                  <span className="px-1.5 py-0.5 bg-primary-fixed text-on-primary-fixed rounded text-[9px] uppercase font-bold tracking-wider">
                    Gov-Tier 1
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant font-medium hidden 2xl:inline-block">
                  District Epidemiological Surveillance System &bull; Eastern Highland #04
                </span>
              </div>
            </div>

            {/* Center: Live Operational Metrics & Action Triggers */}
            <div className="flex items-center gap-1.5 lg:gap-2 flex-shrink-0">
              {/* Live Status Pill */}
              <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/20">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Active Mesh</span>
              </div>

              {/* Refresh Sync */}
              <button
                onClick={refreshClusters}
                disabled={loading}
                title="Refresh cluster data from Supabase backend"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors border border-outline-variant/20 cursor-pointer text-xs"
              >
                <span className={`material-symbols-outlined text-secondary text-[15px] ${loading ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span className="font-mono text-on-surface text-[11px]">
                  {lastRefreshed ? lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                </span>
              </button>

              {/* Run Scan Sweep */}
              <button
                onClick={runSweep}
                disabled={loading}
                title="Run spatiotemporal scan statistic"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container hover:bg-primary text-on-primary transition-colors text-xs font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px]">radar</span>
                <span className="hidden md:inline">Scan</span>
              </button>

              {/* ASHA Field Survey Mode Toggle Button */}
              <button
                onClick={() => setIsAshaMode(!isAshaMode)}
                title="Open Door-to-Door ASHA Field Worker Community Surveillance Interface"
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-all ${
                  isAshaMode
                    ? 'bg-amber-600 text-white ring-2 ring-amber-300 animate-pulse'
                    : 'bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/50'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">assignment_ind</span>
                <span>{isAshaMode ? 'Exit ASHA' : 'ASHA Mode'}</span>
              </button>

              {/* AI Voice & Gemini Model Rate Limits Modal Button */}
              <button
                onClick={() => setShowAiSettingsModal(true)}
                title="View dynamic AI Voice models & 28-day Peak Usage Telemetry"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/40 text-xs font-bold shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[15px] text-indigo-400">tune</span>
                <span className="hidden lg:inline">AI Limits</span>
              </button>

              {/* Mobile Care App Portal Button */}
              <button
                onClick={() => setShowMobileModal(true)}
                title="Open Community Health Mobile Portal View"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-800 hover:bg-teal-700 text-white transition-all text-xs font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px]">smartphone</span>
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            {/* Right: User Profile & Zone Switcher: Always Fully Visible */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Zone Button */}
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs font-bold text-on-surface whitespace-nowrap"
                title="Assigned Health Jurisdiction"
              >
                <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
                <span>Barani District / Zone 3</span>
              </div>

              {/* Alert Badge */}
              <button
                className="relative p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center flex-shrink-0"
                title="Active Epidemiological Outbreak Alerts"
                type="button"
                onClick={() => setActiveTab('surveillance')}
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-error text-on-error text-[10px] flex items-center justify-center font-bold">
                  {clusters.length}
                </span>
              </button>

              {/* Operator Profile Pill & Login Modal Trigger */}
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                title="Account & Auth Settings (OAuth / Mobile OTP)"
                className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant/30 text-left flex-shrink-0"
              >
                <div className="w-7 h-7 rounded-full bg-[#144f44] text-white flex items-center justify-center font-bold text-xs ring-1 ring-outline-variant">
                  {user.fullName ? user.fullName[0] : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs text-on-surface leading-tight font-bold whitespace-nowrap">
                    {user.fullName || 'Operator'}
                  </span>
                  <span className="text-[9px] text-on-surface-variant whitespace-nowrap">
                    {user.title ? user.title.split(' ')[0] : 'Sentinel'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[14px]">
                  keyboard_arrow_down
                </span>
              </button>
            </div>
          </div>

          {/* Secondary Sub-nav Bar */}
          <div className="h-12 px-4 lg:px-6 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/30 overflow-x-auto no-scrollbar">
            <nav className="flex items-center gap-1 h-full py-1.5 whitespace-nowrap">
              <button
                type="button"
                onClick={() => { setActiveTab('surveillance'); setIsAshaMode(false); }}
                className={`px-3 h-full flex items-center transition-colors rounded text-xs font-semibold ${
                  activeTab === 'surveillance' && !isAshaMode
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Cluster Surveillance
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('clinic-feeds'); setIsAshaMode(false); }}
                className={`px-3 h-full flex items-center transition-colors rounded text-xs font-semibold ${
                  activeTab === 'clinic-feeds' && !isAshaMode
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Field Clinic Feeds
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('water-testing'); setIsAshaMode(false); }}
                className={`px-3 h-full flex items-center transition-colors rounded text-xs font-semibold ${
                  activeTab === 'water-testing' && !isAshaMode
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Vector &amp; Water Testing
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('models'); setIsAshaMode(false); }}
                className={`px-3 h-full flex items-center transition-colors rounded text-xs font-semibold ${
                  activeTab === 'models' && !isAshaMode
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Transmission Models
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('dispatch'); setIsAshaMode(false); }}
                className={`px-3 h-full flex items-center transition-colors rounded text-xs font-semibold ${
                  activeTab === 'dispatch' && !isAshaMode
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Intervention Dispatch
              </button>

              {/* Direct ASHA Mode Tab Pill */}
              <button
                type="button"
                onClick={() => setIsAshaMode(true)}
                className={`px-3 h-full flex items-center gap-1 transition-colors rounded text-xs font-bold ${
                  isAshaMode
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-800 hover:text-amber-900 bg-amber-50/70'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">volunteer_activism</span>
                <span>ASHA Field Surveys</span>
              </button>
            </nav>

            <div className="hidden lg:flex items-center gap-2 text-on-surface-variant whitespace-nowrap">
              <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
                SURVEILLANCE LEVEL: ELEVATED (AMBER)
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim ring-2 ring-secondary/30"></span>
            </div>
          </div>
        </div>
      </header>
      {/* Main Operational Surveillance Workspace */}
      <main className="w-full pt-28 bg-surface">
        <div className="w-full h-[calc(100vh-7rem)] flex flex-col overflow-hidden bg-surface">
          {/* SPECIAL: ASHA Field Survey Mode */}
          {isAshaMode ? (
            <AshaFieldSurveyMode onClose={() => setIsAshaMode(false)} />
          ) : (
            <>
              {/* TAB 1: GIS Cluster Surveillance */}
              {activeTab === 'surveillance' && (
                <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-surface">
                  {/* LEFT 65% PANE: GIS Workspace & Leaflet Map */}
                  <div className="relative w-full lg:w-[65%] h-full flex flex-col overflow-hidden bg-surface-container-lowest">
                    <ClusterMap />
                  </div>

                  {/* RIGHT 35% PANE: Cluster Queue & Slide-over Detail Drawer */}
                  <aside className="relative w-full lg:w-[35%] h-full flex flex-col bg-surface-container-lowest shadow-xl z-30 overflow-hidden border-l border-outline-variant/30">
                    <ClusterList />
                    {selectedCluster && <ClusterDetail />}
                  </aside>
                </div>
              )}

              {/* TAB 2: Field Clinic Feeds */}
              {activeTab === 'clinic-feeds' && (
                <FieldClinicFeeds />
              )}

              {/* TAB 3: Vector & Water Testing */}
              {activeTab === 'water-testing' && (
                <VectorWaterTesting />
              )}

              {/* TAB 4: Transmission Models */}
              {activeTab === 'models' && (
                <TransmissionModels />
              )}

              {/* TAB 5: Intervention Dispatch */}
              {activeTab === 'dispatch' && (
                <InterventionDispatch />
              )}
            </>
          )}
        </div>
      </main>

      {/* Enterprise Auth Modal (Mobile OTP & OAuth Single Sign-On) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Dynamic AI Voice & Rate Limits Telemetry Dashboard Modal */}
      <AiVoiceSettingsModal
        isOpen={showAiSettingsModal}
        onClose={() => setShowAiSettingsModal(false)}
      />


      {/* Toast Notification Overlay */}
      {error && (
        <div className="fixed bottom-6 right-6 z-[80] flex items-center gap-2 bg-error text-on-error px-4 py-3 rounded-lg shadow-xl font-body-sm">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ClusterProvider>
        <DashboardContent />
      </ClusterProvider>
    </AuthProvider>
  );
}