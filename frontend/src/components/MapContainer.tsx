import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Node, RouteDetail } from '../types';
import { Truck, Crosshair, Zap, AlertTriangle } from 'lucide-react';

interface MapViewProps {
  nodes: Node[];
  activeRoutes: RouteDetail[];
  beforeRoutes?: RouteDetail[];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  hoveredRouteId?: string | null;
  onHoverRoute?: (routeId: string | null) => void;
}

type BasemapStyle = 'voyager' | 'positron' | 'dark' | 'satellite';

const CARTO_KEY = 'cb1_4eza_1_ea434116e18570961f4b45dd';

const BASEMAP_OPTIONS: Record<BasemapStyle, { name: string; url: string; attribution: string }> = {
  voyager: {
    name: 'Voyager',
    url: `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_KEY}`,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  positron: {
    name: 'Positron',
    url: `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${CARTO_KEY}`,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  dark: {
    name: 'Dark Matter',
    url: `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO_KEY}`,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  satellite: {
    name: 'Satellite Topo',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  }
};

const createCustomIcon = (type: 'farm' | 'hub' | 'market', label: string, produceIcon?: string, isSelected?: boolean) => {
  let badgeGradient = 'from-emerald-500 to-teal-700 border-white';
  let iconContent = produceIcon || '🌾';

  if (type === 'farm') {
    badgeGradient = 'from-emerald-600 to-green-700 border-white';
    iconContent = produceIcon || '🌾';
  } else if (type === 'hub') {
    badgeGradient = 'from-cyan-600 to-blue-700 border-white';
    iconContent = '🧊';
  } else if (type === 'market') {
    badgeGradient = 'from-purple-600 to-indigo-700 border-white';
    iconContent = '🛒';
  }

  const selectedRing = isSelected ? 'ring-4 ring-[#2D3748] scale-125' : '';

  const html = `
    <div class="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr ${badgeGradient} border-2 shadow-[0_4px_10px_rgba(0,0,0,0.25)] text-white font-bold text-sm transform hover:scale-110 transition-all duration-200 ${selectedRing}">
      <span class="text-lg drop-shadow">${iconContent}</span>
      <div class="absolute -bottom-5 whitespace-nowrap bg-white/95 backdrop-blur text-[#1C2026] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#D0C9BD] shadow-md">
        ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const createMovingTruckIcon = (produceIcon: string, isHighlighted: boolean) => {
  const highlightClass = isHighlighted 
    ? 'ring-4 ring-amber-400 scale-125 bg-amber-400 text-slate-950' 
    : 'bg-[#1C2026] text-[#E2DED6]';

  const html = `
    <div class="flex items-center justify-center w-7 h-7 rounded-xl ${highlightClass} border border-white/80 shadow-[0_4px_10px_rgba(0,0,0,0.35)] transition-all">
      <span class="text-xs">${produceIcon || '🚚'}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-truck',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const MapRecenter: React.FC<{ nodes: Node[]; triggerRecenterCount: number }> = ({ nodes, triggerRecenterCount }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    
    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => {
        map.invalidateSize();
        if (nodes && nodes.length > 0) {
          const bounds = L.latLngBounds(nodes.map(n => [n.lat, n.lng]));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        }
      }, 250),
      setTimeout(() => map.invalidateSize(), 600)
    ];

    return () => timers.forEach(clearTimeout);
  }, [nodes, map, triggerRecenterCount]);

  return null;
};

