import React, { useState, useEffect } from 'react';
import { fetchAllReports, deleteReport, submitIconReport } from '../api/surveillance';

export function FieldClinicFeeds() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New report form state
  const [newReport, setNewReport] = useState({
    village_name: 'Kalyanpur',
    subject_name: '',
    ward_or_area: 'Zone 2 North',
    symptom_stage: 'cold_insomnia',
    selected_symptoms: ['chills', 'insomnia'],
    reporter_type: 'chw',
    notes: 'Mild fever and dehydration observed by community health worker.'
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllReports(selectedVillage);
      setReports(data);
    } catch (err) {
      setError(err.message || 'Failed to load clinic feed reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedVillage]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to archive/delete this surveillance report?')) return;
    try {
      await deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitIconReport({
        village_name: newReport.village_name,
        subject_name: newReport.subject_name || 'Anonymous Resident',
        ward_or_area: newReport.ward_or_area,
        symptom_stage: newReport.symptom_stage,
        selected_symptoms: newReport.selected_symptoms,
        reporter_type: newReport.reporter_type,
        notes: newReport.notes,
      });
      setShowCreateModal(false);
      // Reset form & reload
      setNewReport({
        village_name: 'Kalyanpur',
        subject_name: '',
        ward_or_area: 'Zone 2 North',
        symptom_stage: 'cold_insomnia',
        selected_symptoms: ['chills', 'insomnia'],
        reporter_type: 'chw',
        notes: 'Mild fever and dehydration observed by community health worker.'
      });
      await loadData();
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSymptom = (sym) => {
    setNewReport(prev => {
      const exists = prev.selected_symptoms.includes(sym);
      const updated = exists ? prev.selected_symptoms.filter(s => s !== sym) : [...prev.selected_symptoms, sym];
      return { ...prev, selected_symptoms: updated };
    });
  };

  // Filtered list
  const filteredReports = reports.filter(r => {
    if (selectedStage !== 'All' && r.symptom_stage !== selectedStage) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSub = (r.subject_name || '').toLowerCase().includes(q);
      const matchVil = (r.village_name || '').toLowerCase().includes(q);
      const matchRaw = (r.raw_transcript || '').toLowerCase().includes(q);
      if (!matchSub && !matchVil && !matchRaw) return false;
    }
    return true;
  });

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'confusion':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-error/15 text-error border border-error/30">Stage 3: Confusion</span>;
      case 'mobility_loss':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">Stage 2: Mobility Loss</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-secondary/15 text-secondary border border-secondary/30">Stage 1: Cold/Insomnia</span>;
    }
  };

  return (
    <div className="w-full h-full p-6 flex flex-col gap-6 overflow-y-auto bg-surface-container-lowest">
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">clinical_notes</span>
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Field Clinic Feeds</h1>
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              Live PostgREST Feed
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Real-time syndromic submissions from Community Health Workers (CHWs), rural clinics, and public voice reporting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-DEFAULT bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/30 text-sm font-semibold transition-colors"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-DEFAULT bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Log New Case</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/20">
          <div className="text-on-surface-variant text-xs font-semibold uppercase">Total Reports Logged</div>
          <div className="text-2xl font-bold text-on-surface mt-1">{reports.length}</div>
          <div className="text-xs text-primary mt-0.5">Across 4 rural clinic catchments</div>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/20">
          <div className="text-on-surface-variant text-xs font-semibold uppercase">Severe (Stage 2/3)</div>
          <div className="text-2xl font-bold text-error mt-1">
            {reports.filter(r => r.symptom_stage === 'confusion' || r.symptom_stage === 'mobility_loss').length}
          </div>
          <div className="text-xs text-on-surface-variant mt-0.5">Require clinical escalation</div>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/20">
          <div className="text-on-surface-variant text-xs font-semibold uppercase">Active Village Hub</div>
          <div className="text-2xl font-bold text-secondary mt-1">Kalyanpur</div>
          <div className="text-xs text-on-surface-variant mt-0.5">Primary Outbreak Epicenter</div>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/20">
          <div className="text-on-surface-variant text-xs font-semibold uppercase">Sync Status</div>
          <div className="text-2xl font-bold text-primary mt-1">100% Online</div>
          <div className="text-xs text-on-surface-variant mt-0.5">Direct Supabase connection</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
        <div className="flex flex-wrap items-center gap-3">
          {/* Village Filter */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-on-surface-variant font-semibold">Village:</span>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded px-2.5 py-1 text-on-surface font-medium text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="All">All Villages</option>
              <option value="Kalyanpur">Kalyanpur</option>
              <option value="Dumas">Dumas</option>
              <option value="Rampur">Rampur</option>
              <option value="Mohanpur">Mohanpur</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-on-surface-variant font-semibold">Severity:</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded px-2.5 py-1 text-on-surface font-medium text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="All">All Stages</option>
              <option value="cold_insomnia">Stage 1: Cold & Insomnia</option>
              <option value="mobility_loss">Stage 2: Mobility Loss</option>
              <option value="confusion">Stage 3: Confusion / Encephalic</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search patient, symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-surface-container-lowest border border-outline-variant/30 rounded text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="w-full bg-surface-container-lowest rounded-lg border border-outline-variant/30 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
            <span>Fetching live clinic records from database...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error">
            <p className="font-bold">Error loading reports</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">inbox</span>
            <p className="font-semibold text-on-surface">No surveillance reports match the current criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[11px] font-bold tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-4 py-3">Report ID / Timestamp</th>
                  <th className="px-4 py-3">Subject / Location</th>
                  <th className="px-4 py-3">Syndromic Stage</th>
                  <th className="px-4 py-3">Reported Symptoms &amp; Notes</th>
                  <th className="px-4 py-3">Channel / Source</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-bold text-primary">
                        #{report.id.slice(0, 8)}
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        {new Date(report.reported_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-on-surface">{report.subject_name || 'Anonymous'}</div>
                      <div className="text-xs text-on-surface-variant">
                        {report.village_name} {report.ward_or_area ? `• ${report.ward_or_area}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStageBadge(report.symptom_stage)}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="text-xs text-on-surface truncate" title={report.raw_transcript}>
                        {report.raw_transcript || 'Visual icon tap report'}
                      </div>
                      {report.structured_symptoms?.selected_symptoms && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {report.structured_symptoms.selected_symptoms.map((s, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 bg-surface-container-high rounded text-[10px] text-on-surface-variant font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant capitalize">
                        <span className="material-symbols-outlined text-[14px]">
                          {report.report_channel === 'icon_app' ? 'touch_app' : 'mic'}
                        </span>
                        {report.report_channel || 'icon_app'} ({report.reporter_type || 'chw'})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-1.5 rounded hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                        title="Archive or Delete Record"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal to Log New Report */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-lg w-full p-6 border border-outline-variant/30 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_box</span>
                Log Field Symptom Report
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Village Location</label>
                  <select
                    value={newReport.village_name}
                    onChange={(e) => setNewReport({ ...newReport, village_name: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface font-medium"
                    required
                  >
                    <option value="Kalyanpur">Kalyanpur</option>
                    <option value="Dumas">Dumas</option>
                    <option value="Rampur">Rampur</option>
                    <option value="Mohanpur">Mohanpur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1">Ward / Zone</label>
                  <input
                    type="text"
                    value={newReport.ward_or_area}
                    onChange={(e) => setNewReport({ ...newReport, ward_or_area: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface"
                    placeholder="e.g. Ward 4 West"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Subject / Patient Name (or Anonymous)</label>
                <input
                  type="text"
                  value={newReport.subject_name}
                  onChange={(e) => setNewReport({ ...newReport, subject_name: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface"
                  placeholder="e.g. Salim K. (32M)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Syndromic Progression Stage</label>
                <select
                  value={newReport.symptom_stage}
                  onChange={(e) => setNewReport({ ...newReport, symptom_stage: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface font-medium"
                >
                  <option value="cold_insomnia">Stage 1: Cold &amp; Insomnia</option>
                  <option value="mobility_loss">Stage 2: Mobility Loss</option>
                  <option value="confusion">Stage 3: Confusion / Severe Neurological</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Observed Symptoms (Select All)</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'chills', 'fever', 'insomnia', 'muscle_weakness', 'cannot_stand',
                    'confusion', 'dazed', 'watery_diarrhea', 'severe_vomiting'
                  ].map((sym) => {
                    const active = newReport.selected_symptoms.includes(sym);
                    return (
                      <button
                        type="button"
                        key={sym}
                        onClick={() => toggleSymptom(sym)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          active
                            ? 'bg-primary text-on-primary font-bold'
                            : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high'
                        }`}
                      >
                        {sym.replace('_', ' ')} {active ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Clinical Notes</label>
                <textarea
                  rows={2}
                  value={newReport.notes}
                  onChange={(e) => setNewReport({ ...newReport, notes: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded p-2 text-on-surface"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  <span>Submit to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
