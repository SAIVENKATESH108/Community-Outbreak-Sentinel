import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function AshaFieldSurveyMode() {
  const { user, setIsAshaMode } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [village, setVillage] = useState('Kalyanpur');

  // New Survey Form State
  const [formData, setFormData] = useState({
    household_head: 'Vikram Singh',
    household_members_screened: 5,
    symptomatic_count: 2,
    ors_packets_distributed: 6,
    chlorine_tablets_distributed: 12,
    water_source_tested: true,
    escalated_to_mhu: true,
    field_notes: 'Elderly resident with severe mobility loss and fever. Family informed to boil water from Well B4.'
  });

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/surveillance/asha-surveys?village_name=${village}`);
      if (res.ok) {
        const data = await res.json();
        setSurveys(data);
      }
    } catch (e) {
      console.warn('Could not load ASHA surveys:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, [village]);

  const handleSubmitSurvey = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/surveillance/asha-surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asha_worker_id: 'ASHA-KA-0412',
          asha_worker_name: user?.fullName || 'Sunita Devi (ASHA)',
          village_name: village,
          ...formData,
        }),
      });
      if (!res.ok) throw new Error('Failed to log survey');
      await loadSurveys();
      alert('Household field survey successfully logged & synced with Supabase!');
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full p-6 flex flex-col gap-6 overflow-y-auto bg-surface-container-lowest">
      {/* ASHA Field Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#144f44] to-[#0f3d35] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-emerald-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white border border-white/20">
            <span className="material-symbols-outlined text-3xl">health_and_safety</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight">{user?.fullName || 'Sunita Devi'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-300 text-emerald-950 font-bold text-[10px] uppercase">
                ASHA FIELD WORKER
              </span>
            </div>
            <p className="text-xs text-emerald-200 mt-0.5">
              Badge: ASHA-KA-0412 &bull; Assigned: Kalyanpur Ward 2 &bull; Eastern Highland Mesh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAshaMode(false)}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors border border-white/20"
          >
            Switch to Epidemiologist View
          </button>
        </div>
      </div>

      {/* Quick Field Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div className="text-[11px] font-bold text-on-surface-variant uppercase">Households Screened</div>
          <div className="text-2xl font-bold font-mono text-primary mt-1">28 <span className="text-xs font-normal">homes</span></div>
          <div className="text-xs text-primary mt-0.5">Zone 2 coverage: 82%</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div className="text-[11px] font-bold text-on-surface-variant uppercase">Symptomatic Cases</div>
          <div className="text-2xl font-bold font-mono text-error mt-1">7 <span className="text-xs font-normal">residents</span></div>
          <div className="text-xs text-error mt-0.5">Flagged for MHU triage</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div className="text-[11px] font-bold text-on-surface-variant uppercase">ORS Packets Given</div>
          <div className="text-2xl font-bold font-mono text-secondary mt-1">45 <span className="text-xs font-normal">sachets</span></div>
          <div className="text-xs text-on-surface-variant mt-0.5">WHO formula</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div className="text-[11px] font-bold text-on-surface-variant uppercase">Aquatabs Distributed</div>
          <div className="text-2xl font-bold font-mono text-on-surface mt-1">110 <span className="text-xs font-normal">tabs</span></div>
          <div className="text-xs text-on-surface-variant mt-0.5">Drinking pot disinfection</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Door-to-Door Household Screening Form (Left 1 Col) */}
        <div className="lg:col-span-1 bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <span className="material-symbols-outlined text-primary text-xl">home</span>
            <h3 className="font-bold text-sm text-on-surface">Door-to-Door Household Survey</h3>
          </div>

          <form onSubmit={handleSubmitSurvey} className="flex flex-col gap-3 text-xs">
            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Village Location</label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-2 font-semibold text-on-surface"
              >
                <option value="Kalyanpur">Kalyanpur (Active Outbreak)</option>
                <option value="Dumas">Dumas</option>
                <option value="Rampur">Rampur</option>
                <option value="Mohanpur">Mohanpur</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Head of Family / Household</label>
              <input
                type="text"
                value={formData.household_head}
                onChange={(e) => setFormData({ ...formData, household_head: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Members Screened</label>
                <input
                  type="number"
                  min="1"
                  value={formData.household_members_screened}
                  onChange={(e) => setFormData({ ...formData, household_members_screened: parseInt(e.target.value, 10) })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                />
              </div>
              <div>
                <label className="font-bold text-error block mb-1">Symptomatic Count</label>
                <input
                  type="number"
                  min="0"
                  value={formData.symptomatic_count}
                  onChange={(e) => setFormData({ ...formData, symptomatic_count: parseInt(e.target.value, 10) })}
                  className="w-full bg-surface-container-low border border-error/40 rounded-lg p-2 text-error font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">ORS Distributed</label>
                <input
                  type="number"
                  min="0"
                  value={formData.ors_packets_distributed}
                  onChange={(e) => setFormData({ ...formData, ors_packets_distributed: parseInt(e.target.value, 10) })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                />
              </div>
              <div>
                <label className="font-bold text-on-surface-variant block mb-1">Chlorine Tabs Given</label>
                <input
                  type="number"
                  min="0"
                  value={formData.chlorine_tablets_distributed}
                  onChange={(e) => setFormData({ ...formData, chlorine_tablets_distributed: parseInt(e.target.value, 10) })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-2 text-on-surface"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.water_source_tested}
                  onChange={(e) => setFormData({ ...formData, water_source_tested: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="font-bold text-on-surface text-xs">Household Water Pot Sample Checked</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.escalated_to_mhu}
                  onChange={(e) => setFormData({ ...formData, escalated_to_mhu: e.target.checked })}
                  className="rounded text-error focus:ring-error"
                />
                <span className="font-bold text-error text-xs">🚨 Flag for Immediate Mobile Unit (MHU)</span>
              </label>
            </div>

            <div>
              <label className="font-bold text-on-surface-variant block mb-1">Field Observation Notes</label>
              <textarea
                rows={2}
                value={formData.field_notes}
                onChange={(e) => setFormData({ ...formData, field_notes: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg p-2 text-on-surface"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors mt-2"
            >
              {submitting && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
              <span>Save &amp; Transmit Household Survey</span>
            </button>
          </form>
        </div>

        {/* Survey History Table (Right 2 Cols) */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">fact_check</span>
              <h3 className="font-bold text-sm text-on-surface">Recent Field Screening Logs</h3>
            </div>
            <button
              onClick={loadSurveys}
              className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Sync</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-2xl animate-spin text-primary">sync</span>
              <p className="text-xs mt-1">Loading household screening records...</p>
            </div>
          ) : surveys.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">
              <p className="text-xs font-semibold">No field surveys logged yet for {village}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5">Survey Code</th>
                    <th className="p-2.5">Head of Family</th>
                    <th className="p-2.5">Screened / Sick</th>
                    <th className="p-2.5">Supplies Given</th>
                    <th className="p-2.5">Triage</th>
                    <th className="p-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {surveys.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-container-low/50">
                      <td className="p-2.5 font-mono font-bold text-primary">{s.survey_code}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-on-surface">{s.field_notes?.replace('Head of family: ', '') || 'Household Head'}</div>
                        <div className="text-[10px] text-on-surface-variant">{s.village_name}</div>
                      </td>
                      <td className="p-2.5">
                        <span className="font-semibold">{s.household_members_screened} screened</span> &bull;{' '}
                        <span className={`font-bold ${s.symptomatic_count > 0 ? 'text-error' : 'text-primary'}`}>
                          {s.symptomatic_count} sick
                        </span>
                      </td>
                      <td className="p-2.5 text-[11px]">
                        {s.ors_packets_distributed} ORS &bull; {s.chlorine_tablets_distributed} Aquatabs
                      </td>
                      <td className="p-2.5">
                        {s.escalated_to_mhu ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/15 text-error">
                            MHU Escalated
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
                            Monitored
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-on-surface-variant text-[11px]">
                        {new Date(s.visit_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
