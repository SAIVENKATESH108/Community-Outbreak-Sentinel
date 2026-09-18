import React from 'react';

export function MobileConfirmation({ reportData, onReturnHome }) {
  return (
    <div className="w-full h-full min-h-[640px] bg-[#f8fafc] flex flex-col justify-between p-6">
      <div className="flex flex-col items-center text-center mt-8 gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          Transmitted to District Command
        </div>

        <h2 className="text-2xl font-bold text-slate-800">Report Safely Logged</h2>
        <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
          Your village report has been registered in the Sentinel surveillance system. Nurses and CHWs have been notified.
        </p>

        {/* Report Card Summary */}
        <div className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-left flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs text-slate-500 font-bold uppercase">Reference ID</span>
            <span className="font-mono text-xs font-bold text-primary">
              #{reportData?.report_id ? reportData.report_id.slice(0, 8).toUpperCase() : 'SENT-7712'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Village</span>
            <span className="font-bold text-slate-800">{reportData?.village_name || 'Kalyanpur'}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Syndromic Classification</span>
            <span className="font-bold text-emerald-700 capitalize">
              {reportData?.stage ? reportData.stage.replace('_', ' ') : 'Symptom Triage Recorded'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Status</span>
            <span className="font-bold text-slate-700">Active in Epidemiological Queue</span>
          </div>
        </div>

        {/* Action instruction */}
        <div className="w-full bg-amber-50 rounded-2xl p-3 border border-amber-200 text-left flex items-start gap-2.5">
          <span className="material-symbols-outlined text-amber-700 text-lg flex-shrink-0 mt-0.5">local_hospital</span>
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="font-bold">Next Step:</strong> Ensure the patient drinks clean water with ORS or boiled water. The nearest rural clinic post is open until 6:00 PM.
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2">
        <a
          href="tel:1199"
          className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">call</span>
          <span>Call Dispatcher (1199)</span>
        </a>
        <button
          onClick={onReturnHome}
          className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm shadow-md transition-colors"
        >
          Return to Portal Home
        </button>
      </div>
    </div>
  );
}
