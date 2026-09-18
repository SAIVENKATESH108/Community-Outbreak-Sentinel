import React, { useState, useEffect } from 'react';
import { fetchWaterTests, createWaterTest } from '../api/surveillance';

export function VectorWaterTesting() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New sample form state
  const [formData, setFormData] = useState({
    node_name: 'WQ-Node #15 (Central Reservoir)',
    village_name: 'Kalyanpur',
    source_type: 'Borewell',
    coliform_count: 180,
    ph_level: 6.8,
    chlorine_residual: 0.08,
    is_contaminated: true,
    notes: 'Turbidity elevated following recent heavy rainfall runoff.'
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWaterTests();
      setSamples(data);
    } catch (err) {
      setError(err.message || 'Failed to load water testing telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createWaterTest({
        node_name: formData.node_name,
        village_name: formData.village_name,
        source_type: formData.source_type,
        coliform_count: parseInt(formData.coliform_count, 10),
        ph_level: parseFloat(formData.ph_level),
        chlorine_residual: parseFloat(formData.chlorine_residual),
        is_contaminated: formData.is_contaminated,
        notes: formData.notes
      });
      setShowModal(false);
      await loadData();
    } catch (err) {
      alert(`Error logging sample: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full p-6 flex flex-col gap-6 overflow-y-auto bg-surface-container-lowest">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">water_drop</span>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Vector &amp; Water Testing</h1>
            <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider">
              Hydrological Telemetry Mesh
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Real-time microbiological pathogen surveillance across community wellheads, river basins, and rural storage tanks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-DEFAULT bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/30 text-sm font-semibold transition-colors"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-DEFAULT bg-secondary hover:bg-secondary/90 text-on-secondary text-sm font-bold shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">biotech</span>
            <span>Log Water Sample Test</span>
          </button>
        </div>
      </div>

      {/* WHO / Sentinel Water Safety Banner */}
      <div className="p-4 rounded-xl bg-error/10 border border-error/30 flex items-start gap-3">
        <span className="material-symbols-outlined text-error text-2xl flex-shrink-0 mt-0.5">warning</span>
        <div>
          <div className="font-bold text-sm text-error">CRITICAL HYDRO-HAZARD DETECTED: Well Point B4 (Mabira Ridge / Kalyanpur)</div>
          <p className="text-xs text-on-surface mt-1 leading-relaxed">
            Coliform count (240 CFU/100ml) exceeds WHO limit (0 CFU/100ml). Chlorine residual is exhausted (0.05 mg/L). 
            Correlated with the 20 active syndromic cases in Kalyanpur. Boil water advisory issued to 580 households.
          </p>
        </div>
      </div>

      {/* Telemetry Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {samples.map((node) => {
          const isDanger = node.is_contaminated || node.coliform_count > 50;
          return (
            <div
              key={node.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all shadow-sm ${
                isDanger
                  ? 'bg-error/5 border-error/40'
                  : 'bg-surface-container-low border-outline-variant/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{node.node_name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      isDanger
                        ? 'bg-error text-on-error'
                        : 'bg-primary/20 text-primary'
                    }`}
                  >
                    {isDanger ? 'Hazard: Boil Order' : 'Potable / Safe'}
                  </span>
                </div>
                <div className="mt-2 text-base font-bold text-on-surface">{node.village_name}</div>
                <div className="text-xs text-on-surface-variant">{node.source_type}</div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-outline-variant/20 text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-on-surface-variant">Coliform</div>
                    <div className={`text-lg font-mono font-bold ${node.coliform_count > 0 ? 'text-error' : 'text-primary'}`}>
                      {node.coliform_count} <span className="text-[10px] font-normal">CFU</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-on-surface-variant">pH Level</div>
                    <div className="text-lg font-mono font-bold text-on-surface">
                      {node.ph_level}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-on-surface-variant">Chlorine</div>
                    <div className={`text-lg font-mono font-bold ${node.chlorine_residual < 0.2 ? 'text-amber-600' : 'text-primary'}`}>
                      {node.chlorine_residual} <span className="text-[10px] font-normal">mg/L</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>{node.status}</span>
                <span>{new Date(node.tested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vector Transmission Risk Matrix */}
      <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">pest_control</span>
          Vector Ecology &amp; Surface Runoff Correlation
        </h3>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Hydrological sensor telemetry is continuously cross-referenced with elevation vector meshes (EPSG:4326 WGS84). 
          Rainfall runoff flows downstream from Mabira Ridge into Nzoia South and Rampur estuary.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
          <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
            <div className="text-xs font-bold text-on-surface">Upstream Catchment</div>
            <div className="text-xs text-on-surface-variant mt-1">Turbidity: 14 NTU &bull; Flow: 1.4 m/s</div>
            <div className="text-xs font-semibold text-secondary mt-1">Status: Moderate Velocity</div>
          </div>
          <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
            <div className="text-xs font-bold text-on-surface">Primary Contamination Nexus</div>
            <div className="text-xs text-on-surface-variant mt-1">Lat: -01° 18' 42" S &bull; Lon: 36° 49' 14" E</div>
            <div className="text-xs font-semibold text-error mt-1">Status: Point-Source Confirmed</div>
          </div>
          <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
            <div className="text-xs font-bold text-on-surface">Downstream Exposure Risk</div>
            <div className="text-xs text-on-surface-variant mt-1">Estuary Distance: 4.8 km downstream</div>
            <div className="text-xs font-semibold text-amber-600 mt-1">Status: Water Guard Barrier Deployed</div>
          </div>
        </div>
      </div>

      {/* Modal to Log Water Sample */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-md w-full p-6 border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">science</span>
                Log Water Sample Test
              </h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Sampling Node / Point</label>
                <input
                  type="text"
                  value={formData.node_name}
                  onChange={(e) => setFormData({ ...formData, node_name: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Village Location</label>
                  <select
                    value={formData.village_name}
                    onChange={(e) => setFormData({ ...formData, village_name: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface font-medium"
                  >
                    <option value="Kalyanpur">Kalyanpur</option>
                    <option value="Dumas">Dumas</option>
                    <option value="Rampur">Rampur</option>
                    <option value="Mohanpur">Mohanpur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Source Type</label>
                  <select
                    value={formData.source_type}
                    onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface font-medium"
                  >
                    <option value="Borewell">Borewell</option>
                    <option value="Primary School Well">School Well</option>
                    <option value="Communal Storage Tank">Storage Tank</option>
                    <option value="River Catchment">River Catchment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Coliform (CFU)</label>
                  <input
                    type="number"
                    value={formData.coliform_count}
                    onChange={(e) => {
                      const c = parseInt(e.target.value, 10);
                      setFormData({ ...formData, coliform_count: c, is_contaminated: c > 0 });
                    }}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">pH (6.5-8.5)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ph_level}
                    onChange={(e) => setFormData({ ...formData, ph_level: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Chlorine (mg/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.chlorine_residual}
                    onChange={(e) => setFormData({ ...formData, chlorine_residual: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={formData.is_contaminated}
                    onChange={(e) => setFormData({ ...formData, is_contaminated: e.target.checked })}
                    className="rounded text-error focus:ring-error"
                  />
                  <span className="text-xs font-bold text-error">Mark as Microbiological Contaminant Hazard</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Technician Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface"
                />
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
                  className="px-5 py-2 rounded bg-secondary hover:bg-secondary/90 text-on-secondary font-bold flex items-center gap-2"
                >
                  {submitting && <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>}
                  <span>Save Test to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
