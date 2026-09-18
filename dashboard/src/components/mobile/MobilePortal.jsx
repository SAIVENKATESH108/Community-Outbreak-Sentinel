import React, { useState, useEffect } from 'react';
import { MobileSplash } from './MobileSplash';
import { MobileHome } from './MobileHome';
import { MobileSymptomWizard } from './MobileSymptomWizard';
import { MobileConfirmation } from './MobileConfirmation';
import { MobileVoiceModal } from './MobileVoiceModal';
import { MobileVerbalAutopsyModal } from './MobileVerbalAutopsyModal';
import { submitIconReport } from '../../api/surveillance';
import { useAuth } from '../../context/AuthContext';

export function MobilePortal({ onClosePreview }) {
  const { isAshaMode, setIsAshaMode } = useAuth();
  const getInitialScreen = () => {
    const h = window.location.hash.replace('#', '');
    if (h === 'wizard') return 'wizard';
    if (h === 'splash') return 'splash';
    return 'home';
  };
  const [currentScreen, setCurrentScreen] = useState(getInitialScreen);
  const [language, setLanguage] = useState('EN');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showAutopsyModal, setShowAutopsyModal] = useState(false);
  const [lastSubmittedReport, setLastSubmittedReport] = useState(null);
  const [offlineReports, setOfflineReports] = useState([]);
  const [syncingOffline, setSyncingOffline] = useState(false);

  // Load offline queue on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sentinel_offline_reports') || '[]');
      setOfflineReports(stored);
    } catch (e) {
      console.warn('Failed to parse offline storage', e);
    }
  }, []);

  const handleSyncOffline = async () => {
    if (offlineReports.length === 0) {
      alert('Offline queue is empty. All reports are synced with Supabase!');
      return;
    }
    setSyncingOffline(true);
    let remaining = [...offlineReports];
    for (const rep of offlineReports) {
      try {
        await submitIconReport({
          village_name: rep.village_name,
          subject_name: rep.subject_name,
          ward_or_area: rep.ward_or_area,
          symptom_stage: rep.symptom_stage,
          selected_symptoms: rep.selected_symptoms,
          reporter_type: rep.reporter_type || 'resident',
          notes: `${rep.notes || ''} [Synced from offline queue]`,
        });
        remaining = remaining.filter((r) => r.report_id !== rep.report_id);
      } catch (err) {
        console.error('Failed to sync item:', err);
      }
    }
    localStorage.setItem('sentinel_offline_reports', JSON.stringify(remaining));
    setOfflineReports(remaining);
    setSyncingOffline(false);
    alert(`Offline sync complete! ${offlineReports.length - remaining.length} records pushed to Supabase.`);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-0 sm:p-4 bg-slate-950/90 sm:bg-slate-900/80 backdrop-blur-md">
      {/* Mobile Device Frame Container (Full screen on phone/emulator, framed on desktop) */}
      <div className="w-full sm:max-w-[420px] h-full sm:h-[820px] sm:max-h-[94vh] bg-white sm:rounded-[40px] shadow-2xl overflow-hidden sm:border-[8px] border-slate-800 flex flex-col relative">
        {/* Dynamic Island / Speaker Pill (Only on desktop simulator preview) */}
        <div className="hidden sm:flex absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 items-center justify-between px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#144f44]/80"></div>
        </div>

        {/* Top Control Bar for Simulator */}
        <div className="absolute top-3 right-4 z-50 flex items-center gap-2">
          {onClosePreview && (
            <button
              onClick={onClosePreview}
              className="p-1 rounded-full bg-black/60 hover:bg-black text-white text-xs"
              title="Close Mobile View"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Screen Routing */}
        <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
          {currentScreen === 'splash' && (
            <MobileSplash onFinish={() => setCurrentScreen('home')} />
          )}

          {currentScreen === 'home' && (
            <MobileHome
              language={language}
              setLanguage={setLanguage}
              offlineQueueCount={offlineReports.length}
              onSyncOffline={handleSyncOffline}
              onOpenReportWizard={() => setCurrentScreen('wizard')}
              onOpenVoiceModal={() => setShowVoiceModal(true)}
              onOpenVerbalAutopsy={() => setShowAutopsyModal(true)}
            />
          )}

          {currentScreen === 'wizard' && (
            <MobileSymptomWizard
              onCancel={() => setCurrentScreen('home')}
              onComplete={(report) => {
                setLastSubmittedReport(report);
                setCurrentScreen('confirm');
              }}
            />
          )}

          {currentScreen === 'confirm' && (
            <MobileConfirmation
              reportData={lastSubmittedReport}
              onReturnHome={() => setCurrentScreen('home')}
            />
          )}
        </div>

        {/* Voice Assistant Modal */}
        {showVoiceModal && (
          <MobileVoiceModal
            onClose={() => setShowVoiceModal(false)}
            onReportSuccess={(res) => {
              setLastSubmittedReport(res);
              setShowVoiceModal(false);
              setCurrentScreen('confirm');
            }}
          />
        )}

        {/* Verbal Autopsy Modal */}
        {showAutopsyModal && (
          <MobileVerbalAutopsyModal
            onClose={() => setShowAutopsyModal(false)}
            onSuccess={() => {
              setShowAutopsyModal(false);
            }}
          />
        )}
      </div>

      {/* Simulator Quick Toggles */}
      <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
        <button
          onClick={() => setCurrentScreen('splash')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            currentScreen === 'splash' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          Splash Screen
        </button>
        <button
          onClick={() => setCurrentScreen('home')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            currentScreen === 'home' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          Home Portal
        </button>
        <button
          onClick={() => setCurrentScreen('wizard')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            currentScreen === 'wizard' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          4-Step Wizard
        </button>
        <button
          onClick={() => {
            setIsAshaMode(true);
            if (onClosePreview) onClosePreview();
          }}
          className="px-3 py-1 rounded-full text-xs font-bold transition-colors bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 shadow-sm"
        >
          <span className="material-symbols-outlined text-[14px]">assignment_ind</span>
          <span>ASHA Field Mode</span>
        </button>
      </div>
    </div>
  );
}
