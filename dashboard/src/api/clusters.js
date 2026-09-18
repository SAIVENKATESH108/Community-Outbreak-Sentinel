/**
 * API Client functions for Outbreak Cluster surveillance.
 */

import { API_BASE as ROOT_API_BASE } from './client';

const API_BASE = `${ROOT_API_BASE}/clusters`;

export async function fetchActiveClusters() {
  const response = await fetch(`${API_BASE}/active`);
  if (!response.ok) {
    throw new Error(`Failed to fetch active clusters: ${response.statusText}`);
  }
  return response.json();
}

export async function confirmCluster(clusterId) {
  const response = await fetch(`${API_BASE}/${clusterId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to confirm cluster ${clusterId}: ${response.statusText}`);
  }
  return response.json();
}

export async function dismissCluster(clusterId) {
  const response = await fetch(`${API_BASE}/${clusterId}/dismiss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to dismiss cluster ${clusterId}: ${response.statusText}`);
  }
  return response.json();
}

export async function triggerDetectionSweep() {
  const response = await fetch(`${API_BASE}/run-detection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to trigger detection sweep: ${response.statusText}`);
  }
  return response.json();
}
