import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Node, RouteDetail } from '../types';
import { Truck } from 'lucide-react';

interface MapViewProps {
  nodes: Node[];
  activeRoutes: RouteDetail[];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
}

const createCustomIcon = (type: 'farm' | 'hub' | 'market', label: string, produceIcon?: string) => {
  let bgColor = 'bg-emerald-500 border-emerald-300';
  let iconContent = '🌱';

  if (type === 'farm') {
    bgColor = 'bg-emerald-500 border-emerald-300';
    iconContent = produceIcon || '🌾';
  } else if (type === 'hub') {
    bgColor = 'bg-cyan-500 border-cyan-300';
    iconContent = '🧊';
  } else if (type === 'market') {
    bgColor = 'bg-purple-500 border-purple-300';
    iconContent = '🛒';
  }

  const html = `
    <div class="relative flex items-center justify-center w-9 h-9 rounded-full ${bgColor} border-2 shadow-lg shadow-black/50 text-white font-bold text-sm transform hover:scale-110 transition-transform">
      <span class="text-base">${iconContent}</span>
      <div class="absolute -bottom-5 whitespace-nowrap bg-slate-900/90 text-slate-200 text-[10px] px-1.5 py-0.5 rounded border border-slate-700 font-semibold shadow">
        ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const MapRecenter: React.FC<{ nodes: Node[] }> = ({ nodes }) => {
  const map = useMap();
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      const bounds = L.latLngBounds(nodes.map(n => [n.lat, n.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [nodes, map]);
  return null;
};

export const LogisticsMap: React.FC<MapViewProps> = ({
  nodes,
  activeRoutes,
  onSelectNode
}) => {
  const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));

  const centerLat = nodes.length > 0 ? nodes.reduce((sum, n) => sum + n.lat, 0) / nodes.length : 36.7;
  const centerLng = nodes.length > 0 ? nodes.reduce((sum, n) => sum + n.lng, 0) / nodes.length : -119.8;

  return (
    <div className="relative w-full h-[450px] lg:h-[550px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/60 shadow-xl flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1 text-emerald-400 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Farm ({nodes.filter(n => n.type === 'farm').length})</span>
        </div>
        <div className="flex items-center space-x-1 text-cyan-400 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
          <span>Cold Hub ({nodes.filter(n => n.type === 'hub').length})</span>
        </div>
        <div className="flex items-center space-x-1 text-purple-400 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          <span>Market ({nodes.filter(n => n.type === 'market').length})</span>
        </div>
        <div className="border-l border-slate-700 pl-3 flex items-center space-x-1 text-amber-400 font-bold">
          <Truck className="w-3.5 h-3.5" />
          <span>Active Routes: {activeRoutes.length}</span>
        </div>
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={7}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <MapRecenter nodes={nodes} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {activeRoutes.map((route, idx) => {
          const sourceNode = nodeMap.get(route.source);
          const targetNode = nodeMap.get(route.target);

          if (!sourceNode || !targetNode) return null;

          const isDirect = route.stage === 'direct_farm_market';
          const strokeColor = isDirect ? '#f59e0b' : route.stage === 'farm_to_hub' ? '#10b981' : '#06b6d4';

          return (
            <Polyline
              key={`${route.edge_id}-${idx}`}
              positions={[
                [sourceNode.lat, sourceNode.lng],
                [targetNode.lat, targetNode.lng]
              ]}
              pathOptions={{
                color: strokeColor,
                weight: Math.max(3, Math.min(6, route.tons / 3)),
                opacity: 0.85,
                dashArray: isDirect ? '6, 6' : undefined
              }}
            >
              <Popup>
                <div className="p-1 text-xs text-slate-950 font-sans">
                  <div className="font-bold text-sm flex items-center space-x-1 text-indigo-900 border-b pb-1 mb-1">
                    <span>{route.produce_icon}</span>
                    <span>{route.source} → {route.target}</span>
                  </div>
                  <div className="space-y-0.5">
                    <p><strong>Stage:</strong> {route.stage}</p>
                    <p><strong>Cargo:</strong> {route.tons} tons ({route.produce})</p>
                    <p><strong>Distance:</strong> {route.distance_km} km ({route.travel_hours} hrs)</p>
                    <p><strong>Freshness Score:</strong> <span className="text-emerald-700 font-bold">{route.freshness_score}%</span></p>
                    <p><strong>Spoilage Loss:</strong> ${route.spoilage_loss_usd}</p>
                    <p><strong>Transport Cost:</strong> ${route.transport_cost_usd}</p>
                    <p><strong>CO₂ Footprint:</strong> {route.co2_kg} kg</p>
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {nodes.map((node) => {
          const produceIcon = node.produce === 'berries' ? '🍓' : node.produce === 'dairy' ? '🥛' : node.produce === 'leafy_greens' ? '🥬' : node.produce === 'avocados' ? '🥑' : '🍅';
          
          return (
            <Marker
              key={node.id}
              position={[node.lat, node.lng]}
              icon={createCustomIcon(node.type, node.name.split(' ')[0], produceIcon)}
              eventHandlers={{
                click: () => onSelectNode && onSelectNode(node.id)
              }}
            >
              <Popup>
                <div className="p-1 text-xs text-slate-900 font-sans">
                  <div className="font-bold text-sm text-slate-950 flex items-center space-x-1 border-b pb-1 mb-1">
                    <span>{node.type === 'farm' ? '🌱' : node.type === 'hub' ? '🧊' : '🛒'}</span>
                    <span>{node.name}</span>
                  </div>
                  <p><strong>Type:</strong> <span className="capitalize">{node.type}</span></p>
                  {node.supply_tons && <p><strong>Supply Output:</strong> {node.supply_tons} tons/day ({node.produce})</p>}
                  {node.demand_tons && <p><strong>Market Demand:</strong> {node.demand_tons} tons/day</p>}
                  {node.capacity_tons && <p><strong>Cold Storage Cap:</strong> {node.capacity_tons} tons</p>}
                  {node.temp_c && <p><strong>Ambient Temp:</strong> {node.temp_c}°C</p>}
                  {node.max_sla_hours && <p><strong>Max SLA Window:</strong> {node.max_sla_hours} hours</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
