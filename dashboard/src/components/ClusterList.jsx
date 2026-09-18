import React, { useState, useMemo } from 'react';
import { useClusters } from '../context/ClusterContext';

export function ClusterList() {
  const { clusters, selectedCluster, selectCluster, loading } = useClusters();
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('severity');

  // Baseline mock clusters to populate district view if few real clusters exist
  const baselineVillages = useMemo(
    () => [
      {
        id: 'nzoia-south-baseline',
        village_name: 'Nzoia South',
        case_count: 0,
        severity_score: 0.05,
        status: 'baseline',
        is_baseline: true,
        pathogen: 'Compliant Water Tests',
        source: 'District Catchment Monitor',
      },
    ],
    []
  );

  const displayList = useMemo(() => {
    const list = [...clusters];
    // If we only have 1 active cluster, show baseline village as context
    if (list.length <= 2) {
      baselineVillages.forEach((b) => {
        if (!list.some((c) => c.village_name === b.village_name)) {
          list.push(b);
        }
      });
    }

    // Filter
    const filtered = list.filter((c) => {
      const isEscalated = (c.severity_score || 0) >= 0.8 || (c.case_count || 0) >= 15;
      if (filterType === 'all') return true;
      if (filterType === 'escalated') return isEscalated;
      if (filterType === 'confirmed') return c.status === 'confirmed';
      if (filterType === 'detected') return c.status === 'detected' && !isEscalated;
      if (filterType === 'baseline') return c.status === 'baseline' || c.case_count === 0;
      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'severity') return (b.severity_score || 0) - (a.severity_score || 0);
      if (sortBy === 'cases') return (b.case_count || 0) - (a.case_count || 0);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [clusters, filterType, sortBy, baselineVillages]);

  const activeCount = clusters.filter((c) => c.status !== 'dismissed').length;

  return (
    <div className="w-full h-full flex flex-col bg-surface-container-lowest overflow-hidden">
      {/* Header Controls & Filters from Stitch */}
      <div className="p-space-md bg-surface-container-low flex flex-col gap-space-sm border-b border-outline-variant/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">radar</span>
            <h1 className="font-headline-sm text-headline-sm text-on-surface">Active Clusters</h1>
            <span className="px-space-xs py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">
              {activeCount} Action Required
            </span>
          </div>

          {/* Sort Selector Dropdown */}
          <div className="relative">
            <select
              aria-label="Sort clusters"
              className="h-8 pl-space-xs pr-6 bg-surface-container-lowest text-on-surface font-label-md text-label-md rounded-DEFAULT border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="severity">Sort: Severity (High)</option>
              <option value="cases">Sort: Case Count</option>
              <option value="date">Sort: Detection Date</option>
            </select>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant absolute right-1.5 top-2 pointer-events-none">
              arrow_drop_down
            </span>
          </div>
        </div>

        {/* Quick Filter Status Pills */}
        <div className="flex items-center gap-space-xs overflow-x-auto pb-1 no-scrollbar text-nowrap">
          {[
            { key: 'all', label: `All (${displayList.length})` },
            { key: 'escalated', label: 'Escalated' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'detected', label: 'Detected' },
            { key: 'baseline', label: 'Baseline' },
          ].map((pill) => (
            <button
              key={pill.key}
              className={`px-space-sm py-1 rounded-DEFAULT font-label-md text-label-md transition-all ${
                filterType === pill.key
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setFilterType(pill.key)}
              type="button"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Cluster Cards Container */}
      <div className="flex-1 overflow-y-auto p-space-md space-y-space-sm">
        {loading && clusters.length === 0 && (
          <div className="p-space-lg text-center text-on-surface-variant text-body-sm">
            <span className="material-symbols-outlined animate-spin text-primary text-[28px] mb-2">sync</span>
            <p>Scanning district epidemiological telemetry...</p>
          </div>
        )}

        {displayList.map((c) => {
          const isSelected = selectedCluster && selectedCluster.id === c.id;
          const isEscalated = (c.severity_score || 0) >= 0.8 || (c.case_count || 0) >= 15;
          const isConfirmed = c.status === 'confirmed';
          const isBaseline = c.status === 'baseline' || c.case_count === 0;

          const barColor = isEscalated ? 'bg-error' : isConfirmed ? 'bg-[#ea580c]' : isBaseline ? 'bg-outline-variant' : 'bg-[#d97706]';

          return (
            <article
              key={c.id}
              onClick={() => selectCluster(c)}
              className={`group relative bg-surface-container-lowest p-space-md rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border ${
                isSelected ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/30'
              }`}
            >
              {/* Left Accent Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${barColor}`}></div>

              {/* Card Header */}
              <div className="flex items-start justify-between gap-space-sm mb-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span
                    className={`px-space-xs py-0.5 rounded-DEFAULT font-label-sm text-label-sm font-bold uppercase tracking-wider ${
                      isEscalated
                        ? 'bg-error-container text-on-error-container'
                        : isConfirmed
                        ? 'bg-[#ffedd5] text-[#c2410c]'
                        : isBaseline
                        ? 'bg-surface-container-low text-on-surface-variant'
                        : 'bg-[#fef3c7] text-[#b45309]'
                    }`}
                  >
                    {isEscalated
                      ? 'Critical • Phase 3'
                      : isConfirmed
                      ? 'High • Confirmed'
                      : isBaseline
                      ? 'Baseline Stable'
                      : 'Moderate Anomaly'}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {c.is_baseline ? 'Standard Monitor' : 'DETECTION +48H'}
                  </span>
                </div>

                {!isBaseline && (
                  <div
                    className={`flex items-center gap-1 font-headline-sm text-[12px] font-bold ${
                      isEscalated ? 'text-error' : isConfirmed ? 'text-[#c2410c]' : 'text-[#b45309]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    <span>Surge (+{Math.max(3, Math.round((c.case_count || 1) * 0.7))})</span>
                  </div>
                )}
              </div>

              {/* Village Title & Case Metric */}
              <div className="flex items-baseline justify-between mb-space-xs">
                <h2 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                  {c.village_name}
                </h2>
                <div className="flex items-baseline gap-1">
                  <span className="font-data-metric text-data-metric text-on-surface">{c.case_count || 0}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase">Suspected</span>
                </div>
              </div>

              {/* Pathogen & Nexus Details */}
              <div className="space-y-1 mb-space-sm">
                <div className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
                  <span
                    className={`material-symbols-outlined text-[15px] ${
                      isEscalated ? 'text-error' : isConfirmed ? 'text-[#ea580c]' : 'text-[#d97706]'
                    }`}
                  >
                    coronavirus
                  </span>
                  <span>
                    Pattern:{' '}
                    <strong className="text-on-surface font-semibold">
                      {isEscalated
                        ? 'Cold/Insomnia → Mobility Loss → Confusion'
                        : isConfirmed
                        ? 'Rapid Enteric Syndrome'
                        : 'Syndromic Anomaly Cluster'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[15px] text-primary">water_drop</span>
                  <span>
                    Nexus:{' '}
                    <strong className="text-on-surface">
                      {c.village_name === 'Kalyanpur' ? 'Well Point B4 (Primary School)' : 'Communal Borewell #2'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Mini Sparkline & Inspect Button */}
              <div className="pt-space-xs flex items-center justify-between border-t border-outline-variant/20">
                {!isBaseline ? (
                  <div className="flex items-center gap-space-xs">
                    <svg className="w-20 h-4" fill="none" viewBox="0 0 80 16">
                      <path
                        d="M 0,14 L 16,12 L 32,11 L 48,8 L 64,5 L 80,2"
                        stroke={isEscalated ? '#ba1a1a' : isConfirmed ? '#ea580c' : '#d97706'}
                        strokeLinecap="round"
                        strokeWidth="2"
                      />
                      <circle
                        cx="80"
                        cy="2"
                        fill={isEscalated ? '#ba1a1a' : isConfirmed ? '#ea580c' : '#d97706'}
                        r="2.5"
                      />
                    </svg>
                    <span className="font-label-sm text-[10px] text-on-surface-variant">
                      {Math.round((c.severity_score || 0.5) * 120)}% 36h Velocity
                    </span>
                  </div>
                ) : (
                  <span className="font-label-sm text-[10px] text-on-surface-variant">
                    Compliant testing over 14 rolling days
                  </span>
                )}

                <button
                  className="flex items-center gap-1 font-label-md text-label-md text-primary font-bold group-hover:translate-x-0.5 transition-transform"
                  type="button"
                >
                  <span>Inspect Dossier</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default ClusterList;
