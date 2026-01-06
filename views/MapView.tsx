
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RouteOption, Coordinate, ChargingStation } from '../types';
import { ChevronLeft, Navigation, LocateFixed, ZoomIn, AlertCircle, Sparkles, RefreshCw, X } from 'lucide-react';

interface MapViewProps {
  activeRoute: RouteOption | null;
  destination: Coordinate | null;
  isNavigating: boolean;
  onNavigationToggle: (active: boolean) => void;
  onBack: () => void;
}

declare const L: any;

const MapView: React.FC<MapViewProps> = ({ activeRoute, destination, isNavigating, onNavigationToggle, onBack }) => {
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const chargingLayerGroupRef = useRef<any>(null);
  const smartStopLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchRef = useRef<Coordinate | null>(null);
  
  const hasZoomedRef = useRef<string | null>(null);
  
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [remainingDistance, setRemainingDistance] = useState<number>(0);
  const [chargingStations, setChargingStations] = useState<ChargingStation[]>([]);
  const [smartStop, setSmartStop] = useState<ChargingStation | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const OVERPASS_MIRRORS = [
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
  ];

  const fetchStations = useCallback(async (bounds: any, force: boolean = false) => {
    if (!bounds) return [];

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    for (const mirror of OVERPASS_MIRRORS) {
      try {
        const query = `[out:json][timeout:15];node["amenity"="charging_station"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});out 40;`;
        const response = await fetch(`${mirror}?data=${encodeURIComponent(query)}`, {
          signal: abortControllerRef.current.signal
        });
        if (!response.ok) continue;
        const data = await response.json();
        if (data && data.elements) {
          const mapped = data.elements.map((el: any) => ({
            id: el.id.toString(),
            name: el.tags.name || el.tags.operator || 'Posto Mobi.E',
            lat: el.lat, lng: el.lon,
            availableConnectors: 1, totalConnectors: 2,
            power: el.tags.power || 22, price: 0.35, status: 'available' as const
          }));
          setChargingStations(mapped);
          return mapped;
        }
      } catch (err) {}
    }
    return [];
  }, []);

  // Inicialização estável do mapa
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map-container', {
        zoomControl: false,
        attributionControl: false,
        zoomAnimation: true,
        fadeAnimation: false
      }).setView([39.5, -8.0], 7);

      chargingLayerGroupRef.current = L.layerGroup().addTo(mapRef.current);
      smartStopLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    if (tileLayerRef.current) mapRef.current.removeLayer(tileLayerRef.current);
    const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    tileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(mapRef.current);
  }, []);

  // Localização inicial fixa (Teste)
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        
        if (!userMarkerRef.current && mapRef.current) {
          const userIcon = L.divIcon({
            className: 'user-pos',
            html: `<div class="w-8 h-8 bg-cyan-600 border-4 border-slate-800 rounded-full shadow-2xl flex items-center justify-center"><div class="w-2 h-2 bg-white rounded-full"></div></div>`,
            iconSize: [32, 32], iconAnchor: [16, 16]
          });
          userMarkerRef.current = L.marker([loc.lat, loc.lng], { icon: userIcon }).addTo(mapRef.current);
          if (!activeRoute) mapRef.current.setView([loc.lat, loc.lng], 14);
        }
      },
      () => {
        const fallback = { lat: 38.7223, lng: -9.1393 };
        setUserLocation(fallback);
      }, 
      { enableHighAccuracy: true }
    );
  }, [activeRoute]);

  // Atualização dos ícones de postos
  useEffect(() => {
    if (!chargingLayerGroupRef.current) return;
    chargingLayerGroupRef.current.clearLayers();
    smartStopLayerRef.current.clearLayers();
    
    chargingStations.forEach(station => {
      const isSmart = smartStop?.id === station.id;
      const icon = L.divIcon({
        className: 'charging-marker',
        html: `<div class="w-8 h-8 ${isSmart ? 'bg-orange-500 ring-4 ring-orange-500/20' : 'bg-emerald-500'} rounded-xl border-2 border-slate-900 shadow-lg flex items-center justify-center text-white"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>`,
        iconSize: [32, 32], iconAnchor: [16, 16]
      });
      const marker = L.marker([station.lat, station.lng], { icon });
      if (isSmart) marker.addTo(smartStopLayerRef.current);
      else marker.addTo(chargingLayerGroupRef.current);
    });
  }, [chargingStations, smartStop]);

  // Cálculo e exibição da ROTA e POSTOS do percurso
  useEffect(() => {
    const fetchRoute = async () => {
      if (!mapRef.current || !userLocation || !destination) return;
      
      const routeKey = `${destination.lat},${destination.lng}`;
      setIsLoadingRoute(true);
      
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          setRemainingDistance(parseFloat((data.routes[0].distance / 1000).toFixed(1)));
          
          if (routeLayerRef.current) mapRef.current.removeLayer(routeLayerRef.current);
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          
          routeLayerRef.current = L.polyline(coords, { 
            color: '#22d3ee', 
            weight: 7, 
            opacity: 0.9, 
            lineCap: 'round' 
          }).addTo(mapRef.current);
          
          const bounds = routeLayerRef.current.getBounds();
          
          // Ajusta zoom apenas se a rota for nova
          if (hasZoomedRef.current !== routeKey) {
            mapRef.current.fitBounds(bounds, { padding: [60, 60], animate: true });
            hasZoomedRef.current = routeKey;
            
            // Procura postos na área da rota
            const stations = await fetchStations(bounds, true);
            
            // Seleciona um posto como "Smart Stop" se a rota for longa
            if (activeRoute?.batteryImpact && activeRoute.batteryImpact > 40 && stations.length > 0) {
              setSmartStop(stations[Math.floor(stations.length / 2)]);
            } else {
              setSmartStop(null);
            }
          }
        }
      } catch (err) {
        setApiError("Não foi possível traçar o caminho.");
      } finally { 
        setIsLoadingRoute(false); 
      }
    };
    fetchRoute();
  }, [userLocation, destination, activeRoute, fetchStations]);

  return (
    <div className="h-full relative flex flex-col overflow-hidden bg-slate-950">
      <div id="map-container" className="flex-1 z-0"></div>

      {/* Indicador de Carregamento Silencioso */}
      {isLoadingRoute && (
        <div className="absolute top-0 left-0 right-0 h-1 z-50 bg-cyan-500/20">
          <div className="h-full bg-cyan-500 animate-[progress_1s_infinite_linear] shadow-[0_0_8px_#22d3ee]"></div>
        </div>
      )}

      {/* Botões Flutuantes */}
      <div className={`absolute right-4 z-20 flex flex-col gap-3 transition-all duration-500 ${isNavigating ? 'top-6' : 'top-32'}`}>
        <button 
          onClick={() => userLocation && mapRef.current.flyTo([userLocation.lat, userLocation.lng], 16)} 
          className="w-12 h-12 rounded-2xl bg-slate-900/90 text-cyan-400 border border-slate-800 shadow-2xl flex items-center justify-center active:scale-90"
        >
          <LocateFixed size={24} />
        </button>
        {!isNavigating && (
          <button 
            onClick={() => routeLayerRef.current && mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [60, 60] })} 
            className="w-12 h-12 rounded-2xl bg-slate-900/90 text-slate-400 border border-slate-800 shadow-2xl flex items-center justify-center active:scale-90"
          >
            <ZoomIn size={24} />
          </button>
        )}
      </div>

      {/* Header Info */}
      {!isNavigating && (
        <div className="absolute top-6 left-4 right-18 z-20 flex items-center gap-3">
          <button onClick={onBack} className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center shadow-2xl"><ChevronLeft size={20} /></button>
          <div className="flex-1 bg-slate-900/95 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-xl flex items-center gap-3 shadow-2xl">
             <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white"><Navigation size={16} /></div>
             <div className="overflow-hidden">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Destino</p>
               <p className="text-xs font-black text-white truncate uppercase">{activeRoute?.name || 'Vigilância Green'}</p>
             </div>
          </div>
        </div>
      )}

      {/* Smart Stop Alert */}
      {smartStop && !isNavigating && (
        <div className="absolute top-24 left-4 right-4 z-20 animate-slideUp">
          <div className="bg-orange-500 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/10">
            <Sparkles size={20} className="shrink-0" />
            <div className="flex-1 overflow-hidden">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Paragem Recomendada</p>
              <p className="text-xs font-black truncate">{smartStop.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Painel Inferior */}
      <div className="absolute left-4 right-4 bottom-6 z-20">
        <div className="bg-slate-900/98 text-white border border-slate-800 shadow-2xl backdrop-blur-2xl p-6 rounded-[2.5rem] animate-slideUp">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-xl font-black tracking-tight">{activeRoute?.name || 'Rota Green Path'}</h3>
              <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mt-1">
                {remainingDistance} KM • {activeRoute?.duration || '--'} MINUTOS
              </p>
            </div>
            {isNavigating && (
              <button onClick={() => onNavigationToggle(false)} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"><X size={20} /></button>
            )}
          </div>
          <button 
            onClick={() => onNavigationToggle(!isNavigating)} 
            className={`w-full py-4.5 ${isNavigating ? 'bg-slate-800 border border-slate-700' : 'bg-cyan-600'} text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95`}
          >
            <Navigation size={18} className={isNavigating ? "" : "rotate-45"} /> 
            {isNavigating ? "Sair da Navegação" : "Iniciar Percurso"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapView;
