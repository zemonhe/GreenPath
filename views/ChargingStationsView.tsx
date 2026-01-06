
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, Zap, MapPin, Search, Loader2, Navigation, ExternalLink, Sparkles, AlertCircle, List, Map as MapIcon, RefreshCw } from 'lucide-react';
import { ChargingStation } from '../types';
import { getChargingStationDetails, GroundingSource } from '../geminiService';

interface ChargingStationsViewProps {
  onBack: () => void;
  onSelectStation: (station: ChargingStation) => void;
  preloadedStations?: ChargingStation[];
  isInitialLoading?: boolean;
}

declare const L: any;

const ChargingStationsView: React.FC<ChargingStationsViewProps> = ({ onBack, onSelectStation, preloadedStations = [], isInitialLoading = false }) => {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [stations, setStations] = useState<ChargingStation[]>(preloadedStations);
  const [isSearching, setIsSearching] = useState(isInitialLoading);
  
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  useEffect(() => { 
    if (preloadedStations.length > 0) setStations(preloadedStations); 
  }, [preloadedStations]);

  // Inicialização e atualização do Mapa
  useEffect(() => {
    if (viewMode === 'map') {
      // Pequeno timeout para garantir que o DOM renderizou o div #stations-map
      const timer = setTimeout(() => {
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = L.map('stations-map', {
            zoomControl: false,
            attributionControl: false
          }).setView([38.7223, -9.1393], 12);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
          }).addTo(mapInstanceRef.current);

          markersGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);
        }

        // Atualizar marcadores
        if (markersGroupRef.current) {
          markersGroupRef.current.clearLayers();
          stations.forEach(station => {
            const icon = L.divIcon({
              className: 'station-marker',
              html: `<div class="w-8 h-8 bg-emerald-500 rounded-xl border-2 border-white/20 shadow-lg flex items-center justify-center text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>`,
              iconSize: [32, 32], iconAnchor: [16, 16]
            });

            const marker = L.marker([station.lat, station.lng], { icon });
            marker.bindPopup(`
              <div class="p-1">
                <p class="font-black text-slate-900 text-xs">${station.name}</p>
                <p class="text-[10px] text-slate-500 font-bold mb-2">${station.power}kW</p>
                <button id="pop-nav-${station.id}" class="w-full py-1.5 bg-cyan-600 text-white rounded-lg text-[10px] font-black uppercase">Navegar</button>
              </div>
            `);
            
            marker.on('popupopen', () => {
              const btn = document.getElementById(`pop-nav-${station.id}`);
              if (btn) btn.onclick = () => onSelectStation(station);
            });

            marker.addTo(markersGroupRef.current);
          });

          if (stations.length > 0) {
            const group = new L.featureGroup(stations.map(s => L.marker([s.lat, s.lng])));
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
          }
        }
        
        mapInstanceRef.current.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode, stations, onSelectStation]);

  return (
    <div className="flex flex-col h-full animate-fadeIn overflow-hidden">
      <header className="p-6 flex items-center gap-4 bg-black/10 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><ChevronLeft size={20} /></button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-white leading-none">Rede Mobi.E</h2>
          <p className="text-[10px] font-black text-white/50 uppercase mt-1">Sincronizado</p>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white ${isSearching ? 'animate-spin' : ''}`}>
          <RefreshCw size={18} />
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4">
          <div className="bg-white/10 p-1.5 rounded-2xl flex border border-white/10">
            <button onClick={() => setViewMode('list')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white text-[#1BA3B0] dark:text-[#0F172A] shadow-lg' : 'text-white/50'}`}>Lista</button>
            <button onClick={() => setViewMode('map')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'map' ? 'bg-white text-[#1BA3B0] dark:text-[#0F172A] shadow-lg' : 'text-white/50'}`}>Mapa</button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {viewMode === 'list' ? (
            <div className="h-full overflow-y-auto px-6 pb-32 space-y-5">
              {stations.length === 0 && !isSearching && (
                <div className="flex flex-col items-center justify-center py-20 text-white/30">
                  <Zap size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">A procurar postos próximos...</p>
                </div>
              )}
              {stations.map(station => (
                <div key={station.id} className="bg-white/10 rounded-[2.5rem] p-7 border border-white/20 shadow-xl flex flex-col gap-6 animate-slideUp">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center"><Zap size={24} /></div>
                      <div>
                        <h4 className="font-black text-white text-base truncate">{station.name}</h4>
                        <p className="text-[10px] text-white/50 font-black uppercase">{station.power}kW • {station.price}€/kWh</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => onSelectStation(station)} className="w-full py-4 bg-white text-[#1BA3B0] dark:text-[#0F172A] rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-transform">Navegar Agora</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full w-full bg-slate-900 animate-fadeIn">
              <div id="stations-map" className="h-full w-full z-0"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChargingStationsView;
