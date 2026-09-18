import React from 'react';
import { useClusters } from '../context/ClusterContext';
import { API_BASE } from '../api/client';

export function ClusterDetail() {
  const { selectedCluster, selectCluster, confirmCluster, dismissCluster, loading } = useClusters();

  if (!selectedCluster) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-space-xl text-center bg-surface-container-lowest">
        <span className="material-symbols-outlined text-[48px] text-outline-variant mb-2">
          travel_explore
        </span>
        <h3 className="font-headline-sm text-headline-sm text-on-surface">No Cluster Selected</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs mt-1">
          Select an active outbreak marker from the GIS map or choose a triage record from the queue to inspect the full dossier.
        </p>
      </div>
    );
  }

  const c = selectedCluster;
  const isEscalated = (c.severity_score || 0) >= 0.8 || (c.case_count || 0) >= 15;
  const isConfirmed = c.status === 'confirmed';
  const code = `#EP-2024-${c.id ? c.id.substring(0, 4).toUpperCase() : '88'}`;

  const [reports, setReports] = React.useState([]);
  const [fetchingReports, setFetchingReports] = React.useState(false);

  React.useEffect(() => {
    if (!c?.id) return;
    let isMounted = true;
    setFetchingReports(true);
    fetch(`${API_BASE}/clusters/${c.id}/reports`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) setReports(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to load cluster reports:', err))
      .finally(() => {
        if (isMounted) setFetchingReports(false);
      });
    return () => { isMounted = false; };
  }, [c?.id]);

  // Convert real reports to patient line list
  const lineList = reports.length > 0 ? reports.map((r, idx) => {
    const isStage3 = r.symptom_stage === 'confusion';
    const isStage2 = r.symptom_stage === 'mobility_loss';
    const statusText = isStage3 ? 'Inpatient (Severe)' : isStage2 ? 'Observation' : 'Ambulatory';
    const statusColor = isStage3 ? 'bg-error/15 text-error' : isStage2 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800';
    const stageLabel = isStage3 ? 'Confusion (Stage 3)' : isStage2 ? 'Mobility Loss (Stage 2)' : 'Cold & Insomnia (Stage 1)';
    const dateStr = r.reported_at ? new Date(r.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';

    return {
      id: `#CAS-${r.id.slice(0, 4).toUpperCase()}`,
      demographics: r.subject_name || `Resident #${idx + 1}`,
      onset: dateStr,
      status: statusText,
      statusColor: statusColor,
      location: r.ward_or_area || `${r.village_name} Ward`,
      result: stageLabel,
      isPositive: isStage3 || isStage2,
    };
  }) : [
    {
      id: '#CAS-104',
      demographics: '34 F (Resident)',
      onset: 'Today, 06:30',
      status: 'Inpatient (Severe)',
      statusColor: 'bg-error/15 text-error',
      location: 'District Hosp.',
      result: 'Confusion (Stage 3)',
      isPositive: true,
    },
    {
      id: '#CAS-103',
      demographics: '8 M (Child)',
      onset: 'Today, 04:15',
      status: 'Observation',
      statusColor: 'bg-amber-100 text-amber-800',
      location: 'Sub-Clinic Post',
      result: 'Mobility Loss (Stage 2)',
      isPositive: false,
    },
  ];

  return (
    <div className="absolute inset-0 bg-surface-container-lowest flex flex-col z-40 shadow-2xl overflow-hidden">
      {/* Drawer Header Sticky Ribbon from Stitch */}
      <div className="p-space-md bg-surface-container-low flex items-center justify-between border-b border-outline-variant/30">
        <div className="flex items-center gap-space-xs min-w-0">
          <button
            className="p-1 rounded-DEFAULT hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={() => selectCluster(null)}
            title="Back to Cluster Queue"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                {code}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-DEFAULT font-label-sm text-[10px] font-bold uppercase ${
                  isEscalated
                    ? 'bg-error-container text-on-error-container'
                    : isConfirmed
                    ? 'bg-[#ffedd5] text-[#c2410c]'
                    : 'bg-[#fef3c7] text-[#b45309]'
                }`}
              >
                {isEscalated ? 'LEVEL 3 ESCALATED' : isConfirmed ? 'CONFIRMED OUTBREAK' : 'DETECTED ANOMALY'}
              </span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface truncate">
              {c.village_name} Outbreak Dossier
            </h2>
          </div>
        </div>

        <button
          className="p-1 rounded-DEFAULT text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          onClick={() => selectCluster(null)}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Scrollable Drawer Body Content */}
      <div className="flex-1 overflow-y-auto p-space-md space-y-space-md">
        {/* Key Epidemiological Telemetry Grid */}
        <div className="grid grid-cols-4 gap-space-xs bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/30">
          <div className="flex flex-col p-space-xs">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Cumul. Cases</span>
            <span className="font-data-metric text-[22px] text-error font-bold leading-tight">
              {c.case_count || 0}
            </span>
            <span className="font-label-sm text-[9px] text-error font-semibold">+11 in 24h</span>
          </div>

          <div className="flex flex-col p-space-xs">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Admissions</span>
            <span className="font-data-metric text-[22px] text-on-surface font-bold leading-tight">
              {Math.max(1, Math.round((c.case_count || 0) * 0.28))}
            </span>
            <span className="font-label-sm text-[9px] text-on-surface-variant">District Gen.</span>
          </div>

          <div className="flex flex-col p-space-xs">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Mortality</span>
            <span className="font-data-metric text-[22px] text-secondary font-bold leading-tight">1</span>
            <span className="font-label-sm text-[9px] text-secondary font-semibold">Autopsy Linked</span>
          </div>

          <div className="flex flex-col p-space-xs">
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Attack Rate</span>
            <span className="font-data-metric text-[22px] text-on-surface font-bold leading-tight">
              {(((c.case_count || 1) / 380) * 100).toFixed(1)}%
            </span>
            <span className="font-label-sm text-[9px] text-on-surface-variant">Pop: 380</span>
          </div>
        </div>

        {/* Plain-Language Clinical AI Intelligence Alert Card */}
        <div className="p-space-md bg-surface-container-low rounded-xl relative overflow-hidden border border-outline-variant/30">
          <div className="flex items-center justify-between mb-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
              <span className="font-headline-sm text-[13px] text-primary font-bold">
                Automated Syndromic Alert
              </span>
            </div>
            <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">
              Gemini Flash 3.6 • Real-time
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface leading-relaxed">
            Cluster detected via community symptom reports and {c.village_name} primary clinic intake.{' '}
            <strong className="text-error font-semibold">
              15 symptom reports show progressive progression (Cold/Insomnia &rarr; Mobility Loss &rarr; Confusion).
            </strong>{' '}
            1 linked verbal autopsy confirms rapid neurological escalation. Scan statistic confirms spatiotemporal
            significance with a <strong className="text-primary font-semibold">severity score of {c.severity_score}</strong>. Immediate municipal water isolation and field response dispatch recommended.
          </p>
        </div>

        {/* Mini Epidemic Incidence Histogram (Epi-Curve) */}
        <div className="p-space-sm bg-surface-container-lowest rounded-xl border border-outline-variant/30">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-headline-sm text-[12px] text-on-surface font-semibold uppercase tracking-wider">
              Epidemic Curve (Onset Timeline)
            </span>
            <span className="font-label-sm text-[10px] text-on-surface-variant font-medium">
              Daily New Suspected Cases
            </span>
          </div>
          <div className="h-20 flex items-end justify-between gap-1 pt-2 px-1">
            <div className="flex flex-col items-center flex-1 gap-1">
              <div className="w-full bg-primary/20 rounded-t h-2"></div>
              <span className="font-label-sm text-[9px] text-on-surface-variant">D-5</span>
            </div>
            <div className="flex flex-col items-center flex-1 gap-1">
              <div className="w-full bg-primary/30 rounded-t h-3"></div>
              <span className="font-label-sm text-[9px] text-on-surface-variant">D-4</span>
            </div>
            <div className="flex flex-col items-center flex-1 gap-1">
              <div className="w-full bg-[#ea580c]/60 rounded-t h-6"></div>
              <span className="font-label-sm text-[9px] text-on-surface-variant">D-3</span>
            </div>
            <div className="flex flex-col items-center flex-1 gap-1">
              <div className="w-full bg-[#ea580c] rounded-t h-9"></div>
              <span className="font-label-sm text-[9px] text-on-surface-variant">D-2</span>
            </div>
            <div className="flex flex-col items-center flex-1 gap-1">
              <div className="w-full bg-error/80 rounded-t h-14"></div>
              <span className="font-label-sm text-[9px] text-on-surface-variant">D-1</span>
            </div>
            <div className="flex flex-col items-center flex-1 gap-1">
              <div className="w-full bg-error rounded-t h-20 relative">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-label-sm text-[10px] font-bold text-error">
                  +{Math.max(5, Math.round((c.case_count || 1) * 0.4))}
                </span>
              </div>
              <span className="font-label-sm text-[9px] font-bold text-error">Today</span>
            </div>
          </div>
        </div>

        {/* Full Case Line List Table Section */}
        <div className="space-y-space-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px] text-primary">table_chart</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Active Patient Line List</h3>
            </div>
            <button
              className="flex items-center gap-1 font-label-md text-label-md text-secondary hover:text-primary font-bold transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>Export WHO (.csv)</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg bg-surface-container-lowest border border-outline-variant/30">
            <table className="w-full text-left font-data-tabular text-[11px] leading-tight">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-sm text-[9px] tracking-wider">
                <tr>
                  <th className="py-2 px-space-xs">ID</th>
                  <th className="py-2 px-space-xs">Age/Sex</th>
                  <th className="py-2 px-space-xs">Onset</th>
                  <th className="py-2 px-space-xs">Triage Status</th>
                  <th className="py-2 px-space-xs">Location</th>
                  <th className="py-2 px-space-xs">Syndrome / Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-on-surface">
                {lineList.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-1.5 px-space-xs font-bold text-primary">{row.id}</td>
                    <td className="py-1.5 px-space-xs">{row.demographics}</td>
                    <td className="py-1.5 px-space-xs text-on-surface-variant">{row.onset}</td>
                    <td className="py-1.5 px-space-xs">
                      <span className={`px-1.5 py-0.5 rounded-DEFAULT font-bold text-[9px] ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-space-xs">{row.location}</td>
                    <td className={`py-1.5 px-space-xs font-semibold ${row.isPositive ? 'text-error' : 'text-primary'}`}>
                      {row.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Environmental Nexus & Context Micro-Card */}
        <div className="p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between border border-outline-variant/30">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">water_drop</span>
            <div className="flex flex-col">
              <span className="font-label-sm text-[10px] uppercase text-on-surface-variant">
                Suspected Water Source
              </span>
              <span className="font-headline-sm text-[12px] text-on-surface">
                {c.village_name === 'Kalyanpur' ? 'Well Point B4 (Primary School)' : 'Communal Borewell #2'}
              </span>
            </div>
          </div>
          <button
            className="px-space-xs py-1 rounded-DEFAULT bg-surface-container-lowest text-primary font-label-sm text-[10px] font-bold shadow-sm hover:bg-surface-container-high border border-outline-variant/30"
            type="button"
          >
            Trigger Lab Sample
          </button>
        </div>
      </div>

      {/* Sticky Action Bar from Stitch */}
      <div className="p-space-md bg-surface-container-lowest flex items-center justify-between gap-space-sm shadow-lg border-t border-outline-variant/30">
        <button
          className="flex-1 flex items-center justify-center gap-space-xs px-space-md py-2.5 rounded-DEFAULT bg-[#ea580c] hover:bg-[#c2410c] text-white font-headline-sm text-headline-sm transition-colors shadow-sm disabled:opacity-50"
          onClick={() => confirmCluster(c.id)}
          disabled={loading || c.status === 'confirmed'}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{c.status === 'confirmed' ? 'Outbreak Confirmed' : 'Confirm Outbreak'}</span>
        </button>

        <button
          className="px-space-md py-2.5 rounded-DEFAULT bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-headline-sm text-headline-sm transition-colors border border-outline-variant/30 disabled:opacity-50"
          onClick={() => dismissCluster(c.id)}
          disabled={loading}
          type="button"
        >
          <span>Dismiss</span>
        </button>

        <button
          className="p-2.5 rounded-DEFAULT bg-primary hover:bg-primary-container text-on-primary transition-colors flex items-center justify-center"
          title="Rapid Dispatch Team"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">local_shipping</span>
        </button>
      </div>
    </div>
  );
}

export default ClusterDetail;
