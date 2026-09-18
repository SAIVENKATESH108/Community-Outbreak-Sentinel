import React, { useState } from 'react';
import { submitIconReport } from '../../api/surveillance';

export function MobileSymptomWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState('EN');

  // Enterprise Personal & Relationship Details
  const [relationship, setRelationship] = useState('Self');
  const [patientName, setPatientName] = useState('Salim K.');
  const [patientAge, setPatientAge] = useState('32');
  const [patientGender, setPatientGender] = useState('Male');
  const [phoneNumber, setPhoneNumber] = useState('+91 98451 22340');
  const [nationalIdOrAbha, setNationalIdOrAbha] = useState('ABHA-9821-4401-2093');

  // Geographic Hierarchy
  const [country, setCountry] = useState('India');
  const [stateProvince, setStateProvince] = useState('Karnataka');
  const [district, setDistrict] = useState('Barani District #04');
  const [subCounty, setSubCounty] = useState('Zone 3 South');
  const [village, setVillage] = useState('Kalyanpur');
  const [streetAddress, setStreetAddress] = useState('House #14, School Well Road');

  // Family & Household Details
  const [householdHead, setHouseholdHead] = useState('Rameshwar Yadav');
  const [householdSerialNo, setHouseholdSerialNo] = useState('HH-2026-KL-001');
  const [familyCount, setFamilyCount] = useState('5');
  const [symptomaticCount, setSymptomaticCount] = useState('2');
  const [waterSource, setWaterSource] = useState('Communal Well Point B4 (Primary School)');
  const [sanitationType, setSanitationType] = useState('Private Pit Latrine');

  // Syndromic Symptoms (Stitch 6-card grid)
  const [selectedSymptoms, setSelectedSymptoms] = useState(['fever_chills', 'confused_dazed']);
  const [durationDays, setDurationDays] = useState('2 days');
  const [submitting, setSubmitting] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const symptomCards = [
    {
      id: 'fever_chills',
      title: language === 'EN' ? 'Hot Fever / Chills' : 'Homa Kali / Kutetemeka',
      subtitle: language === 'EN' ? 'Body burning or shaking' : 'Mwili kuwaka moto au kutetemeka',
      icon: 'thermostat',
      stage: 'cold_insomnia',
    },
    {
      id: 'cant_sleep',
      title: language === 'EN' ? "Can't Sleep" : 'Kukosa Usingizi',
      subtitle: language === 'EN' ? 'Eyes open, restless' : 'Macho wazi, kutotulia',
      icon: 'bedtime',
      stage: 'cold_insomnia',
    },
    {
      id: 'cant_walk',
      title: language === 'EN' ? "Can't Walk" : 'Kushindwa Kutembea',
      subtitle: language === 'EN' ? 'Too weak to stand' : 'Udhaifu mkubwa wa miguu',
      icon: 'accessible',
      stage: 'mobility_loss',
    },
    {
      id: 'confused_dazed',
      title: language === 'EN' ? 'Confused / Dazed' : 'Kuvurugika Akili',
      subtitle: language === 'EN' ? 'Cannot talk or think' : 'Huwezi kuongea au kufikiri',
      icon: 'psychology_alt',
      stage: 'confusion',
    },
    {
      id: 'watery_diarrhea',
      title: language === 'EN' ? 'Watery Diarrhea' : 'Kuhara Majimaji',
      subtitle: language === 'EN' ? 'Frequent toilet / stool' : 'Kuhara mara kwa mara',
      icon: 'water_damage',
      stage: 'mobility_loss',
    },
    {
      id: 'severe_vomiting',
      title: language === 'EN' ? 'Severe Vomiting' : 'Kutapika Sana',
      subtitle: language === 'EN' ? 'Cannot hold clean water' : 'Huwezi kuzuia maji tumboni',
      icon: 'local_drink',
      stage: 'mobility_loss',
    },
  ];

  const toggleSymptom = (id) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const determineStage = () => {
    if (selectedSymptoms.includes('confused_dazed')) return 'confusion';
    if (
      selectedSymptoms.includes('cant_walk') ||
      selectedSymptoms.includes('watery_diarrhea') ||
      selectedSymptoms.includes('severe_vomiting')
    ) {
      return 'mobility_loss';
    }
    return 'cold_insomnia';
  };

  const playAudioPrompt = (text) => {
    if ('speechSynthesis' in window) {
      setAudioPlaying(true);
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.onend = () => setAudioPlaying(false);
      u.onerror = () => setAudioPlaying(false);
      window.speechSynthesis.speak(u);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const stage = determineStage();
    const payload = {
      village_name: village,
      subject_name: patientName || 'Anonymous Community Member',
      ward_or_area: subCounty,
      symptom_stage: stage,
      selected_symptoms: selectedSymptoms,
      reporter_type: relationship === 'CHW / ASHA Worker' ? 'chw' : 'resident',
      notes: `Relationship: ${relationship}. Head of family: ${householdHead} (${householdSerialNo}). Family size: ${familyCount}, Symptomatic in household: ${symptomaticCount}. Phone: ${phoneNumber}. ABHA/ID: ${nationalIdOrAbha}. Water: ${waterSource}. Address: ${streetAddress}, ${village}, ${district}, ${stateProvince}, ${country}.`,
    };

    try {
      const res = await submitIconReport(payload);
      onComplete && onComplete(res);
    } catch (err) {
      console.warn('Network issue, queueing offline:', err);
      const offlineQueue = JSON.parse(localStorage.getItem('sentinel_offline_reports') || '[]');
      const offlineRecord = {
        ...payload,
        report_id: `offline-${Date.now()}`,
        is_offline_queued: true,
      };
      offlineQueue.push(offlineRecord);
      localStorage.setItem('sentinel_offline_reports', JSON.stringify(offlineQueue));
      onComplete && onComplete(offlineRecord);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#f8fafc] text-slate-800 select-none">
      {/* 1. STICKY TOP HEADER */}
      <div className="flex-shrink-0 bg-white px-4 py-2.5 border-b border-slate-200 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (step > 1) setStep(step - 1);
              else onCancel && onCancel();
            }}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-600"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="w-6 h-6 rounded bg-[#144f44] flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[15px]">medical_services</span>
          </div>
          <span className="font-bold text-xs text-slate-800">
            Step {step} of 4: {step === 1 ? 'Patient Details' : step === 2 ? 'What hurts?' : step === 3 ? 'Household & Water' : 'Review & Submit'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:1199"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200"
          >
            <span className="material-symbols-outlined text-[13px]">call</span>
            <span>1199</span>
          </a>
          <button
            onClick={() => playAudioPrompt(language === 'EN' ? 'Please fill in patient and symptom details.' : 'Tafadhali jaza maelezo ya mgonjwa na dalili.')}
            className="p-1 rounded-full bg-slate-100 text-slate-600"
          >
            <span className="material-symbols-outlined text-[16px]">volume_up</span>
          </button>
        </div>
      </div>

      {/* 2. STEP PROGRESS BAR */}
      <div className="flex-shrink-0 flex items-center justify-center gap-1.5 py-2 bg-white border-b border-slate-100">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            onClick={() => setStep(s)}
            className={`cursor-pointer transition-all ${
              step === s
                ? 'w-10 h-1.5 bg-[#144f44] rounded-full'
                : step > s
                ? 'w-3 h-1.5 bg-emerald-500 rounded-full'
                : 'w-3 h-1.5 bg-slate-200 rounded-full'
            }`}
          ></div>
        ))}
      </div>

      {/* 3. SCROLLABLE FORM CONTENT (min-h-0 ensures scroll works without pushing footer) */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0 flex flex-col gap-3">
        {/* STEP 1: COMPREHENSIVE PERSON & RELATIONSHIP DETAILS */}
        {step === 1 && (
          <div className="flex flex-col gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Section A: Relationship to Patient
              </span>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  What is your relationship to the sick person?
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:ring-1 focus:ring-[#144f44]"
                >
                  <option value="Self">Self (I am reporting for myself)</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Child">Child (Son / Daughter)</option>
                  <option value="Sibling">Sibling (Brother / Sister)</option>
                  <option value="CHW / ASHA Worker">ASHA Worker / Community Health Volunteer</option>
                  <option value="Guardian">Guardian / Caretaker</option>
                  <option value="Neighbor">Neighbor / Community Resident</option>
                  <option value="Village Elder">Village Head / Elder</option>
                </select>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Section B: Patient Identity &amp; Health ID
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800"
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800"
                    placeholder="e.g. 32"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other / Non-binary</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800"
                    placeholder="+91 98451 22340"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">National Health ID / ABHA # / Serial No</label>
                <input
                  type="text"
                  value={nationalIdOrAbha}
                  onChange={(e) => setNationalIdOrAbha(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-[11px] text-slate-800"
                  placeholder="ABHA-9821-4401-2093"
                />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Section C: Geographic Hierarchy &amp; Residence
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">State / Province</label>
                  <input
                    type="text"
                    value={stateProvince}
                    onChange={(e) => setStateProvince(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Village Location</label>
                  <select
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-[#144f44]"
                  >
                    <option value="Kalyanpur">Kalyanpur (Outbreak Zone)</option>
                    <option value="Dumas">Dumas</option>
                    <option value="Rampur">Rampur</option>
                    <option value="Mohanpur">Mohanpur</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">House No. / Street Address</label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800"
                  placeholder="House #14, School Well Road"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: "WHAT HURTS?" 6-CARD GRID */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            {/* Audio Banner */}
            <div className="bg-[#dcfce7] p-2.5 rounded-xl flex items-center justify-between border border-[#bbf7d0]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playAudioPrompt(language === 'EN' ? 'Tap all pictures that match how you feel.' : 'Gusa picha zote zinazolingana na maumivu yako.')}
                  className="w-8 h-8 rounded-lg bg-[#144f44] text-white flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">volume_up</span>
                </button>
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    {language === 'EN' ? 'Listen in English / Swahili' : 'Sikiliza kwa Kiswahili'}
                  </div>
                  <div className="text-[10px] text-emerald-800">Tap to hear instructions aloud</div>
                </div>
              </div>

              <div className="flex items-center bg-white rounded-md p-0.5 border border-emerald-300">
                <button
                  type="button"
                  onClick={() => setLanguage('EN')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                    language === 'EN' ? 'bg-[#144f44] text-white' : 'text-slate-600'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('SWA')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                    language === 'SWA' ? 'bg-[#144f44] text-white' : 'text-slate-600'
                  }`}
                >
                  SWA
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-slate-900 flex items-center gap-1.5">
                  <span>{language === 'EN' ? 'What hurts?' : 'Unaumwa nini?'}</span>
                  <span className="material-symbols-outlined text-[18px] text-slate-400">volume_up</span>
                </h1>
                <p className="text-[11px] text-slate-500">
                  {language === 'EN' ? 'Tap all pictures that match how you feel' : 'Gusa picha zote zinazolingana na maumivu yako'}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                STEP 2 OF 4
              </span>
            </div>

            {/* 6 Symptom Cards (2x3 grid) */}
            <div className="grid grid-cols-2 gap-2.5">
              {symptomCards.map((card) => {
                const isSelected = selectedSymptoms.includes(card.id);
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => toggleSymptom(card.id)}
                    className={`p-3 rounded-2xl flex flex-col justify-between min-h-[125px] text-left transition-all shadow-sm ${
                      isSelected
                        ? 'bg-[#144f44] text-white shadow-md ring-2 ring-[#144f44]'
                        : 'bg-white border border-slate-200 text-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-emerald-300 text-[#144f44]' : 'bg-slate-100 border border-slate-300'
                        }`}
                      >
                        {isSelected && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className={`font-bold text-xs leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                        {card.title}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {card.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selection Counter */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-slate-700">{selectedSymptoms.length} symptoms chosen</span>
              {selectedSymptoms.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSymptoms([])}
                  className="text-xs text-slate-500 underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: HOUSEHOLD & ENVIRONMENTAL WATER DETAILS */}
        {step === 3 && (
          <div className="flex flex-col gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Family &amp; Household Unit
              </span>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Head of Household / Family</label>
                <input
                  type="text"
                  value={householdHead}
                  onChange={(e) => setHouseholdHead(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Household Serial / Ration ID</label>
                  <input
                    type="text"
                    value={householdSerialNo}
                    onChange={(e) => setHouseholdSerialNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Total Family Size</label>
                  <input
                    type="number"
                    value={familyCount}
                    onChange={(e) => setFamilyCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-error block mb-1">Members with Similar Symptoms</label>
                <input
                  type="number"
                  value={symptomaticCount}
                  onChange={(e) => setSymptomaticCount(e.target.value)}
                  className="w-full bg-slate-50 border border-error/30 rounded-xl p-2 text-error font-bold"
                />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Water Source &amp; Environmental Exposure
              </span>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Primary Drinking Water Source</label>
                <select
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                >
                  <option value="Communal Well Point B4 (Primary School)">Communal Well Point B4 (Mabira / School)</option>
                  <option value="River Catchment / Lower Estuary Runoff">River Catchment / Estuary Runoff</option>
                  <option value="Deep Aquifer Borewell #2">Deep Aquifer Borewell #2</option>
                  <option value="Municipal Piped Standpost">Municipal Piped Standpost</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Sanitation / Latrine Facility</label>
                <select
                  value={sanitationType}
                  onChange={(e) => setSanitationType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                >
                  <option value="Private Pit Latrine">Private Pit Latrine</option>
                  <option value="Shared Community Toilet">Shared Community Toilet</option>
                  <option value="Open Defecation Area / Field">Open Defecation Area / Field</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Illness Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Today', '1-2 days', '3+ days'].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setDurationDays(dur)}
                      className={`py-2 rounded-lg border font-bold text-center transition-all ${
                        durationDays === dur
                          ? 'bg-[#144f44] text-white border-[#144f44]'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & SUBMIT */}
        {step === 4 && (
          <div className="flex flex-col gap-3 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Step 4 of 4: Epidemiological Dossier Summary
              </span>
              <h2 className="text-base font-bold text-slate-900">Ready to transmit verified report</h2>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col gap-1.5 text-[11px] mt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold text-slate-800">{patientName} ({patientAge}y, {patientGender})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Relationship:</span>
                  <span className="font-bold text-[#144f44]">{relationship}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-bold text-slate-800">{streetAddress}, {village}, {district}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Household:</span>
                  <span className="font-bold text-slate-800">{householdHead} ({householdSerialNo}) &bull; {familyCount} members</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Water Source:</span>
                  <span className="font-bold text-amber-700">{waterSource}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-500 font-bold">Syndromic Classification:</span>
                  <span className="font-bold uppercase text-red-600">
                    {determineStage().replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. GUARANTEED VISIBLE BOTTOM ACTION BAR (Sticky & Fixed) */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 p-3 shadow-lg z-30 flex items-center gap-2.5">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Back
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="flex-1 py-3 rounded-xl bg-[#144f44] hover:bg-[#0f3d35] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
          >
            <span>Continue Step</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                <span>Transmitting Dossier...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>Submit to Sentinel</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
