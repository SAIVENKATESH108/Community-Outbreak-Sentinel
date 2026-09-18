import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useClusters } from '../context/ClusterContext';

// District village coordinates fallback (Bangalore rural region)
const VILLAGE_COORDS = {
  Kalyanpur: [12.985, 77.580],
  Rampur: [13.042, 77.625],
  Mohanpur: [12.915, 77.512],
  'Mabira Ridge': [12.985, 77.580],
  'Duma Valley': [13.042, 77.625],
  'Kiponda Settlement': [12.915, 77.512],
  'Taveta Outpost': [13.080, 77.660],
  'Nzoia South': [12.870, 77.540],
};

function parseWkbPoint(hex) {
  if (typeof hex !== 'string' || hex.length < 42) return null;
  try {
    const isEwkb = hex.substring(2, 10).toLowerCase() === '01000020';
    const offset = isEwkb ? 18 : 10;
    const lonHex = hex.substring(offset, offset + 16);
    const latHex = hex.substring(offset + 16, offset + 32);

    const lonBuf = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      lonBuf[i] = parseInt(lonHex.substr(i * 2, 2), 16);
    }
    const latBuf = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      latBuf[i] = parseInt(latHex.substr(i * 2, 2), 16);
    }
    const lon = new DataView(lonBuf.buffer).getFloat64(0, true);
    const lat = new DataView(latBuf.buffer).getFloat64(0, true);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return [lat, lon];
    }
  } catch (e) {
    // Ignore and fallback
  }
  return null;
}

function parseLocation(centerLocation, villageName) {
  if (typeof centerLocation === 'string') {
    if (centerLocation.startsWith('POINT')) {
      const match = centerLocation.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (match) {
        const lon = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        return [lat, lon];
      }
    }
    const wkbCoords = parseWkbPoint(centerLocation);
    if (wkbCoords) return wkbCoords;
  }
  return VILLAGE_COORDS[villageName] || [12.985, 77.580];
}

