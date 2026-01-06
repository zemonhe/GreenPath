
import React, { useState, useEffect } from 'react';
import { Bike, User } from '../types';
import { Zap, Navigation, Clock, Thermometer, CloudRain, ShieldCheck, ChevronRight, Wind, Droplets, Loader2, Sun, Cloud, CloudLightning } from 'lucide-react';
import { WeatherData } from '../services/weatherService';

interface DashboardProps {
  bike: Bike;
  user: User;
  weather: WeatherData | null;
  onStartRoute: () => void;
  onFindCharger: () => void;
}

const DashboardView: React.FC<DashboardProps> = ({ bike, user, weather, onStartRoute, onFindCharger }) => {
  const [animatedBattery, setAnimatedBattery] = useState(0);
  const targetBattery = bike.currentBattery;
  
  const circumference = 440;
  const strokeDashoffset = circumference - (animatedBattery / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const duration = 1500;
      const increment = targetBattery / (duration / 16);
      const counter = setInterval(() => {
        start += increment;
        if (start >= targetBattery) {
          setAnimatedBattery(targetBattery);
          clearInterval(counter);
        } else {
          setAnimatedBattery(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(counter);
    }, 300);
    return () => clearTimeout(timer);
  }, [targetBattery]);

  const getWeatherIcon = () => {
    if (!weather) return <Loader2 className="animate-spin" size={22} />;
    const code = weather.weatherCode;
    if (code === 0) return <Sun className="text-amber-300" size={22} />;
    if (code >= 1 && code <= 3) return <Cloud className="text-white/80" size={22} />;
    return <CloudRain className="text-cyan-200" size={22} />;
  };

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      <header className="flex justify-between items-center mt-2 pr-12">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Olá, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Status da tua mobilidade</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-lg shadow-xl border border-white/20">
          {user.name.charAt(0)}
        </div>
      </header>

      <div className="relative overflow-hidden bg-white/10 backdrop-blur-md rounded-[3rem] p-8 text-white border border-white/20 shadow-2xl animate-slideUp">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
              <circle cx="80" cy="80" r="70" stroke="white" strokeWidth="10" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex items-baseline">
                <span className="text-5xl font-black">{animatedBattery}</span>
                <span className="text-xl font-black ml-0.5">%</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Carga</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/5 rounded-[1.5rem] p-5 flex flex-col items-center border border-white/10">
            <Navigation size={20} className="mb-2 opacity-80" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Autonomia</span>
            <span className="text-xl font-black">{bike.range} KM</span>
          </div>
          <div className="bg-white/5 rounded-[1.5rem] p-5 flex flex-col items-center border border-white/10">
            <Zap size={20} className="mb-2 opacity-80" />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Eficiência</span>
            <span className="text-xl font-black">{bike.efficiency} Wh/km</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 border border-white/10 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm group">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
            {getWeatherIcon()}
          </div>
          <div>
            <p className="text-[9px] uppercase font-black text-white/50 tracking-wider mb-0.5">Clima</p>
            <p className="text-sm font-black text-white">{weather ? `${weather.temp}°C` : "--"}</p>
          </div>
        </div>
        <div className="bg-white/10 border border-white/10 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm group">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/80">
            <Wind size={22} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-black text-white/50 tracking-wider mb-0.5">Vento</p>
            <p className="text-sm font-black text-white">{weather ? `${weather.windSpeed} km/h` : "--"}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 px-1">Atalhos</h3>
        <div className="grid grid-cols-2 gap-4">
          <ActionCard icon={<Navigation className="text-white" />} label="Planear Rota" desc="Topografia" onClick={onStartRoute} />
          <ActionCard icon={<Zap className="text-white" />} label="Carregamento" desc="Mobi.E" onClick={onFindCharger} />
        </div>
      </div>

      <div className="bg-white/10 rounded-[2.5rem] p-6 border border-white/10 flex items-center gap-5 group active:scale-95 transition-all">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
          <ShieldCheck size={28} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-white uppercase tracking-tight">Eco-Conselho</p>
          <p className="text-xs text-white/70 font-bold leading-tight mt-1">Otimiza a tua condução mantendo os 45km/h.</p>
        </div>
        <ChevronRight size={20} className="text-white/40" />
      </div>
    </div>
  );
};

const ActionCard: React.FC<{ icon: React.ReactNode; label: string; desc: string; onClick: () => void }> = ({ icon, label, desc, onClick }) => (
  <button onClick={onClick} className="bg-white/10 border border-white/10 p-6 rounded-[2.5rem] text-left hover:bg-white/20 transition-all active:scale-95 group relative overflow-hidden">
    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-5">{icon}</div>
    <p className="font-black text-white leading-none mb-2 text-lg">{label}</p>
    <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight">{desc}</p>
  </button>
);

export default DashboardView;