import React, { useState, useEffect } from 'react';

export function AiVoiceSettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  const [telemetry, setTelemetry] = useState(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [activeDialect, setActiveDialect] = useState('sw-TZ (Swahili)');
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [micSensitivity, setMicSensitivity] = useState(85);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/v1/surveillance/ai-models')
      .then((r) => r.json())
      .then((data) => {
        setTelemetry(data);
        if (data.active_model) setSelectedModel(data.active_model);
      })
      .catch((e) => console.warn('Failed to load AI model telemetry:', e));
  }, []);

  const handleSelectModel = async (modelKey) => {
    setSelectedModel(modelKey);
    setSaving(true);
    try {
      await fetch('/api/v1/surveillance/ai-models/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_key: modelKey }),
      });
    } catch (e) {
      console.warn('Error selecting model:', e);
    } finally {
      setSaving(false);
    }
  };

  const modelsList = telemetry?.rate_limits || [
    {
      model: 'Gemini 3.6 Flash',
      key: 'gemini-3.6-flash',
      category: 'Text-out models',
      active: true,
      rpm: '2 / 5',
      rpm_percent: 40,
      tpm: '607 / 250K',
      tpm_percent: 0.24,
      rpd: '10 / 20',
      rpd_percent: 50,
      recommended_for: 'Active Syndromic Extraction & Vernacular NLP'
    },
    {
      model: 'Gemini 3.5 Flash',
      key: 'gemini-3.5-flash',
      category: 'Text-out models',
      active: false,
      rpm: '2 / 5',
      rpm_percent: 40,
      tpm: '95.48K / 250K',
      tpm_percent: 38.2,
      rpd: '13 / 20',
      rpd_percent: 65,
      recommended_for: 'High-Throughput Clinical Parsing'
    },
    {
      model: 'Gemini 3.5 Transcribe Live',
      key: 'gemini-3.5-transcribe-live',
      category: 'Live API',
      active: false,
      rpm: '0 / 3',
      rpm_percent: 0,
      tpm: '0 / 10K',
      tpm_percent: 0,
      rpd: '0 / 25',
      rpd_percent: 0,
      recommended_for: 'Real-time Vernacular Audio Streaming'
    },
    {
      model: 'Gemini 2.5 Flash',
      key: 'gemini-2.5-flash',
      category: 'Text-out models',
      active: false,
      rpm: '0 / 5',
      rpm_percent: 0,
      tpm: '0 / 250K',
      tpm_percent: 0,
      rpd: '0 / 20',
      rpd_percent: 0,
      recommended_for: 'Standard Syndromic Classifier'
    },
    {
      model: 'Gemini 3 Flash',
      key: 'gemini-3-flash',
      category: 'Text-out models',
      active: false,
      rpm: '0 / 5',
      rpm_percent: 0,
      tpm: '0 / 250K',
      tpm_percent: 0,
      rpd: '0 / 20',
      rpd_percent: 0,
      recommended_for: 'Fast Verbal Autopsy Summaries'
    },
    {
      model: 'Antigravity Agents',
      key: 'antigravity-agents',
      category: 'Agents',
      active: false,
      rpm: '0 / 60',
      rpm_percent: 0,
      tpm: '0 / 100K',
      tpm_percent: 0,
      rpd: '0 / 100',
      rpd_percent: 0,
      recommended_for: 'Autonomous Investigation Agent'
    }
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-4xl w-full p-6 border border-outline-variant/30 flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                  Enterprise AI Voice &amp; Gemini Rate Limit Dashboard
                </h2>
                <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-bold text-[10px] uppercase">
                  Live Quota Mesh
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Dynamic model allocation, speech dialect recognition, and 28-day peak usage telemetry.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-xl font-bold p-1 rounded"
          >
            &times;
          </button>
        </div>

        {/* Audio Dialect & Sensitivity Settings Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">
              Active Vernacular Dialect
            </label>
            <select
              value={activeDialect}
              onChange={(e) => setActiveDialect(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-2 text-xs font-semibold text-on-surface"
            >
              <option value="sw-TZ (Swahili)">Kiswahili (Tanzania / Kenya)</option>
              <option value="hi-IN (Hindi)">हिंदी (Hindi - Central Mesh)</option>
              <option value="te-IN (Telugu)">తెలుగు (Telugu - Southern Mesh)</option>
              <option value="yo-NG (Yoruba)">Yorùbá (West Africa)</option>
              <option value="en-US (English)">English (International Standard)</option>
              <option value="fr-FR (French)">Français (Central Africa)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-on-surface-variant">Mic Sensitivity</label>
              <span className="text-xs font-mono font-bold text-primary">{micSensitivity}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={micSensitivity}
              onChange={(e) => setMicSensitivity(parseInt(e.target.value, 10))}
              className="w-full accent-primary cursor-pointer mt-1.5"
            />
          </div>

          <div className="flex items-center justify-between p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/20">
            <div>
              <div className="text-xs font-bold text-on-surface">Field Noise Filter</div>
              <div className="text-[10px] text-on-surface-variant">Attenuate wind &amp; rural ambient noise</div>
            </div>
            <input
              type="checkbox"
              checked={noiseSuppression}
              onChange={(e) => setNoiseSuppression(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
          </div>
        </div>

        {/* Rate Limits by Model Table from User Spec */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">speed</span>
              Rate limits by model &bull; Peak usage per model compared to its limit (Last 28 days)
            </h3>
            {saving && <span className="text-xs text-primary font-bold animate-pulse">Switching Model...</span>}
          </div>

          <div className="overflow-x-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold border-b border-outline-variant/20">
                <tr>
                  <th className="p-3">Model</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">RPM (Requests/Min)</th>
                  <th className="p-3">TPM (Tokens/Min)</th>
                  <th className="p-3">RPD (Requests/Day)</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {modelsList.map((m) => {
                  const isCurrent = selectedModel === m.key;
                  return (
                    <tr
                      key={m.key}
                      className={`transition-colors ${
                        isCurrent ? 'bg-primary/5 font-semibold' : 'hover:bg-surface-container-low/50'
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCurrent ? 'bg-primary animate-pulse' : 'bg-slate-300'
                            }`}
                          ></span>
                          <span className="font-bold text-on-surface">{m.model}</span>
                        </div>
                        <div className="text-[10px] text-on-surface-variant pl-4">{m.recommended_for}</div>
                      </td>
                      <td className="p-3 text-on-surface-variant text-[11px]">{m.category}</td>
                      <td className="p-3">
                        <div className="font-mono text-xs">{m.rpm}</div>
                        <div className="w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.max(5, m.rpm_percent || 0)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-xs">{m.tpm}</div>
                        <div className="w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-secondary rounded-full"
                            style={{ width: `${Math.max(5, m.tpm_percent || 0)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-xs">{m.rpd}</div>
                        <div className="w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${Math.max(5, m.rpd_percent || 0)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        {isCurrent ? (
                          <span className="px-2.5 py-1 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                            Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectModel(m.key)}
                            className="px-2.5 py-1 rounded-lg border border-outline-variant/30 hover:bg-primary hover:text-on-primary text-xs font-semibold transition-colors"
                          >
                            Set Active
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tools & Grounding Quota Cards */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 text-xs">
          <div className="flex items-center justify-between p-2 bg-surface-container-lowest rounded-lg">
            <span className="font-bold text-on-surface">Search Grounding (Web Evidence)</span>
            <span className="font-mono font-bold text-primary">0 / 1.5K Quota</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-surface-container-lowest rounded-lg">
            <span className="font-bold text-on-surface">Map Grounding (Geo-Spatial POIs)</span>
            <span className="font-mono font-bold text-secondary">0 / 500 Quota</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs"
          >
            Apply &amp; Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
