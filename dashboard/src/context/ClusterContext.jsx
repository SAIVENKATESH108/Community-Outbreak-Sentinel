import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchActiveClusters, confirmCluster, dismissCluster, triggerDetectionSweep } from '../api/clusters';

const ClusterContext = createContext(null);

export function ClusterProvider({ children }) {
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const refreshClusters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveClusters();
      setClusters(data);
      setLastRefreshed(new Date());
      // If previously selected cluster still exists, keep it updated; else select the first one
      if (data && data.length > 0) {
        setSelectedCluster((prev) => {
          if (!prev) return data[0];
          const match = data.find((c) => c.id === prev.id);
          return match || data[0];
        });
      } else {
        setSelectedCluster(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load clusters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshClusters();
  }, [refreshClusters]);

  const handleConfirm = async (clusterId) => {
    setLoading(true);
    try {
      await confirmCluster(clusterId);
      await refreshClusters();
    } catch (err) {
      setError(`Confirm failed: ${err.message}`);
      setLoading(false);
    }
  };

  const handleDismiss = async (clusterId) => {
    setLoading(true);
    try {
      await dismissCluster(clusterId);
      await refreshClusters();
    } catch (err) {
      setError(`Dismiss failed: ${err.message}`);
      setLoading(false);
    }
  };

  const handleRunSweep = async () => {
    setLoading(true);
    try {
      await triggerDetectionSweep();
      await refreshClusters();
    } catch (err) {
      setError(`Sweep failed: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <ClusterContext.Provider
      value={{
        clusters,
        selectedCluster,
        selectCluster: setSelectedCluster,
        loading,
        error,
        lastRefreshed,
        refreshClusters,
        confirmCluster: handleConfirm,
        dismissCluster: handleDismiss,
        runSweep: handleRunSweep,
      }}
    >
      {children}
    </ClusterContext.Provider>
  );
}

export function useClusters() {
  const context = useContext(ClusterContext);
  if (!context) {
    throw new Error('useClusters must be used within a ClusterProvider');
  }
  return context;
}
