import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Node, RouteDetail } from '../types';
import { Truck, Crosshair, Zap, AlertTriangle, Plus, MapPin, X, Trash2 } from 'lucide-react';

interface MapViewProps {
  nodes: Node[];
  activeRoutes: RouteDetail[];
  beforeRoutes?: RouteDetail[];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  hoveredRouteId?: string | null;
  onHoverRoute?: (routeId: string | null) => void;
  onAddCustomNode?: (node: Node) => void;
  onRemoveCustomNode?: (nodeId: string) => void;
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

const createMovingTruckIcon = (produceIcon: string, isHighlighted: boolean, tons?: number) => {
  const highlightClass = isHighlighted 
    ? 'ring-4 ring-amber-400 scale-125 bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.8)]' 
    : 'bg-[#1C2026] text-[#E2DED6]';

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8 rounded-xl ${highlightClass} border-2 border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all">
      <span class="text-sm drop-shadow">${produceIcon || '🚚'}</span>
      <div class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white truck-pulse"></div>
      ${isHighlighted && tons ? `
        <div class="absolute -top-6 whitespace-nowrap bg-black/90 text-amber-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow">
          ${tons}T
        </div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-truck',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
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

const MapClickHandler: React.FC<{
  isAddMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
}> = ({ isAddMode, onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (isAddMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

export const LogisticsMap: React.FC<MapViewProps> = ({
  nodes,
  activeRoutes,
  beforeRoutes = [],
  selectedNodeId,
  onSelectNode,
  hoveredRouteId,
  onHoverRoute,
  onAddCustomNode,
  onRemoveCustomNode
}) => {
  const [basemap, setBasemap] = useState<BasemapStyle>('voyager');
  const [stageFilter, setStageFilter] = useState<'all' | 'farm_to_hub' | 'hub_to_market' | 'direct_farm_market'>('all');
  const [recenterCount, setRecenterCount] = useState<number>(0);
  const [truckProgress, setTruckProgress] = useState<number>(0);
  const [showBefore, setShowBefore] = useState<boolean>(false);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<'normal' | 'fast' | 'slow'>('normal');
  const [pendingNodeCoords, setPendingNodeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newNodeType, setNewNodeType] = useState<'farm' | 'hub' | 'market'>('farm');
  const [newNodeName, setNewNodeName] = useState<string>('');
  const [newNodeProduce, setNewNodeProduce] = useState<string>('berries');
  const [newNodeCapacity, setNewNodeCapacity] = useState<number>(10);

  const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));

  const centerLat = nodes.length > 0 ? nodes.reduce((sum, n) => sum + n.lat, 0) / nodes.length : 36.7;
  const centerLng = nodes.length > 0 ? nodes.reduce((sum, n) => sum + n.lng, 0) / nodes.length : -119.8;

  // Animation ticker for moving trucks along routes with adjustable speed
  useEffect(() => {
    const step = animationSpeed === 'fast' ? 0.04 : animationSpeed === 'slow' ? 0.012 : 0.024;
    const intervalTime = animationSpeed === 'fast' ? 60 : animationSpeed === 'slow' ? 140 : 90;

    const interval = setInterval(() => {
      setTruckProgress((prev) => (prev >= 1 ? 0.02 : prev + step));
    }, intervalTime);
    return () => clearInterval(interval);
  }, [animationSpeed]);

  const handleMapClick = (lat: number, lng: number) => {
    setPendingNodeCoords({ lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) });
    setNewNodeName(`Custom ${newNodeType === 'farm' ? 'Farm' : newNodeType === 'hub' ? 'Cold Hub' : 'Market'} ${nodes.length + 1}`);
  };

  const handleConfirmAddNode = () => {
    if (!pendingNodeCoords || !onAddCustomNode) return;
    const customId = `custom_${Date.now()}`;
    const newNode: Node = {
      id: customId,
      name: newNodeName.trim() || `Node ${nodes.length + 1}`,
      type: newNodeType,
      lat: pendingNodeCoords.lat,
      lng: pendingNodeCoords.lng,
      ...(newNodeType === 'farm' ? { supply_tons: newNodeCapacity, produce: newNodeProduce } : {}),
      ...(newNodeType === 'hub' ? { capacity_tons: newNodeCapacity, temp_c: 2.0 } : {}),
      ...(newNodeType === 'market' ? { demand_tons: newNodeCapacity } : {})
    };
    onAddCustomNode(newNode);
    setPendingNodeCoords(null);
    setIsAddMode(false);
  };

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

      {/* Top Right: Add Node Mode + Speed Selector + Recenter + Basemap */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-wrap items-center justify-end gap-2">
        {/* Drop Custom Node Trigger Button */}
        {onAddCustomNode && (
          <button
            onClick={() => {
              setIsAddMode(!isAddMode);
              setPendingNodeCoords(null);
            }}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-md ${
              isAddMode
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-extrabold animate-pulse'
                : 'btn-depth-secondary text-[#1C2026]'
            }`}
            title="Click to drop a custom farm, cold hub, or market on the map"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddMode ? 'Click Map to Place' : 'Add Node'}</span>
          </button>
        )}

        {/* Animation Speed Toggle */}
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-[#D0C9BD] shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex items-center text-[11px] font-bold">
          <span className="px-2 text-[#7A8492] hidden sm:inline">Speed:</span>
          {(['slow', 'normal', 'fast'] as const).map(speed => (
            <button
              key={speed}
              onClick={() => setAnimationSpeed(speed)}
              className={`px-2 py-1 rounded-xl capitalize transition-all cursor-pointer ${
                animationSpeed === speed
                  ? 'btn-depth-primary text-white shadow-sm'
                  : 'text-[#5C6470] hover:text-[#1C2026]'
              }`}
            >
              {speed}
            </button>
          ))}
        </div>

        <button
          onClick={() => setRecenterCount(c => c + 1)}
          className="btn-depth-secondary flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-bold cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          title="Recenter Map View on Nodes"
        >
          <Crosshair className="w-4 h-4 text-[#1C2026]" />
          <span>Recenter</span>
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

      {/* Interactive Modal / Popover when user clicks on map in Add Mode */}
      {pendingNodeCoords && (
        <div className="absolute top-20 right-4 z-[1050] w-80 bg-white/98 backdrop-blur-lg rounded-3xl p-5 border-2 border-amber-400 shadow-[0_16px_36px_rgba(0,0,0,0.22)] animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2DED6] mb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-amber-600" />
              <h4 className="font-black text-sm text-[#1C2026]">Add Network Facility</h4>
            </div>
            <button
              onClick={() => setPendingNodeCoords(null)}
              className="text-[#7A8492] hover:text-[#1C2026] p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-[#5C6470] block mb-1">Facility Name</label>
              <input
                type="text"
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#D0C9BD] font-medium text-[#1C2026] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5C6470] block mb-1">Facility Role</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['farm', 'hub', 'market'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setNewNodeType(type)}
                    className={`py-1.5 rounded-xl font-extrabold capitalize text-xs border transition-all cursor-pointer ${
                      newNodeType === type
                        ? 'bg-[#1C2026] text-white border-[#1C2026] shadow-sm'
                        : 'bg-[#F5F3EF] text-[#5C6470] border-[#D0C9BD] hover:bg-white'
                    }`}
                  >
                    {type === 'farm' ? '🌱 Farm' : type === 'hub' ? '🧊 Hub' : '🛒 Market'}
                  </button>
                ))}
              </div>
            </div>

            {newNodeType === 'farm' && (
              <div>
                <label className="text-[11px] font-bold text-[#5C6470] block mb-1">Primary Crop</label>
                <select
                  value={newNodeProduce}
                  onChange={(e) => setNewNodeProduce(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#D0C9BD] font-medium text-[#1C2026] focus:outline-none"
                >
                  <option value="berries">🍓 Strawberries</option>
                  <option value="tomatoes">🍅 Tomatoes</option>
                  <option value="leafy_greens">🥬 Leafy Greens</option>
                  <option value="avocados">🥑 Avocados</option>
                  <option value="dairy">🥛 Fresh Dairy</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-[#5C6470] block mb-1">
                {newNodeType === 'farm' ? 'Daily Yield (Tons)' : newNodeType === 'hub' ? 'Cold Storage Capacity (Tons)' : 'Daily Demand (Tons)'}
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={newNodeCapacity}
                onChange={(e) => setNewNodeCapacity(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-[#D0C9BD] font-medium text-[#1C2026] focus:outline-none"
              />
            </div>

            <div className="pt-2 text-[10px] text-[#7A8492] flex justify-between">
              <span>GPS: {pendingNodeCoords.lat}, {pendingNodeCoords.lng}</span>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setPendingNodeCoords(null)}
                className="w-1/2 py-2 rounded-xl font-bold btn-depth-secondary text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddNode}
                className="w-1/2 py-2 rounded-xl font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs shadow-md cursor-pointer transition-all"
              >
                Insert & Optimize
              </button>
            </div>
          </div>
        </div>
      )}

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
        <MapClickHandler isAddMode={isAddMode} onMapClick={handleMapClick} />
        
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
                  icon={createMovingTruckIcon(route.produce_icon, isHighlighted, route.tons)}
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
          const isCustomNode = node.id.startsWith('custom_');
          
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
                  <div className="font-extrabold text-sm text-[#1C2026] flex items-center justify-between border-b border-[#E2DED6] pb-1.5 mb-2">
                    <span className="flex items-center space-x-1.5">
                      <span className="text-base">{node.type === 'farm' ? '🌱' : node.type === 'hub' ? '🧊' : '🛒'}</span>
                      <span>{node.name}</span>
                    </span>
                    {isCustomNode && onRemoveCustomNode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveCustomNode(node.id);
                        }}
                        className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded"
                        title="Remove custom node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
