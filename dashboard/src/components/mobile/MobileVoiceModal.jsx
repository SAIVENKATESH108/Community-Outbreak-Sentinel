import React, { useState } from 'react';
import { submitVoiceReport } from '../../api/surveillance';

export function MobileVoiceModal({ onClose, onReportSuccess }) {
  const [village, setVillage] = useState('Kalyanpur');
  const [languageHint, setLanguageHint] = useState('sw'); // Swahili / Hindi / English
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extractedResult, setExtractedResult] = useState(null);

  const samplePhrases = [
    {
      label: 'Swahili Sample (Fever & Diarrhea)',
      lang: 'sw',
      text: 'Mtoto wangu ana homa kali sana, anatetemeka na anaharisha tangu jana baada ya kunywa maji ya kisima.'
    },
    {
      label: 'Hindi Sample (Chills & Weakness)',
      lang: 'hi',
      text: 'गांव के 4 लोगों को बहुत तेज बुखार और कंपकंपी है, वो चल भी नहीं पा रहे हैं।'
    },
    {
      label: 'English Sample (Severe Vomiting & Confusion)',
      lang: 'en',
      text: 'My neighbor is burning with high fever, severely vomiting and cannot speak clearly or stand up.'
    }
  ];

  const handleStartVoice = () => {
    // Check for web speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = languageHint === 'sw' ? 'sw-TZ' : languageHint === 'hi' ? 'hi-IN' : 'en-US';
      recognition.interimResults = false;
      recognition.onstart = () => setRecording(true);
      recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setTranscript(text);
        setRecording(false);
      };
      recognition.onerror = () => setRecording(false);
      recognition.onend = () => setRecording(false);
      recognition.start();
    } else {
      // Fallback simulation
      setRecording(true);
      setTimeout(() => {
        setTranscript('Mtoto ana homa kali, anatetemeka na hawezi kusimama.');
        setRecording(false);
      }, 1500);
    }
  };

  const handleProcessVoice = async () => {
    if (!transcript.trim()) return;
    setSubmitting(true);
    try {
      const res = await submitVoiceReport({
        village_name: village,
        raw_transcript: transcript,
        language_hint: languageHint,
        reporter_type: 'resident',
      });
      setExtractedResult(res);
      onReportSuccess && onReportSuccess(res);
    } catch (err) {
      alert(`Voice submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 flex flex-col gap-4 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Voice Assistant</h3>
              <span className="text-[10px] text-slate-500">Gemini Vernacular Medical Intake</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
            &times;
          </button>
        </div>

        {!extractedResult ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Village</label>
                <select
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-medium"
                >
                  <option value="Kalyanpur">Kalyanpur</option>
                  <option value="Dumas">Dumas</option>
                  <option value="Rampur">Rampur</option>
                  <option value="Mohanpur">Mohanpur</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Language</label>
                <select
                  value={languageHint}
                  onChange={(e) => setLanguageHint(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-medium"
                >
                  <option value="sw">Kiswahili (Swahili)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Quick vernacular demo presets */}
            <div className="flex flex-col gap-1 text-[11px]">
              <span className="font-bold text-slate-500">Quick Test Phrases:</span>
              <div className="flex flex-col gap-1">
                {samplePhrases.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setLanguageHint(sp.lang);
                      setTranscript(sp.text);
                    }}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-left text-slate-700 hover:text-emerald-900 border border-slate-200 transition-colors"
                  >
                    <span className="font-bold text-[10px] block text-emerald-700">{sp.label}</span>
                    <span className="truncate block italic text-[10px]">"{sp.text}"</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Transcript Text Area */}
            <div>
              <label className="font-bold text-xs text-slate-600 block mb-1">Voice Transcript / Spoken Words</label>
              <textarea
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Press speak button or type vernacular notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
              />
            </div>

            {/* Hold or Tap to Speak Button */}
            <button
              type="button"
              onClick={handleStartVoice}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                recording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-[#144f44] hover:bg-[#0f3d35] text-white shadow-md'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
              <span>{recording ? 'Listening... Speak now' : 'Hold or Tap to Speak Now'}</span>
            </button>

            {/* Submit */}
            <button
              type="button"
              disabled={!transcript.trim() || submitting}
              onClick={handleProcessVoice}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>Gemini Syndromic Extraction...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  <span>Analyze &amp; Submit Voice Report</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Extraction Feedback */
          <div className="flex flex-col gap-3 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col gap-1.5">
              <span className="font-bold text-emerald-900 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Gemini Syndromic Analysis Complete
              </span>
              <div className="text-[11px] text-emerald-800">
                <strong>Translated:</strong> {extractedResult.gemini_extraction?.translated_english_summary}
              </div>
              <div className="text-[11px] text-emerald-800">
                <strong>Matched Stage:</strong> <span className="font-bold uppercase text-red-600">{extractedResult.stage}</span>
              </div>
              <div className="text-[11px] text-emerald-800">
                <strong>Confidence:</strong> {Math.round((extractedResult.gemini_extraction?.confidence || 0.9) * 100)}%
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