export function ClusterMap() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const hydrologyLayerRef = useRef(null);
  const mobileUnitsLayerRef = useRef(null);
  const clinicsLayerRef = useRef(null);

  const { clusters, selectedCluster, selectCluster } = useClusters();

  // Layer toggle states from Stitch design
  const [layers, setLayers] = useState({
    clusters: true,
    water: true,
    units: false,
    clinics: true,
  });

  const [hoverCoords, setHoverCoords] = useState({ lat: 12.985, lon: 77.580 });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false, // We use custom Stitch controls
        attributionControl: false,
      }).setView([12.985, 77.580], 12);

      // Clean OpenStreetMap layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Layer groups
      hydrologyLayerRef.current = L.layerGroup().addTo(map);
      clinicsLayerRef.current = L.layerGroup().addTo(map);
      mobileUnitsLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);

      // Track mouse coordinates
      map.on('mousemove', (e) => {
        setHoverCoords({
          lat: e.latlng.lat,
          lon: e.latlng.lng,
        });
      });

      mapInstanceRef.current = map;
    }

    return () => {
      // Map stays preserved
    };
  }, []);

  // Update Hydrology, Clinics, and Mobile Units layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Hydrology layer
    const hydro = hydrologyLayerRef.current;
    if (hydro) {
      hydro.clearLayers();
      if (layers.water) {
        // Kallada River Basin simulated polyline
        const riverCoords = [
          [13.060, 77.510],
          [13.020, 77.545],
          [12.985, 77.575],
          [12.950, 77.610],
          [12.915, 77.640],
        ];
        L.polyline(riverCoords, {
          color: '#005c57',
          weight: 4,
          opacity: 0.75,
          dashArray: '8, 4',
        }).bindPopup('<b>Kallada River Basin</b><br/>Downstream catchment').addTo(hydro);

        // Water quality node
        L.circleMarker([12.980, 77.578], {
          radius: 7,
          fillColor: '#ba1a1a',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9,
        }).bindPopup('<b>WQ-Node #4 (Well Point B4)</b><br/>Coliform count elevated').addTo(hydro);
      }
    }

    // Clinics layer
    const clinics = clinicsLayerRef.current;
    if (clinics) {
      clinics.clearLayers();
      if (layers.clinics) {
        const clinicPoints = [
          { name: 'District General Hospital', coords: [12.990, 77.590] },
          { name: 'Kalyanpur Health Post', coords: [12.982, 77.575] },
          { name: 'Rampur Sub-Clinic', coords: [13.040, 77.620] },
        ];
        clinicPoints.forEach((c) => {
          L.circle(c.coords, {
            radius: 1200,
            fillColor: '#abefe8',
            fillOpacity: 0.12,
            color: '#00433f',
            dashArray: '4, 4',
            weight: 1.5,
          }).bindPopup(`<b>${c.name}</b><br/>Catchment Perimeter`).addTo(clinics);
        });
      }
    }

    // Mobile Units layer
    const units = mobileUnitsLayerRef.current;
    if (units) {
      units.clearLayers();
      if (layers.units) {
        const mhuPoints = [
          { name: 'MHU-Bravo', status: 'En route Kalyanpur', coords: [12.995, 77.585] },
          { name: 'MHU-Echo', status: 'Field Testing', coords: [12.930, 77.530] },
        ];
        mhuPoints.forEach((u) => {
          L.circleMarker(u.coords, {
            radius: 8,
            fillColor: '#005c57',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 0.95,
          }).bindPopup(`<b>${u.name}</b><br/>${u.status}`).addTo(units);
        });
      }
    }
  }, [layers]);

  // Update Cluster Markers from Real API Data
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    if (!layers.clusters) return;

    if (!clusters || clusters.length === 0) return;

    const bounds = [];

    clusters.forEach((c) => {
      const coords = parseLocation(c.center_location, c.village_name);
      bounds.push(coords);

      const isSelected = selectedCluster && selectedCluster.id === c.id;
      const isHighRisk = (c.severity_score || 0) >= 0.8;
      const isConfirmed = c.status === 'confirmed';

      const strokeColor = isSelected ? '#00433f' : isHighRisk ? '#ba1a1a' : isConfirmed ? '#ea580c' : '#d97706';
      const fillColor = isHighRisk ? '#ba1a1a' : isConfirmed ? '#ea580c' : '#d97706';

      // Outer ripple / catchment circle
      L.circle(coords, {
        color: strokeColor,
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.35 : 0.2,
        radius: 1200 + (c.case_count || 1) * 70,
        weight: isSelected ? 3 : 1.5,
        dashArray: isSelected ? '4, 4' : null,
      }).addTo(markersLayer);

      // Center pin
      const centerPin = L.circleMarker(coords, {
        radius: isSelected ? 12 : 9,
        fillColor: fillColor,
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 1,
      }).addTo(markersLayer);

      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; min-width: 170px; padding: 4px 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 14px; color: #0b1c30;">${c.village_name}</span>
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; background: ${isHighRisk ? '#ffdad6' : '#fef3c7'}; color: ${isHighRisk ? '#93000a' : '#b45309'};">
              ${c.status.toUpperCase()}
            </span>
          </div>
          <div style="font-size: 12px; color: #3f4947; line-height: 1.5;">
            <div><b>Cases:</b> ${c.case_count} suspected</div>
            <div><b>Severity Score:</b> ${Math.round((c.severity_score || 0) * 100)}%</div>
            <div><b>Status:</b> ${c.status}</div>
          </div>
          <button id="popup-select-${c.id}" style="margin-top: 8px; width: 100%; background: #00433f; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">
            Inspect Dossier
          </button>
        </div>
      `;

      centerPin.bindPopup(popupHtml);

      centerPin.on('popupopen', () => {
        const btn = document.getElementById(`popup-select-${c.id}`);
        if (btn) {
          btn.onclick = () => selectCluster(c);
        }
      });

      centerPin.on('click', () => {
        selectCluster(c);
      });
    });

    if (bounds.length > 0 && !selectedCluster) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [60, 60], maxZoom: 13 });
    }
  }, [clusters, selectedCluster, layers.clusters, selectCluster]);

  // Center on selected cluster when it changes
  useEffect(() => {
    if (selectedCluster && mapInstanceRef.current) {
      const coords = parseLocation(selectedCluster.center_location, selectedCluster.village_name);
      mapInstanceRef.current.flyTo(coords, 13, { duration: 1.2 });
    }
  }, [selectedCluster]);

  const toggleLayer = (layerKey) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleCenter = () => {
    if (mapInstanceRef.current) {
      if (clusters.length > 0) {
        const coords = parseLocation(clusters[0].center_location, clusters[0].village_name);
        mapInstanceRef.current.flyTo(coords, 12.5);
      } else {
        mapInstanceRef.current.flyTo([12.985, 77.580], 12);
      }
    }
  };

  return (
    <section className="relative w-full h-full flex flex-col overflow-hidden bg-surface-container-lowest select-none">
      {/* Top HUD Operational Status Ribbon from Stitch */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-space-sm pointer-events-none">
        {/* Live System Metric Pill */}
        <div className="pointer-events-auto flex items-center gap-space-sm px-space-md py-space-xs bg-surface-container-lowest/95 backdrop-blur-md rounded-lg shadow-sm border border-outline-variant/30">
          <div className="flex items-center gap-space-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
            <span className="w-2 h-2 rounded-full bg-error -ml-3.5"></span>
            <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-bold">
              Active Sentinel Feed
            </span>
          </div>
          <span className="text-outline-variant font-label-md">|</span>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
            <span className="material-symbols-outlined text-[16px] text-primary">satellite_alt</span>
            <span>
              Health Post Sensor Sync: <strong className="text-on-surface font-semibold">Live (PostGIS)</strong>
            </span>
            <span className="px-space-xs py-0.5 rounded-DEFAULT bg-secondary-container text-on-secondary-fixed font-data-tabular text-[10px] font-bold">
              {clusters.length} Cluster{clusters.length !== 1 ? 's' : ''} Active
            </span>
          </div>
        </div>

        {/* Floating GIS Layer Filter Overlays */}
        <div className="pointer-events-auto flex items-center gap-space-xs bg-surface-container-lowest/95 backdrop-blur-md p-space-xs rounded-lg shadow-sm border border-outline-variant/30">
          <div className="flex items-center gap-space-xs px-space-xs font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
            <span className="material-symbols-outlined text-[16px] text-primary">layers</span>
            <span>Layers</span>
          </div>
          <button
            className={`flex items-center gap-space-xxs px-space-sm py-1 rounded-DEFAULT font-label-md text-label-md transition-colors ${
              layers.clusters ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
            }`}
            onClick={() => toggleLayer('clusters')}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">{layers.clusters ? 'check' : 'remove'}</span>
            <span>Clusters</span>
          </button>
          <button
            className={`flex items-center gap-space-xxs px-space-sm py-1 rounded-DEFAULT font-label-md text-label-md transition-colors ${
              layers.water ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
            }`}
            onClick={() => toggleLayer('water')}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">{layers.water ? 'check' : 'remove'}</span>
            <span>Water Catchment</span>
          </button>
          <button
            className={`flex items-center gap-space-xxs px-space-sm py-1 rounded-DEFAULT font-label-md text-label-md transition-colors ${
              layers.units ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
            }`}
            onClick={() => toggleLayer('units')}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">{layers.units ? 'check' : 'remove'}</span>
            <span>Mobile Units</span>
          </button>
          <button
            className={`flex items-center gap-space-xxs px-space-sm py-1 rounded-DEFAULT font-label-md text-label-md transition-colors ${
              layers.clinics ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-on-surface-variant'
            }`}
            onClick={() => toggleLayer('clinics')}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">{layers.clinics ? 'check' : 'remove'}</span>
            <span>Clinics</span>
          </button>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="relative w-full h-full overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Floating Legend Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[400] p-space-md bg-surface-container-lowest/95 backdrop-blur-md rounded-lg shadow-md max-w-xs border border-outline-variant/30 pointer-events-auto">
        <div className="flex items-center justify-between pb-space-xs mb-space-xs border-b border-outline-variant/20">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-bold">
            Surveillance Legend
          </span>
          <span className="material-symbols-outlined text-[15px] text-on-surface-variant">info</span>
        </div>
        <div className="grid grid-cols-2 gap-x-space-md gap-y-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
            <span className="font-body-sm text-[11px] text-on-surface">Escalated (&ge;15)</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]"></span>
            <span className="font-body-sm text-[11px] text-on-surface">Confirmed Cluster</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]"></span>
            <span className="font-body-sm text-[11px] text-on-surface">Detected Anomaly</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-outline"></span>
            <span className="font-body-sm text-[11px] text-on-surface">Baseline / Stable</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between font-label-sm text-[10px] text-on-surface-variant">
          <span>District Mesh #04</span>
          <span>EPSG:4326 PostGIS</span>
        </div>
      </div>

      {/* Floating GIS Viewport Navigation Controls (Top Right) */}
      <div className="absolute top-16 right-4 z-[400] flex flex-col bg-surface-container-lowest rounded-lg shadow-md overflow-hidden border border-outline-variant/30 pointer-events-auto">
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-low transition-colors text-primary"
          onClick={handleZoomIn}
          title="Zoom In"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-low transition-colors text-primary"
          onClick={handleZoomOut}
          title="Zoom Out"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-low transition-colors text-primary"
          onClick={handleCenter}
          title="Center District"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">filter_center_focus</span>
        </button>
      </div>

      {/* Coordinates Micro-HUD Banner (Bottom Right of Map) */}
      <div className="absolute bottom-4 right-4 z-[400] px-space-sm py-1 bg-surface-container-lowest/90 backdrop-blur-sm rounded font-data-tabular text-[11px] text-on-surface-variant flex items-center gap-space-sm border border-outline-variant/30 pointer-events-none">
        <span>LAT: {hoverCoords.lat.toFixed(4)}° N</span>
        <span>LON: {hoverCoords.lon.toFixed(4)}° E</span>
        <span>ELEV: 920m</span>
      </div>
    </section>
  );
}

export default ClusterMap;
