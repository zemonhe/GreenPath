
import React, { useState, useEffect, useCallback } from 'react';
import { Home, Map as MapIcon, Battery, User as UserIcon, Zap, Moon, Sun } from 'lucide-react';
import { User, Bike, RouteOption, Coordinate, ChargingStation } from './types';
import DashboardView from './views/DashboardView';
import RoutePlannerView from './views/RoutePlannerView';
import ChargingStationsView from './views/ChargingStationsView';
import ProfileView from './views/ProfileView';
import MapView from './views/MapView';
import { fetchCurrentWeather, WeatherData } from './services/weatherService';

type Screen = 'home' | 'planner' | 'map' | 'charging' | 'profile';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTripActive, setIsTripActive] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  
  const [initialStations, setInitialStations] = useState<ChargingStation[]>([]);
  const [isFetchingInitialStations, setIsFetchingInitialStations] = useState(false);
  
  const [user, setUser] = useState<User>({
    id: '1',
    name: 'Paulo Silva',
    email: 'paulo@greenpath.pt',
  });

  const [bike, setBike] = useState<Bike>({
    model: 'NIU NQi GTS Pro',
    batteryCapacity: 4200,
    currentBattery: 100, 
    efficiency: 45,
    range: 82, 
  });

  const [activeRoute, setActiveRoute] = useState<RouteOption | null>(null);
  const [destination, setDestination] = useState<Coordinate | null>(null);

  const fetchNearbyStations = useCallback(async (lat: number, lon: number) => {
    setIsFetchingInitialStations(true);
    const OVERPASS_MIRRORS = [
      "https://lz4.overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter"
    ];

    const radius = 8000;
    const query = `[out:json][timeout:15];node["amenity"="charging_station"](around:${radius},${lat},${lon});out;`;

    for (const mirror of OVERPASS_MIRRORS) {
      try {
        const response = await fetch(`${mirror}?data=${encodeURIComponent(query)}`);
        if (!response.ok) continue;
        const data = await response.json();
        if (data && data.elements) {
          const mapped = data.elements.map((el: any) => ({
            id: el.id.toString(),
            name: el.tags.name || el.tags.operator || 'Posto Mobi.E',
            lat: el.lat,
            lng: el.lon,
            availableConnectors: 1,
            totalConnectors: 2,
            power: el.tags.power || 22,
            price: 0.38,
            status: 'available'
          }));
          setInitialStations(mapped);
          setIsFetchingInitialStations(false);
          return;
        }
      } catch (e) {
        console.warn(`Mirror ${mirror} failed`);
      }
    }
    setIsFetchingInitialStations(false);
  }, []);

  useEffect(() => {
    const initData = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchCurrentWeather(latitude, longitude).then(setWeather).catch(() => {});
          fetchNearbyStations(latitude, longitude);
        },
        () => fetchNearbyStations(38.7223, -9.1393)
      );
    };
    initData();
  }, [fetchNearbyStations]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleNavigateToStation = (station: ChargingStation) => {
    const stationRoute: RouteOption = {
      id: `charge-${station.id}`,
      name: `Paragem: ${station.name}`,
      distance: 0,
      duration: 0,
      batteryImpact: 5,
      elevationGain: 0,
      weatherImpact: 'clear' as const,
      smartSummary: `Navegação prioritária para posto de ${station.power}kW.`
    };
    setActiveRoute(stationRoute);
    setDestination({ lat: station.lat, lng: station.lng });
    setCurrentScreen('map');
    setIsTripActive(false);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <DashboardView bike={bike} user={user} weather={weather} onStartRoute={() => setCurrentScreen('planner')} onFindCharger={() => setCurrentScreen('charging')} />;
      case 'planner':
        return <RoutePlannerView onRouteSelect={(route, dest) => {
          setActiveRoute(route);
          setDestination(dest);
          setCurrentScreen('map');
          setIsTripActive(false);
        }} onBack={() => setCurrentScreen('home')} currentBattery={bike.currentBattery} />;
      case 'map':
        return <MapView activeRoute={activeRoute} destination={destination} isNavigating={isTripActive} onNavigationToggle={(active) => setIsTripActive(active)} onBack={() => { setCurrentScreen('home'); setIsTripActive(false); }} />;
      case 'charging':
        return <ChargingStationsView onBack={() => setCurrentScreen('home')} onSelectStation={handleNavigateToStation} preloadedStations={initialStations} isInitialLoading={isFetchingInitialStations} />;
      case 'profile':
        return <ProfileView user={user} bike={bike} onBack={() => setCurrentScreen('home')} />;
      default:
        return <DashboardView bike={bike} user={user} weather={weather} onStartRoute={() => setCurrentScreen('planner')} onFindCharger={() => setCurrentScreen('charging')} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen max-w-md mx-auto transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A] text-white' : 'bg-[#1BA3B0] text-white'} shadow-2xl relative overflow-hidden`}>
      
      {!isTripActive && (
        <button 
          onClick={toggleDarkMode}
          className="fixed top-6 right-6 z-[60] w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 transition-all active:scale-90 shadow-xl bg-white/10"
        >
          {isDarkMode ? <Sun className="text-amber-400" size={24} /> : <Moon className="text-white" size={24} />}
        </button>
      )}

      <main className={`flex-1 overflow-y-auto scroll-smooth transition-all duration-500 ${isTripActive ? 'pb-0' : 'pb-24'}`}>
        {renderScreen()}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t flex justify-around items-center h-20 px-4 safe-bottom z-50 transition-all duration-500 ease-in-out transform ${isTripActive ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'} ${isDarkMode ? 'bg-[#0F172A]/95 border-slate-800' : 'bg-[#1BA3B0]/95 border-white/10'} backdrop-blur-lg`}>
        <NavButton active={currentScreen === 'home'} icon={<Home size={22} />} label="Início" onClick={() => setCurrentScreen('home')} isDarkMode={isDarkMode} />
        <NavButton active={currentScreen === 'planner' || currentScreen === 'map'} icon={<MapIcon size={22} />} label="Rotas" onClick={() => setCurrentScreen('planner')} isDarkMode={isDarkMode} />
        <NavButton active={currentScreen === 'charging'} icon={<Zap size={22} />} label="Carregar" onClick={() => setCurrentScreen('charging')} isDarkMode={isDarkMode} />
        <NavButton active={currentScreen === 'profile'} icon={<UserIcon size={22} />} label="Perfil" onClick={() => setCurrentScreen('profile')} isDarkMode={isDarkMode} />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void; isDarkMode: boolean }> = ({ active, icon, label, onClick, isDarkMode }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-white scale-110' : 'text-white/50'}`}>
    <div className={`${active ? 'bg-white/20 p-2 rounded-xl' : 'p-2'}`}>{icon}</div>
    <span className="text-[10px] font-black tracking-wide uppercase">{label}</span>
  </button>
);

export default App;