export const LogisticsMap: React.FC<MapViewProps> = ({
  nodes,
  activeRoutes,
  beforeRoutes = [],
  selectedNodeId,
  onSelectNode,
  hoveredRouteId,
  onHoverRoute
}) => {
  const [basemap, setBasemap] = useState<BasemapStyle>('voyager');
  const [stageFilter, setStageFilter] = useState<'all' | 'farm_to_hub' | 'hub_to_market' | 'direct_farm_market'>('all');
  const [recenterCount, setRecenterCount] = useState<number>(0);
  const [truckProgress, setTruckProgress] = useState<number>(0);
  const [showBefore, setShowBefore] = useState<boolean>(false);

  const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));

  const centerLat = nodes.length > 0 ? nodes.reduce((sum, n) => sum + n.lat, 0) / nodes.length : 36.7;
  const centerLng = nodes.length > 0 ? nodes.reduce((sum, n) => sum + n.lng, 0) / nodes.length : -119.8;

  // Animation ticker for moving trucks along routes
  useEffect(() => {
    const interval = setInterval(() => {
      setTruckProgress((prev) => (prev >= 1 ? 0.05 : prev + 0.025));
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const filteredRoutes = stageFilter === 'all'
    ? activeRoutes
    : activeRoutes.filter(r => r.stage === stageFilter);

  const filteredBeforeRoutes = stageFilter === 'all'
    ? beforeRoutes
    : beforeRoutes.filter(r => r.stage === stageFilter);

  const displayRoutes = showBefore ? filteredBeforeRoutes : filteredRoutes;

  // Compute quick comparison stats for the toggle badge
  const beforeTotalCost = beforeRoutes.reduce((s, r) => s + r.transport_cost_usd + r.spoilage_loss_usd, 0);
  const afterTotalCost = activeRoutes.reduce((s, r) => s + r.transport_cost_usd + r.spoilage_loss_usd, 0);
  const savingsPct = beforeTotalCost > 0 ? Math.round((1 - afterTotalCost / beforeTotalCost) * 100) : 0;

  return (
    <div className="relative w-full h-[520px] lg:h-[640px] rounded-3xl overflow-hidden border border-[#D0C9BD] shadow-[0_12px_30px_rgba(0,0,0,0.1)] bg-[#E2DED6]">
      
      {/* Top Left: Interactive Legend with Stage Filters */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#D0C9BD] shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setStageFilter(stageFilter === 'farm_to_hub' ? 'all' : 'farm_to_hub')}
          className={`flex items-center space-x-1.5 font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
            stageFilter === 'farm_to_hub'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
          }`}
          title="Filter Farm-to-Hub routes only"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>Farms ({nodes.filter(n => n.type === 'farm').length})</span>
        </button>

        <button
          onClick={() => setStageFilter(stageFilter === 'hub_to_market' ? 'all' : 'hub_to_market')}
          className={`flex items-center space-x-1.5 font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
            stageFilter === 'hub_to_market'
              ? 'bg-cyan-600 text-white border-cyan-700 shadow-sm'
              : 'text-cyan-800 bg-cyan-50 border-cyan-200 hover:bg-cyan-100'
          }`}
          title="Filter Hub-to-Market routes only"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span>Cold Hubs ({nodes.filter(n => n.type === 'hub').length})</span>
        </button>

        <button
          onClick={() => setStageFilter(stageFilter === 'direct_farm_market' ? 'all' : 'direct_farm_market')}
          className={`flex items-center space-x-1.5 font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
            stageFilter === 'direct_farm_market'
              ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
              : 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100'
          }`}
          title="Filter Direct Farm-to-Market routes only"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Direct ({nodes.filter(n => n.type === 'market').length})</span>
        </button>
        
        <div className="border-l border-[#D0C9BD] pl-2 flex items-center space-x-1.5 text-[#1C2026] font-bold">
          <Truck className="w-3.5 h-3.5 text-[#1C2026]" />
          <span>Showing: {filteredRoutes.length}/{activeRoutes.length}</span>
        </div>

        {stageFilter !== 'all' && (
          <button
            onClick={() => setStageFilter('all')}
            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#E2DED6] text-[#1C2026] border border-[#BCB4A4] hover:bg-[#D6D0C5] transition-all cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Top Right: Recenter Button + Basemap Selector */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center space-x-2">
        <button
          onClick={() => setRecenterCount(c => c + 1)}
          className="btn-depth-secondary flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-bold cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          title="Recenter Map View on Nodes"
        >
          <Crosshair className="w-4 h-4 text-[#1C2026]" />
          <span>Recenter Map</span>
        </button>

        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#D0C9BD] shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex items-center space-x-1">
          {(Object.keys(BASEMAP_OPTIONS) as BasemapStyle[]).map(key => (
            <button
              key={key}
              onClick={() => setBasemap(key)}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                basemap === key
                  ? 'btn-depth-primary shadow-sm'
                  : 'text-[#5C6470] hover:text-[#1C2026] hover:bg-[#F5F3EF]'
              }`}
            >
              {BASEMAP_OPTIONS[key].name}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Centre: Before / After Optimization Toggle */}
      {beforeRoutes.length > 0 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center space-y-2">
          {/* Savings badge above toggle – only visible in After mode */}
          {!showBefore && savingsPct > 0 && (
            <div className="flex items-center space-x-1.5 bg-emerald-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg animate-bounce">
              <Zap className="w-3 h-3" />
              <span>QUANTUM SAVES {savingsPct}% COST vs NAIVE</span>
            </div>
          )}
          {showBefore && (
            <div className="flex items-center space-x-1.5 bg-rose-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg">
              <AlertTriangle className="w-3 h-3" />
              <span>UNOPTIMIZED — {beforeRoutes.length} ROUTES ACTIVE (HIGH COST)</span>
            </div>
          )}

          {/* Toggle pill */}
          <button
            onClick={() => setShowBefore(v => !v)}
            className="relative flex items-center bg-white/95 backdrop-blur-md rounded-full border border-[#D0C9BD] shadow-[0_8px_24px_rgba(0,0,0,0.18)] overflow-hidden cursor-pointer transition-all hover:shadow-[0_10px_28px_rgba(0,0,0,0.22)] hover:-translate-y-0.5"
            style={{ padding: '3px' }}
            title="Toggle before/after optimization view"
          >
            {/* Before pill segment */}
            <span
              className={`relative z-10 flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-extrabold transition-all duration-300 ${
                showBefore
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-[#7A8492] hover:text-rose-600'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Before</span>
            </span>

            <span className="text-[#D0C9BD] font-bold text-[10px] px-1">|</span>

            {/* After pill segment */}
            <span
              className={`relative z-10 flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-extrabold transition-all duration-300 ${
                !showBefore
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-[#7A8492] hover:text-emerald-600'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>After Optimization</span>
            </span>
          </button>
        </div>
      )}

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={8}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <MapRecenter nodes={nodes} triggerRecenterCount={recenterCount} />
        
        <TileLayer
          key={basemap}
          attribution={BASEMAP_OPTIONS[basemap].attribution}
          url={BASEMAP_OPTIONS[basemap].url}
        />

        {/* Delivery routes — rendered differently based on before/after mode */}
        {displayRoutes.map((route, idx) => {
          const sourceNode = nodeMap.get(route.source);
          const targetNode = nodeMap.get(route.target);

          if (!sourceNode || !targetNode) return null;

          const isDirect = route.stage === 'direct_farm_market';
          const isHighlighted = hoveredRouteId === route.edge_id;

          // Before mode: muted grey-red palette to show problem state
          // After mode: vivid optimized palette
          let strokeColor: string;
          if (showBefore) {
            strokeColor = isDirect ? '#EF4444' : route.stage === 'farm_to_hub' ? '#F97316' : '#DC2626';
          } else {
            strokeColor = isHighlighted
              ? '#EC4899'
              : isDirect ? '#D97706' : route.stage === 'farm_to_hub' ? '#059669' : '#0284C7';
          }

          const baseWeight = showBefore ? 2 : Math.max(3, Math.min(5, route.tons / 3));
          const baseOpacity = showBefore ? 0.55 : 0.95;

          // Compute animated moving truck position along interpolation vector (only in after mode)
          const truckLat = sourceNode.lat + (targetNode.lat - sourceNode.lat) * truckProgress;
          const truckLng = sourceNode.lng + (targetNode.lng - sourceNode.lng) * truckProgress;

          return (
            <React.Fragment key={`${route.edge_id}-${idx}`}>
              {/* Route shadow / glow (thicker in after mode, subtle in before) */}
              <Polyline
                positions={[
                  [sourceNode.lat, sourceNode.lng],
                  [targetNode.lat, targetNode.lng]
                ]}
                pathOptions={{
                  color: strokeColor,
                  weight: showBefore ? 4 : (isHighlighted ? 12 : Math.max(6, Math.min(10, route.tons / 2))),
                  opacity: showBefore ? 0.18 : (isHighlighted ? 0.45 : 0.2),
                  lineCap: 'round'
                }}
              />
              {/* Primary route line */}
              <Polyline
                positions={[
                  [sourceNode.lat, sourceNode.lng],
                  [targetNode.lat, targetNode.lng]
                ]}
                eventHandlers={{
                  mouseover: () => onHoverRoute && onHoverRoute(route.edge_id),
                  mouseout: () => onHoverRoute && onHoverRoute(null)
                }}
                pathOptions={{
                  color: strokeColor,
                  weight: showBefore ? baseWeight : (isHighlighted ? 6 : baseWeight),
                  opacity: baseOpacity,
                  dashArray: showBefore ? '4, 6' : (isDirect ? '8, 8' : '10, 6'),
                  className: showBefore ? '' : 'animated-route-path'
                }}
              >
                <Popup>
                  <div className="p-2 text-xs text-[#1C2026] font-sans min-w-[210px]">
                    {showBefore && (
                      <div className="mb-2 px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg text-[10px] font-bold text-rose-700 flex items-center space-x-1">
                        <span>⚠️</span>
                        <span>UNOPTIMIZED ROUTE — High spoilage &amp; cost risk</span>
                      </div>
                    )}
                    <div className="font-extrabold text-sm flex items-center justify-between border-b border-[#E2DED6] pb-1.5 mb-2">
                      <span className="flex items-center space-x-1.5">
                        <span className="text-base">{route.produce_icon}</span>
                        <span className="text-[#1C2026]">{route.source} → {route.target}</span>
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        showBefore
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {route.freshness_score}% Fresh
                      </span>
                    </div>
                    <div className="space-y-1 text-[#4A5568]">
                      <div className="flex justify-between">
                        <span className="text-[#7A8492]">Logistics Stage:</span>
                        <span className="font-semibold text-[#1C2026] capitalize">{route.stage.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A8492]">Cargo Volume:</span>
                        <span className="font-bold text-[#1C2026]">{route.tons} tons ({route.produce})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A8492]">Transit Distance:</span>
                        <span className="font-semibold text-[#1C2026]">{route.distance_km} km ({route.travel_hours}h)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A8492]">Spoilage Loss:</span>
                        <span className="font-bold text-rose-600">${route.spoilage_loss_usd}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A8492]">Transport Cost:</span>
                        <span className="font-bold text-[#1C2026]">${route.transport_cost_usd}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#E2DED6] pt-1 mt-1 text-[11px]">
                        <span className="text-[#7A8492]">CO₂ Footprint:</span>
                        <span className="font-bold text-amber-700">{route.co2_kg} kg</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Polyline>

              {/* Animated Moving Truck Marker — only in After Optimization mode */}
              {!showBefore && (
                <Marker
                  position={[truckLat, truckLng]}
                  icon={createMovingTruckIcon(route.produce_icon, isHighlighted)}
                  interactive={false}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Node markers */}
        {nodes.map((node) => {
          const produceIcon = node.produce === 'berries' ? '🍓' : node.produce === 'dairy' ? '🥛' : node.produce === 'leafy_greens' ? '🥬' : node.produce === 'avocados' ? '🥑' : '🍅';
          const isSelected = selectedNodeId === node.id;
          
          return (
            <Marker
              key={node.id}
              position={[node.lat, node.lng]}
              icon={createCustomIcon(node.type, node.name.split(' ')[0], produceIcon, isSelected)}
              eventHandlers={{
                click: () => onSelectNode && onSelectNode(node.id)
              }}
            >
              <Popup>
                <div className="p-2 text-xs text-[#1C2026] font-sans min-w-[200px]">
                  <div className="font-extrabold text-sm text-[#1C2026] flex items-center space-x-1.5 border-b border-[#E2DED6] pb-1.5 mb-2">
                    <span className="text-base">{node.type === 'farm' ? '🌱' : node.type === 'hub' ? '🧊' : '🛒'}</span>
                    <span>{node.name}</span>
                  </div>
                  <div className="space-y-1 text-[#4A5568]">
                    <div className="flex justify-between">
                      <span className="text-[#7A8492]">Facility Type:</span>
                      <span className="font-bold capitalize text-emerald-700">{node.type}</span>
                    </div>
                    {node.supply_tons && (
                      <div className="flex justify-between">
                        <span className="text-[#7A8492]">Supply Yield:</span>
                        <span className="font-bold text-[#1C2026]">{node.supply_tons} tons/day ({node.produce})</span>
                      </div>
                    )}
                    {node.demand_tons && (
                      <div className="flex justify-between">
                        <span className="text-[#7A8492]">Market Demand:</span>
                        <span className="font-bold text-purple-700">{node.demand_tons} tons/day</span>
                      </div>
                    )}
                    {node.capacity_tons && (
                      <div className="flex justify-between">
                        <span className="text-[#7A8492]">Cold Storage:</span>
                        <span className="font-bold text-cyan-700">{node.capacity_tons} tons</span>
                      </div>
                    )}
                    {node.temp_c && (
                      <div className="flex justify-between">
                        <span className="text-[#7A8492]">Ambient Temp:</span>
                        <span className="font-semibold text-amber-700">{node.temp_c}°C</span>
                      </div>
                    )}
                    {node.max_sla_hours && (
                      <div className="flex justify-between">
                        <span className="text-[#7A8492]">Freshness SLA:</span>
                        <span className="font-semibold text-rose-600">Max {node.max_sla_hours} hrs</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
