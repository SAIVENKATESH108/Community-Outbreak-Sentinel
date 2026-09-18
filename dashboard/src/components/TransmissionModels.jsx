import React, { useState, useEffect } from 'react';
import { fetchTransmissionModel } from '../api/surveillance';

export function TransmissionModels() {
  const [village, setVillage] = useState('Kalyanpur');
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interventionEfficacy, setInterventionEfficacy] = useState(65); // Slider 0-100%

  const loadModel = async (vil) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTransmissionModel(vil);
      setModelData(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate transmission model');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModel(village);
  }, [village]);

  // Dynamically compute adjusted mitigated curve based on intervention efficacy slider
  const projections = modelData?.projections?.map((pt, idx) => {
    const factor = Math.pow(1 - (interventionEfficacy / 100) * 0.45, idx + 1);
    const customMitigated = Math.max(1, Math.round(pt.unmitigated_cases * factor));
    return {
      ...pt,
      customMitigated
    };
  }) || [];

  const maxCases = Math.max(
    ...projections.map(p => Math.max(p.unmitigated_cases, p.customMitigated)),
    30
  );

  return (
    <div className="w-full h-full p-6 flex flex-col gap-6 overflow-y-auto bg-surface-container-lowest">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">ssid_chart</span>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Transmission Models &amp; Projections</h1>
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              Mathematical SIR / SEIR Engine
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Dynamic reproduction number (R0) computation and forward-looking transmission trajectory modeling.
          </p>
        </div>

        {/* Village Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase">Target Village:</span>
            <select
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/30 rounded px-3 py-1.5 text-on-surface font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Kalyanpur">Kalyanpur (Outbreak Core)</option>
              <option value="Dumas">Dumas (Secondary Buffer)</option>
              <option value="Rampur">Rampur (Estuary Post)</option>
              <option value="Mohanpur">Mohanpur (Baseline Monitor)</option>
            </select>
          </div>
          <button
            onClick={() => loadModel(village)}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-DEFAULT bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/30 text-sm font-semibold transition-colors"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-on-surface-variant flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary">model_training</span>
          <span className="text-sm font-semibold">Running Bayesian transmission projection against Supabase report stream...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-error bg-error/10 rounded-xl">
          <p className="font-bold">Model execution failed</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : (
        <>
          {/* Key Epidemiological Parameter Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Effective Reproduction (R₀)
              </div>
              <div className="text-3xl font-bold font-mono text-error mt-1">
                {modelData.r0_estimate}
              </div>
              <div className="text-[11px] text-error mt-1 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                Rapid community transmission
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Attack Rate
              </div>
              <div className="text-3xl font-bold font-mono text-amber-600 mt-1">
                {modelData.attack_rate_percentage}%
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1">
                Pop. {modelData.target_population} residents
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Doubling Time
              </div>
              <div className="text-3xl font-bold font-mono text-secondary mt-1">
                {modelData.doubling_time_hours}h
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1">
                ~{Math.round(modelData.doubling_time_hours / 24)} days to double cases
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Observed In DB
              </div>
              <div className="text-3xl font-bold font-mono text-primary mt-1">
                {modelData.active_cases_observed}
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1">
                Verified symptom reports
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Est. Case Fatality
              </div>
              <div className="text-3xl font-bold font-mono text-on-surface mt-1">
                {modelData.case_fatality_rate_estimated}
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1">
                Linked Verbal Autopsy: 1
              </div>
            </div>
          </div>

          {/* Trajectory Simulation Graph */}
          <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
              <div>
                <h2 className="text-base font-bold text-on-surface">7-Day Outbreak Trajectory Forecast</h2>
                <p className="text-xs text-on-surface-variant">Comparing unmitigated propagation vs rapid WASH ring containment.</p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-error"></span>
                  <span className="text-on-surface">Unmitigated Trajectory</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  <span className="text-on-surface">Mitigated (WASH + Medical Unit)</span>
                </div>
              </div>
            </div>

            {/* Custom SVG Line & Bar Chart */}
            <div className="w-full h-64 relative flex items-end pt-8 pb-6 px-4">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-x-0 top-8 border-b border-outline-variant/15 text-[10px] text-on-surface-variant font-mono pl-1">
                {maxCases} cases
              </div>
              <div className="absolute inset-x-0 top-1/2 border-b border-outline-variant/15 text-[10px] text-on-surface-variant font-mono pl-1">
                {Math.round(maxCases / 2)} cases
              </div>
              <div className="absolute inset-x-0 bottom-6 border-b border-outline-variant/30"></div>

              {/* Day Bars */}
              <div className="w-full h-full flex items-end justify-around gap-2 z-10">
                {projections.map((p, idx) => {
                  const unmitH = Math.min(100, Math.round((p.unmitigated_cases / maxCases) * 100));
                  const mitH = Math.min(100, Math.round((p.customMitigated / maxCases) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div className="flex items-end gap-1.5 w-full max-w-[48px] h-full justify-center">
                        {/* Unmitigated Bar */}
                        <div
                          style={{ height: `${unmitH}%` }}
                          className="w-1/2 bg-error/70 rounded-t hover:bg-error transition-all relative"
                          title={`Unmitigated: ${p.unmitigated_cases} cases`}
                        >
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-error opacity-0 group-hover:opacity-100 transition-opacity">
                            {p.unmitigated_cases}
                          </span>
                        </div>
                        {/* Mitigated Bar */}
                        <div
                          style={{ height: `${mitH}%` }}
                          className="w-1/2 bg-primary rounded-t hover:bg-primary-hover transition-all relative"
                          title={`Mitigated: ${p.customMitigated} cases`}
                        >
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            {p.customMitigated}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-on-surface-variant mt-2">
                        {p.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Intervention Simulator Slider */}
            <div className="mt-2 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-bold text-on-surface mb-1">
                  <span>Simulate Intervention Coverage &amp; Response Speed:</span>
                  <span className="text-primary font-mono text-sm">{interventionEfficacy}% Effective</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  value={interventionEfficacy}
                  onChange={(e) => setInterventionEfficacy(parseInt(e.target.value, 10))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                  <span>Delayed Outreach (20%)</span>
                  <span>Standard Distribution (65%)</span>
                  <span>Instant Ring Lockdown &amp; Chlorination (95%)</span>
                </div>
              </div>

              <div className="sm:border-l border-outline-variant/20 sm:pl-4 min-w-[160px] text-right">
                <div className="text-[10px] uppercase font-bold text-on-surface-variant">Projected Cases Averted</div>
                <div className="text-2xl font-bold font-mono text-primary mt-0.5">
                  +{projections.reduce((acc, p) => acc + (p.unmitigated_cases - p.customMitigated), 0)}
                </div>
                <div className="text-[10px] text-secondary font-semibold">Across 7-day window</div>
              </div>
            </div>
          </div>

          {/* AI Advisory Action Plan */}
          <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0 mt-0.5">neurology</span>
            <div>
              <div className="font-bold text-sm text-on-surface">Epidemiological Response Recommendation:</div>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                {modelData.recommended_intervention}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
