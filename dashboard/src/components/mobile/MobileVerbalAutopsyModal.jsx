import React, { useState } from 'react';
import { submitVerbalAutopsy } from '../../api/surveillance';

export function MobileVerbalAutopsyModal({ onClose, onSuccess }) {
  const [village, setVillage] = useState('Kalyanpur');
  const [decedentName, setDecedentName] = useState('');
  const [ageYears, setAgeYears] = useState('58');
  const [gender, setGender] = useState('male');
  const [narrative, setNarrative] = useState(
    'Patient had severe chills and insomnia 5 days ago, then lost mobility and was unable to stand. Yesterday suffered acute confusion and passed away peacefully at home.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await submitVerbalAutopsy({
        village_name: village,
        decedent_name: decedentName || 'Anonymous Elder',
        age_years: parseInt(ageYears, 10),
        gender: gender,
        raw_narrative: narrative,
        language_hint: 'en',
      });
      setSubmitted(true);
      onSuccess && onSuccess(res);
    } catch (err) {
      alert(`Verbal autopsy intake failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 flex flex-col gap-4 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Report a Death (Care)</h3>
              <span className="text-[10px] text-slate-500">Quiet, dignified &amp; confidential</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
            &times;
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Recording this helps doctors investigate whether community disease is present and send preventive medicine to protect other families.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Village</label>
                <select
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                >
                  <option value="Kalyanpur">Kalyanpur</option>
                  <option value="Dumas">Dumas</option>
                  <option value="Rampur">Rampur</option>
                  <option value="Mohanpur">Mohanpur</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Approx. Age</label>
                <input
                  type="number"
                  value={ageYears}
                  onChange={(e) => setAgeYears(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  min="0"
                  max="120"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Name (or Anonymous)</label>
              <input
                type="text"
                placeholder="e.g. Samuel O. or leave blank"
                value={decedentName}
                onChange={(e) => setDecedentName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">Antecedent Symptoms &amp; Circumstances</label>
              <textarea
                rows={3}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg text-slate-500 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                {submitting && <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>}
                <span>Submit Confidential Record</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
            <div className="font-bold text-slate-800 text-sm">Verbal Autopsy Recorded</div>
            <p className="text-[11px] text-slate-500">
              The epidemiological investigation unit has been updated. Our deepest condolences to the family.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
