/**
 * API Client for Surveillance Services:
 * - Field Clinic Reports (CRUD)
 * - Verbal Autopsy Intake
 * - Water Quality Telemetry (CRUD)
 * - Mobile Intervention Dispatches (CRUD)
 * - Transmission Modeling
 */

const API_BASE = '/api/v1';

// --- Symptom Reports CRUD ---
export async function fetchAllReports(villageName = null, limit = 50) {
  let url = `${API_BASE}/reports?limit=${limit}`;
  if (villageName && villageName !== 'All') {
    url += `&village_name=${encodeURIComponent(villageName)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch reports: ${res.statusText}`);
  return res.json();
}

export async function deleteReport(reportId) {
  const res = await fetch(`${API_BASE}/reports/${reportId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete report: ${res.statusText}`);
  return res.json();
}

export async function submitIconReport(payload) {
  const res = await fetch(`${API_BASE}/reports/icon-app`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to submit icon report: ${res.statusText}`);
  return res.json();
}

export async function submitVoiceReport(payload) {
  const res = await fetch(`${API_BASE}/reports/voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to submit voice report: ${res.statusText}`);
  return res.json();
}

// --- Verbal Autopsy Intake ---
export async function submitVerbalAutopsy(payload) {
  const res = await fetch(`${API_BASE}/verbal-autopsy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to submit verbal autopsy: ${res.statusText}`);
  return res.json();
}

// --- Cluster Reports ---
export async function fetchClusterReports(clusterId) {
  const res = await fetch(`${API_BASE}/clusters/${clusterId}/reports`);
  if (!res.ok) throw new Error(`Failed to fetch cluster reports: ${res.statusText}`);
  return res.json();
}

// --- Water Quality Telemetry ---
export async function fetchWaterTests() {
  const res = await fetch(`${API_BASE}/surveillance/water-tests`);
  if (!res.ok) throw new Error(`Failed to fetch water tests: ${res.statusText}`);
  return res.json();
}

export async function createWaterTest(payload) {
  const res = await fetch(`${API_BASE}/surveillance/water-tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to log water sample: ${res.statusText}`);
  return res.json();
}

// --- Intervention Dispatches ---
export async function fetchInterventions() {
  const res = await fetch(`${API_BASE}/surveillance/interventions`);
  if (!res.ok) throw new Error(`Failed to fetch interventions: ${res.statusText}`);
  return res.json();
}

export async function dispatchIntervention(payload) {
  const res = await fetch(`${API_BASE}/surveillance/interventions/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to dispatch intervention: ${res.statusText}`);
  return res.json();
}

// --- Transmission Model ---
export async function fetchTransmissionModel(villageName = 'Kalyanpur') {
  const res = await fetch(`${API_BASE}/surveillance/transmission-model?village_name=${encodeURIComponent(villageName)}`);
  if (!res.ok) throw new Error(`Failed to fetch transmission model: ${res.statusText}`);
  return res.json();
}
