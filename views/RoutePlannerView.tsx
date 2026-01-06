
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MapPin, Navigation, Sparkles, Battery, Loader2, X, ExternalLink, Clock, Leaf, ShieldCheck, Zap } from 'lucide-react';
import { RouteOption, Coordinate } from '../types';
import { getSmartRouteInsight, GroundingSource } from '../geminiService';

interface RoutePlannerProps {
  onRouteSelect: (route: RouteOption, destination: Coordinate) => void;
  onBack: () => void;
  currentBattery: number;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

const RoutePlannerView: React.FC<RoutePlannerProps> = ({ onRouteSelect, onBack, currentBattery }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [options, setOptions] = useState<(RouteOption & { sources?: GroundingSource[] })[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLoc({ lat: 38.7223, lng: -9.1393 })
    );
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 3 && !selectedLocation) performSearch(query);
      else if (query.length < 3) setResults([]);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (val: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5&email=greenpath@example.com`);
      const data = await response.json();
      setResults(data);
    } catch (error) { setError("Erro na pesquisa."); }
    finally { setIsSearching(false); }
  };

  const handleSelectLocation = (loc: SearchResult) => {
    setSelectedLocation(loc);
    setQuery(loc.display_name);
    setResults([]);
  };

  const handleCalculate = async () => {
    if (!selectedLocation || !userLoc) return;
    setIsCalculating(true);
    setError(null);
    try {
      const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${selectedLocation.lon},${selectedLocation.lat}?overview=false`);
      const osrmData = await osrmRes.json();
      if (!osrmData.routes || osrmData.routes.length === 0) throw new Error();
      const dist = parseFloat((osrmData.routes[0].distance / 1000).toFixed(1));
      const dur = Math.round(osrmData.routes[0].duration / 60);

      const computed: (RouteOption & { sources?: GroundingSource[] })[] = [
        { id: 'fastest', name: 'Rápida', distance: dist, duration: dur, batteryImpact: Math.round(dist * 1.4), elevationGain: 120, weatherImpact: 'clear' as const, smartSummary: `${dist}km | ${dur}m | -${Math.round(dist * 1.4)}% | Relevo acentuado.` },
        { id: 'efficient', name: 'Eficiente', distance: parseFloat((dist * 1.05).toFixed(1)), duration: Math.round(dur * 1.1), batteryImpact: Math.round(dist * 0.9), elevationGain: 40, weatherImpact: 'clear' as const, isRecommended: true, smartSummary: `${parseFloat((dist * 1.05).toFixed(1))}km | -${Math.round(dist * 0.9)}% | Percurso otimizado.` },
        { id: 'safest', name: 'Segura', distance: parseFloat((dist * 1.08).toFixed(1)), duration: Math.round(dur * 1.2), batteryImpact: Math.round(dist * 1.1), elevationGain: 60, weatherImpact: 'clear' as const, smartSummary: `${parseFloat((dist * 1.08).toFixed(1))}km | -${Math.round(dist * 1.1)}% | Mais segura.` }
      ].map(r => ({ ...r, requiresChargingStop: r.batteryImpact > currentBattery }));
      setOptions(computed);
      setSelectedId('efficient');
    } catch (e) { setError("Erro no cálculo de rota."); }
    finally { setIsCalculating(false); }
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn overflow-hidden">
      <header className="p-6 flex items-center gap-4 bg-black/10 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform"><ChevronLeft size={20} /></button>
        <h2 className="text-xl font-black text-white">Planear Trajeto</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-6 scroll-smooth">
        <div className="bg-white/10 backdrop-blur-xl p-7 rounded-[2.5rem] border border-white/20 shadow-2xl relative">
          <div className="relative pl-8 space-y-7">
            <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-white/10"></div>
            <div className="relative">
              <div className="absolute -left-8 top-1.5 w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white"><Navigation size={12} /></div>
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest block mb-1">Partida</label>
              <div className="text-sm font-bold text-white">Minha Localização</div>
            </div>
            <div className="relative">
              <div className="absolute -left-8 top-1.5 w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white"><MapPin size={12} /></div>
              <label className="text-[10px] font-black text-white/50 uppercase tracking-widest block mb-1">Destino</label>
              <input type="text" placeholder="Para onde vamos?" value={query} onChange={(e) => {setQuery(e.target.value); setSelectedLocation(null);}} className="w-full text-sm font-black text-white bg-transparent focus:outline-none placeholder:text-white/30" />
              {results.length > 0 && !selectedLocation && (
                <div className="absolute left-0 right-0 top-full mt-4 bg-[#0F172A] border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                  {results.map((r, i) => (
                    <button key={i} onClick={() => handleSelectLocation(r)} className="w-full p-5 text-left text-xs font-bold border-b border-white/5 hover:bg-white/5 text-white truncate">{r.display_name}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={handleCalculate} disabled={!selectedLocation || isCalculating} className="w-full py-5 bg-white text-[#1BA3B0] dark:text-[#0F172A] rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 mt-6 active:scale-95 disabled:opacity-50 shadow-xl transition-all">
            {isCalculating ? <Loader2 size={20} className="animate-spin" /> : "Analisar Rotas"}
          </button>
          {error && <p className="text-[10px] text-red-300 font-black uppercase text-center mt-3">{error}</p>}
        </div>

        {options.map((opt) => (
          <div key={opt.id} onClick={() => setSelectedId(opt.id)} className={`p-7 rounded-[3rem] border transition-all cursor-pointer relative overflow-hidden ${selectedId === opt.id ? 'bg-white/20 border-white/40 scale-[1.02] shadow-2xl' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
            {opt.isRecommended && (
              <div className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-2xl uppercase tracking-widest">Otimizada</div>
            )}
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner"><Zap size={20} /></div>
                <div>
                  <h4 className="font-black text-white text-lg">{opt.name}</h4>
                  <p className="text-[10px] text-white/50 font-black uppercase">{opt.distance} KM • {opt.duration} MIN</p>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 text-white border border-white/5`}>
                <Battery size={16} /><span className="font-black text-lg">-{opt.batteryImpact}%</span>
              </div>
            </div>
            {selectedId === opt.id && (
              <div className="mt-5 pt-5 border-t border-white/10 animate-slideUp space-y-5">
                <div className="flex items-start gap-3 bg-black/20 p-4 rounded-2xl">
                   <Sparkles size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                   <p className="text-[10px] text-white/80 font-black uppercase tracking-tighter leading-relaxed">{opt.smartSummary}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onRouteSelect(opt, { lat: parseFloat(selectedLocation!.lat), lng: parseFloat(selectedLocation!.lon) }); }} className="w-full py-4 bg-white text-[#1BA3B0] dark:text-[#0F172A] rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">Iniciar Percurso</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoutePlannerView;
