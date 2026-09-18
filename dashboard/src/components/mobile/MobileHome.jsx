import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function MobileHome({
  onOpenReportWizard,
  onOpenVoiceModal,
  onOpenVerbalAutopsy,
  language,
  setLanguage,
  offlineQueueCount = 0,
  onSyncOffline,
}) {
  const { setIsAshaMode } = useAuth();
  return (
    <div className="w-full h-full min-h-[640px] bg-[#f8fafc] text-slate-800 flex flex-col justify-between select-none overflow-y-auto">
      {/* Top Header Bar from Stitch */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#144f44] flex items-center justify-center p-1.5 shadow-sm">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="11" r="3" />
              <path d="M12 5v3M12 14v3M5 11h3M14 11h3" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-xs text-slate-800 leading-tight">Sentinel</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              COMMUNITY HEALTH
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher Pill */}
          <button
            onClick={() => setLanguage(language === 'EN' ? 'SWA' : 'EN')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">translate</span>
            <span>{language === 'EN' ? 'EN / SWA' : 'SWA / EN'}</span>
          </button>

          {/* Profile Icon */}
          <div className="w-8 h-8 rounded-full bg-[#144f44] text-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 flex flex-col gap-4">
        {/* Free Clinic Call 1199 Banner */}
        <div className="bg-[#d1fae5] border border-[#a7f3d0] rounded-2xl p-2.5 px-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
            <span className="material-symbols-outlined text-[18px] text-emerald-800">call</span>
            <span>Free clinic call: 1199</span>
          </div>
          <a
            href="tel:1199"
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#144f44] hover:bg-[#0f3d35] text-white text-xs font-bold shadow-sm transition-colors"
          >
            <span>Call now</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </a>
        </div>

        {/* Hero Section */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
            <span>COMMUNITY CARE PORTAL</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 leading-snug">
            How can we help your village today?
          </h1>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Tap a big button below. Your report helps nurses and doctors send medicine quickly.
          </p>
        </div>

        {/* Action Card 1: Report Symptoms (Urgent) */}
        <button
          type="button"
          onClick={onOpenReportWizard}
          className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#ccfbf1] flex items-center justify-center flex-shrink-0 text-emerald-700">
              <span className="material-symbols-outlined text-2xl font-black">sick</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900">Report Symptoms</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ccfbf1] text-emerald-800">
                  Urgent
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Someone is sick, has fever, rash, or vomiting
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
                <span>👆</span>
                <span>Tap here to begin</span>
              </div>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-700 transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </div>
        </button>

        {/* Action Card 2: Report a Death (Care) */}
        <button
          type="button"
          onClick={onOpenVerbalAutopsy}
          className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#e0f2fe] flex items-center justify-center flex-shrink-0 text-blue-700">
              <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900">Report a Death</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#e0f2fe] text-blue-800">
                  Care
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Someone has passed away in your family or village
              </p>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                <span className="material-symbols-outlined text-[13px]">lock</span>
                <span>Quiet, dignified &amp; confidential</span>
              </div>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-500 group-hover:text-blue-700 transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </div>
        </button>

        {/* Action Card 3: ASHA Field Survey Mode (Field Workers) */}
        <button
          type="button"
          onClick={() => {
            setIsAshaMode(true);
            window.location.hash = 'surveillance';
          }}
          className="w-full bg-gradient-to-r from-amber-50 to-amber-100/60 rounded-2xl p-4 border border-amber-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl font-black">assignment_ind</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900">ASHA Field Mode</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                  Field Agent
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Door-to-door household census, rapid screening &amp; water logs
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 mt-1">
                <span>📋</span>
                <span>Open field survey tablet interface</span>
              </div>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-amber-200/80 group-hover:bg-amber-300 flex items-center justify-center text-amber-900 transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </div>
        </button>

        {/* Action Card 4: Prefer Speaking? (Voice Assistant) */}
        <div className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-800 text-[20px]">mic</span>
              <span className="font-bold text-sm text-slate-900">Prefer speaking?</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#dcfce7] text-emerald-900">
              Voice Assistant
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Press the microphone and tell us what you see in your local language.
          </p>

          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="w-full py-3 rounded-xl bg-[#144f44] hover:bg-[#0f3d35] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">mic</span>
            <span>Hold or Tap to Speak Now</span>
          </button>
        </div>

        {/* Quick Resource Cards (2 columns) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-2.5 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-[#ccfbf1] text-emerald-700 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">water_drop</span>
            </div>
            <div>
              <div className="font-bold text-xs text-slate-800">Safe Water</div>
              <div className="text-[11px] text-slate-500">Chlorine tablets</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-2.5 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-[#ccfbf1] text-emerald-700 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">vaccines</span>
            </div>
            <div>
              <div className="font-bold text-xs text-slate-800">Clinic Post</div>
              <div className="text-[11px] text-slate-500">Open until 6 PM</div>
            </div>
          </div>
        </div>

        {/* Offline Ready Status Banner */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 flex items-center justify-between text-xs shadow-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <div>
              <div className="font-bold text-slate-800">Offline Ready</div>
              <div className="text-[10px] text-slate-500">Saves reports safely without internet</div>
            </div>
          </div>

          <button
            onClick={onSyncOffline}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative"
            title="Sync offline records"
          >
            <span className="material-symbols-outlined text-[20px]">sync</span>
            {offlineQueueCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                {offlineQueueCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Navigation Bar from Stitch */}
      <div className="bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-between sticky bottom-0 z-20">
        <button
          type="button"
          className="flex flex-col items-center gap-0.5 text-[#144f44] font-bold"
        >
          <span className="material-symbols-outlined text-[22px]">home</span>
          <span className="text-[10px]">Home</span>
        </button>

        <button
          type="button"
          onClick={onOpenReportWizard}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-[#144f44] transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">add_circle</span>
          <span className="text-[10px]">Report</span>
        </button>

        <button
          type="button"
          onClick={() => alert('Alerts: Boil water order active for Kalyanpur Well B4.')}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-[#144f44] transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">campaign</span>
          <span className="text-[10px]">Alerts</span>
        </button>

        <button
          type="button"
          onClick={onOpenVerbalAutopsy}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-[#144f44] transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">medical_services</span>
          <span className="text-[10px]">Care</span>
        </button>
      </div>
    </div>
  );
}
