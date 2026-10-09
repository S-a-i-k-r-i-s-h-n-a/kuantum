import React, { useState, useMemo } from 'react';
import type { RouteDetail } from '../types';
import { Truck, Download, Search, ArrowUpDown, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DispatchManifestProps {
  routes: RouteDetail[];
  solverName: string;
  hoveredRouteId?: string | null;
  onHoverRoute?: (routeId: string | null) => void;
}

type SortField = 'path' | 'stage' | 'tons' | 'distance' | 'freshness' | 'spoilage' | 'cost' | 'co2';
type SortOrder = 'asc' | 'desc';

export const DispatchManifest: React.FC<DispatchManifestProps> = ({
  routes,
  solverName,
  hoveredRouteId,
  onHoverRoute
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [produceFilter, setProduceFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('freshness');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Extract unique produce commodities
  const uniqueProduces = useMemo(() => {
    const set = new Set<string>();
    routes.forEach(r => set.add(r.produce));
    return Array.from(set);
  }, [routes]);

  // Filtered & Sorted routes
  const processedRoutes = useMemo(() => {
    let result = [...routes];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.source.toLowerCase().includes(q) ||
        r.target.toLowerCase().includes(q) ||
        r.produce.toLowerCase().includes(q) ||
        r.stage.toLowerCase().includes(q)
      );
    }

    if (produceFilter !== 'all') {
      result = result.filter(r => r.produce.toLowerCase() === produceFilter.toLowerCase());
    }

    result.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortField) {
        case 'path':
          valA = `${a.source}->${a.target}`;
          valB = `${b.source}->${b.target}`;
          break;
        case 'stage':
          valA = a.stage;
          valB = b.stage;
          break;
        case 'tons':
          valA = a.tons;
          valB = b.tons;
          break;
        case 'distance':
          valA = a.distance_km;
          valB = b.distance_km;
          break;
        case 'freshness':
          valA = a.freshness_score;
          valB = b.freshness_score;
          break;
        case 'spoilage':
          valA = a.spoilage_loss_usd;
          valB = b.spoilage_loss_usd;
          break;
        case 'cost':
          valA = a.transport_cost_usd;
          valB = b.transport_cost_usd;
          break;
        case 'co2':
          valA = a.co2_kg;
          valB = b.co2_kg;
          break;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [routes, searchTerm, produceFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportCSV = () => {
    if (!routes || routes.length === 0) return;
    
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#2D3748', '#10B981', '#06B6D4', '#E2DED6']
    });

    const headers = ['Route_ID', 'Source', 'Target', 'Stage', 'Produce', 'Tons', 'Distance_KM', 'Hours', 'Freshness_PCT', 'Spoilage_USD', 'Transport_USD', 'CO2_KG'];
    const csvRows = [
      headers.join(','),
      ...processedRoutes.map(r => [
        r.edge_id,
        r.source,
        r.target,
        r.stage,
        `"${r.produce}"`,
        r.tons,
        r.distance_km,
        r.travel_hours,
        r.freshness_score,
        r.spoilage_loss_usd,
        r.transport_cost_usd,
        r.co2_kg
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `QuantAgro_Dispatch_Schedule_${Date.now()}.csv`);
    a.click();
  };

  if (!routes || routes.length === 0) {
    return (
      <div className="card-depth-elevated rounded-3xl p-8 text-center text-[#5C6470] border border-[#D0C9BD]">
        <Truck className="w-10 h-10 mx-auto mb-3 text-[#7A8492] animate-pulse" />
        <p className="text-sm font-semibold">No active dispatches. Run optimization to generate logistics schedules.</p>
      </div>
    );
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-[#7A8492] opacity-50" />;
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-3 h-3 text-[#1C2026]" /> 
      : <ChevronDown className="w-3 h-3 text-[#1C2026]" />;
  };

  return (
    <div className="card-depth-elevated rounded-3xl p-6 sm:p-7 text-[#1C2026] space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#D8D2C7] pb-4 gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700 shadow-sm">
            <Truck className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-black text-base text-[#1C2026] tracking-tight">
              Quantum Optimized Dispatch Manifest & Route Schedule
            </h3>
            <p className="text-xs text-[#5C6470] font-medium">
              Calculated by {solverName} (Interactive search, crop filter & live map linking)
            </p>
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="btn-depth-secondary flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#1C2026]" />
          <span>Export CSV Manifest</span>
        </button>
      </div>

      {/* Search & Commodity Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-2 panel-inset px-3.5 py-2 rounded-2xl flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-[#7A8492]" />
          <input
            type="text"
            placeholder="Search farm, hub, city, or stage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-[#1C2026] placeholder-[#8E8675] focus:outline-none w-full font-medium"
          />
        </div>

        {/* Commodity Pills */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <span className="text-[11px] font-bold text-[#7A8492] mr-1 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Crop:</span>
          </span>
          <button
            onClick={() => setProduceFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              produceFilter === 'all'
                ? 'btn-depth-primary'
                : 'btn-depth-secondary text-[#5C6470]'
            }`}
          >
            All Crops ({routes.length})
          </button>
          {uniqueProduces.map(p => (
            <button
              key={p}
              onClick={() => setProduceFilter(p)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all capitalize cursor-pointer ${
                produceFilter === p
                  ? 'btn-depth-primary'
                  : 'btn-depth-secondary text-[#5C6470]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#D0C9BD] bg-white shadow-sm">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-[#F5F3EF] text-[#5C6470] uppercase tracking-wider font-bold border-b border-[#D8D2C7]">
            <tr>
              <th onClick={() => handleSort('path')} className="p-3.5 cursor-pointer hover:text-[#1C2026]">
                <div className="flex items-center space-x-1">
                  <span>Route Path</span>
                  {renderSortIcon('path')}
                </div>
              </th>
              <th onClick={() => handleSort('stage')} className="p-3.5 cursor-pointer hover:text-[#1C2026]">
                <div className="flex items-center space-x-1">
                  <span>Stage</span>
                  {renderSortIcon('stage')}
                </div>
              </th>
              <th className="p-3.5">Produce</th>
              <th onClick={() => handleSort('tons')} className="p-3.5 cursor-pointer hover:text-[#1C2026]">
                <div className="flex items-center space-x-1">
                  <span>Cargo Load</span>
                  {renderSortIcon('tons')}
                </div>
              </th>
              <th onClick={() => handleSort('distance')} className="p-3.5 cursor-pointer hover:text-[#1C2026]">
                <div className="flex items-center space-x-1">
                  <span>Distance</span>
                  {renderSortIcon('distance')}
                </div>
              </th>
              <th onClick={() => handleSort('freshness')} className="p-3.5 cursor-pointer hover:text-[#1C2026]">
                <div className="flex items-center space-x-1">
                  <span>Freshness</span>
                  {renderSortIcon('freshness')}
                </div>
              </th>
              <th onClick={() => handleSort('spoilage')} className="p-3.5 cursor-pointer hover:text-[#1C2026]">
                <div className="flex items-center space-x-1">
                  <span>Spoilage Loss</span>
                  {renderSortIcon('spoilage')}
                </div>
              </th>
              <th onClick={() => handleSort('cost')} className="p-3.5 cursor-pointer hover:text-[#1C2026]">
                <div className="flex items-center space-x-1">
                  <span>Transport Cost</span>
                  {renderSortIcon('cost')}
                </div>
              </th>
              <th onClick={() => handleSort('co2')} className="p-3.5 cursor-pointer hover:text-[#1C2026]">
                <div className="flex items-center space-x-1">
                  <span>CO₂ Footprint</span>
                  {renderSortIcon('co2')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE6DE] font-mono font-medium">
            {processedRoutes.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-[#7A8492] font-sans">
                  No routes match your search or filter.
                </td>
              </tr>
            ) : (
              processedRoutes.map((route, idx) => {
                const isHighlighted = hoveredRouteId === route.edge_id;
                const rowHighlight = isHighlighted ? 'bg-amber-100/90 font-bold border-l-4 border-l-amber-500' : 'hover:bg-[#F9F8F5]';

                return (
                  <tr
                    key={idx}
                    onMouseEnter={() => onHoverRoute && onHoverRoute(route.edge_id)}
                    onMouseLeave={() => onHoverRoute && onHoverRoute(null)}
                    className={`transition-all cursor-pointer ${rowHighlight}`}
                  >
                    <td className="p-3.5 font-bold text-[#1C2026]">
                      {route.source} → {route.target}
                    </td>
                    <td className="p-3.5 text-[#5C6470] capitalize font-sans">
                      {route.stage.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3.5 text-[#1C2026] font-sans">
                      <span className="mr-1.5">{route.produce_icon}</span>
                      <span className="capitalize">{route.produce}</span>
                    </td>
                    <td className="p-3.5 text-[#1C2026] font-bold">{route.tons} Tons</td>
                    <td className="p-3.5 text-[#5C6470]">
                      {route.distance_km} km ({route.travel_hours} hrs)
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        route.freshness_score >= 90 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {route.freshness_score}%
                      </span>
                    </td>
                    <td className="p-3.5 text-rose-600 font-bold">${route.spoilage_loss_usd}</td>
                    <td className="p-3.5 text-[#1C2026] font-bold">${route.transport_cost_usd}</td>
                    <td className="p-3.5 text-cyan-800 font-bold">{route.co2_kg} kg</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
