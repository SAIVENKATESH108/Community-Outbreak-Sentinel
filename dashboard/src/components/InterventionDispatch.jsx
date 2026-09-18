import React, { useState, useEffect } from 'react';
import { fetchInterventions, dispatchIntervention } from '../api/surveillance';

export function InterventionDispatch() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New dispatch form
  const [formData, setFormData] = useState({
    unit_id: 'MHU-Delta',
    destination_village: 'Kalyanpur',
    intervention_type: 'rapid_medical_response',
    personnel_count: 5,
    supplies_loaded: ['ORS Sachets', 'Chlorine Tablets', 'Cholera RDT Kits', 'IV Ringer Lactate'],
    urgency_level: 'critical'
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInterventions();
      setUnits(data);
    } catch (err) {
      setError(err.message || 'Failed to load dispatch telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await dispatchIntervention(formData);
      setShowModal(false);
      await loadData();
    } catch (err) {
      alert(`Dispatch failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSupply = (supply) => {
    setFormData(prev => {
      const exists = prev.supplies_loaded.includes(supply);
      const updated = exists ? prev.supplies_loaded.filter(s => s !== supply) : [...prev.supplies_loaded, supply];
      return { ...prev, supplies_loaded: updated };
    });
  };

  return (
    <div className="w-full h-full p-6 flex flex-col gap-6 overflow-y-auto bg-surface-container-lowest">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">local_shipping</span>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Intervention Dispatch</h1>
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              Emergency Logistics Network
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Command and dispatch Mobile Health Units (MHUs), point-of-use water disinfection teams, and ring rehydration kits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-DEFAULT bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/30 text-sm font-semibold transition-colors"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
            <span>Refresh Fleet</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-DEFAULT bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">emergency</span>
            <span>Dispatch Response Unit</span>
          </button>
        </div>
      </div>

      {/* Stockpile Inventory Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div className="text-[11px] font-bold text-on-surface-variant uppercase">ORS Sachets Stock</div>
          <div className="text-2xl font-bold font-mono text-primary mt-1">4,200 <span className="text-xs font-normal">units</span></div>
          <div className="text-xs text-primary mt-0.5">Sufficient for 14 days</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div className="text-[11px] font-bold text-on-surface-variant uppercase">Chlorine Tablets</div>
          <div className="text-2xl font-bold font-mono text-secondary mt-1">12,500 <span className="text-xs font-normal">tabs</span></div>
          <div className="text-xs text-on-surface-variant mt-0.5">Aquatabs 67mg</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div className="text-[11px] font-bold text-on-surface-variant uppercase">Cholera RDT Kits</div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">320 <span className="text-xs font-normal">tests</span></div>
          <div className="text-xs text-on-surface-variant mt-0.5">Rapid dipstick batch</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div className="text-[11px] font-bold text-on-surface-variant uppercase">IV Ringer's Lactate</div>
          <div className="text-2xl font-bold font-mono text-error mt-1">180 <span className="text-xs font-normal">bags</span></div>
          <div className="text-xs text-error mt-0.5">Stock low - resupply flagged</div>
        </div>
      </div>

      {/* Active Mobile Health Units */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-on-surface">Active Response Fleet</h2>
          <span className="text-xs text-on-surface-variant font-medium">{units.length} Units Deployed</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
            <p className="mt-2 text-sm">Tracking mobile health vehicles via GPS...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-on-surface">{unit.unit_id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/20 text-primary">
                          {unit.vehicle_type || 'Mobile Clinic'}
                        </span>
                      </div>
                      <div className="text-xs text-on-surface-variant mt-0.5 font-medium">
                        Target Destination: <span className="font-bold text-on-surface">{unit.destination_village}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        {unit.eta_minutes > 0 ? `ETA: ${unit.eta_minutes}m` : 'On Station'}
                      </span>
                    </div>
                  </div>

                  {/* Personnel & Supplies */}
                  <div className="mt-4 pt-3 border-t border-outline-variant/20 flex flex-col gap-2">
                    <div className="text-xs">
                      <span className="font-bold text-on-surface-variant">Team: </span>
                      <span className="text-on-surface">{unit.personnel?.join(', ') || 'Medical Specialists'}</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-on-surface-variant">Payload: </span>
                      <span className="text-on-surface">{unit.supplies?.join(' • ') || 'Emergency Supplies'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>Status: <strong className="text-primary">{unit.current_status}</strong></span>
                  <span>{new Date(unit.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal to Dispatch New Unit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-md w-full p-6 border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">airport_shuttle</span>
                Dispatch Mobile Unit
              </h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="flex flex-col gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Unit Call Sign</label>
                  <input
                    type="text"
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Target Village</label>
                  <select
                    value={formData.destination_village}
                    onChange={(e) => setFormData({ ...formData, destination_village: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface font-medium"
                  >
                    <option value="Kalyanpur">Kalyanpur (Outbreak)</option>
                    <option value="Dumas">Dumas</option>
                    <option value="Rampur">Rampur</option>
                    <option value="Mohanpur">Mohanpur</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Team Size</label>
                  <input
                    type="number"
                    value={formData.personnel_count}
                    onChange={(e) => setFormData({ ...formData, personnel_count: parseInt(e.target.value, 10) })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface"
                    min="1"
                    max="10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Urgency</label>
                  <select
                    value={formData.urgency_level}
                    onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface font-medium"
                  >
                    <option value="critical">Critical (Immediate)</option>
                    <option value="high">High Priority</option>
                    <option value="routine">Routine Support</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Supplies to Load</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'ORS Sachets', 'Chlorine Tablets', 'Cholera RDT Kits',
                    'IV Ringer Lactate', 'Water Purification Powder', 'PPE Suits'
                  ].map((supply) => {
                    const active = formData.supplies_loaded.includes(supply);
                    return (
                      <button
                        type="button"
                        key={supply}
                        onClick={() => toggleSupply(supply)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          active
                            ? 'bg-primary text-on-primary font-bold'
                            : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high'
                        }`}
                      >
                        {supply} {active ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded text-on-surface-variant hover:bg-surface-container-high font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded bg-primary hover:bg-primary/90 text-on-primary font-bold flex items-center gap-2"
                >
                  {submitting && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
                  <span>Issue Dispatch Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
