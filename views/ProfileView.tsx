
import React from 'react';
import { ChevronLeft, User as UserIcon, Settings, ShieldCheck, History, LogOut, ChevronRight, Bike as BikeIcon, Award } from 'lucide-react';
import { User, Bike } from '../types';

interface ProfileProps {
  user: User;
  bike: Bike;
  onBack: () => void;
}

const ProfileView: React.FC<ProfileProps> = ({ user, bike, onBack }) => {
  return (
    <div className="p-6 space-y-7 dark:bg-slate-950 bg-slate-50 min-h-full transition-colors duration-300">
      <header className="flex items-center justify-between mb-2 pr-16">
        <button onClick={onBack} className="w-10 h-10 rounded-full dark:bg-slate-800 bg-white shadow-sm flex items-center justify-center dark:text-slate-300 text-slate-600 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-black dark:text-white text-slate-800 tracking-tight">O Meu Perfil</h2>
      </header>

      <div className="dark:bg-slate-900 bg-white rounded-[3rem] p-8 text-center shadow-xl dark:shadow-none border dark:border-slate-800 border-slate-100 transition-colors">
        <div className="relative inline-block mb-6">
          <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white text-4xl font-black border-4 border-white dark:border-slate-800 shadow-2xl rotate-3">
            {user.name.charAt(0)}
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 border-4 border-white dark:border-slate-800 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Award size={18} />
          </div>
        </div>
        <h3 className="text-2xl font-black dark:text-white text-slate-800 leading-tight">{user.name}</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1 mb-8">{user.email}</p>
        
        <div className="flex gap-4">
          <div className="flex-1 py-4 dark:bg-slate-800 bg-slate-50 rounded-[1.5rem] border dark:border-slate-700/50 border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Viagens</p>
            <p className="text-xl font-black dark:text-white text-slate-800">142</p>
          </div>
          <div className="flex-1 py-4 dark:bg-slate-800 bg-slate-50 rounded-[1.5rem] border dark:border-slate-700/50 border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Km Eco</p>
            <p className="text-xl font-black dark:text-white text-slate-800">834</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-[0.2em] px-2">A Minha Mota</h3>
        <div className="dark:bg-slate-900 bg-white rounded-[2.5rem] p-7 shadow-sm border dark:border-slate-800 border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 dark:bg-cyan-500/10 bg-cyan-50 rounded-[1.2rem] flex items-center justify-center text-cyan-500 shadow-inner">
              <BikeIcon size={34} />
            </div>
            <div>
              <h4 className="font-black dark:text-white text-slate-800 text-lg leading-tight">{bike.model}</h4>
              <p className="text-[10px] dark:text-slate-500 text-slate-400 font-black uppercase tracking-widest mt-1">Capacidade: 4.2 kWh</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      <div className="space-y-3 pb-20">
        <h3 className="text-[10px] font-black dark:text-slate-500 text-slate-400 uppercase tracking-[0.2em] px-2">Definições</h3>
        <ProfileOption icon={<ShieldCheck className="text-emerald-500" />} label="Privacidade & Segurança" />
        <ProfileOption icon={<History className="text-purple-500" />} label="Histórico de Rotas" />
        <ProfileOption icon={<UserIcon className="text-blue-500" />} label="Dados de Utilizador" />
        <ProfileOption icon={<Settings className="text-slate-500" />} label="Ajustes do Sistema" />
        
        <button className="w-full flex items-center justify-between p-6 bg-red-500/5 dark:bg-red-500/10 rounded-[2rem] mt-4 group active:scale-[0.98] transition-all border border-red-500/10">
          <div className="flex items-center gap-5">
             <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-500/10">
                <LogOut size={22} />
             </div>
             <span className="font-black text-red-600 dark:text-red-400 text-base">Terminar Sessão</span>
          </div>
          <ChevronRight size={20} className="text-red-500/30 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

const ProfileOption: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="w-full flex items-center justify-between p-6 dark:bg-slate-900 bg-white rounded-[2rem] border dark:border-slate-800 border-slate-50 shadow-sm hover:shadow-xl transition-all active:scale-[0.98] group">
    <div className="flex items-center gap-5">
       <div className="w-12 h-12 dark:bg-slate-800 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-cyan-500/10 transition-colors">
          {icon}
       </div>
       <span className="font-black dark:text-slate-200 text-slate-700 text-sm tracking-tight">{label}</span>
    </div>
    <ChevronRight size={20} className="text-slate-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform" />
  </button>
);

export default ProfileView;
