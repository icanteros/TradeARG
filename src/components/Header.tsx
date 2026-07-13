import React from 'react';
import { Session } from '@supabase/supabase-js';

interface HeaderProps {
  currentView: 'landing' | 'collection' | 'trade' | 'import' | 'profile';
  onViewChange: (view: 'landing' | 'collection' | 'trade' | 'import' | 'profile') => void;
  onSearchGlobal: (query: string) => void;
  openAddCard: () => void;
  pesoRate: number;
  officialRate: number;
  blueRate: number;
  dollarType: 'official' | 'blue';
  onDollarTypeChange: (type: 'official' | 'blue') => void;
  userProfile: { username: string; avatar: string };
  session: Session | null;
  onLogout: () => void;
}

export default function Header({ 
  currentView, 
  onViewChange, 
  onSearchGlobal, 
  openAddCard, 
  pesoRate, 
  officialRate,
  blueRate,
  dollarType,
  onDollarTypeChange,
  userProfile,
  session,
  onLogout
}: HeaderProps) {
  const [searchValue, setSearchValue] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchGlobal(searchValue);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#05050a]/80 backdrop-blur-md border-b border-primary/20 flex justify-between items-center h-16 px-6 md:px-12 transition-all duration-300">
      {/* Brand Logo */}
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => onViewChange('landing')}
        id="logo-brand-container"
      >
        <div className="w-9 h-9 bg-primary rounded shadow-[0_0_12px_#00b8ff] flex items-center justify-center text-white font-extrabold italic tracking-tighter text-lg group-hover:scale-105 transition-transform">
          T
        </div>
        <span className="text-xl font-black text-primary neon-text-glow tracking-tighter italic select-none">
          TRADEARG
        </span>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex gap-8 items-center" id="desktop-nav-links">
        {currentView === 'landing' ? (
          <>
            <button 
              onClick={() => onViewChange('collection')} 
              className="text-on-surface-variant font-medium hover:text-primary transition-all duration-300 text-xs tracking-widest uppercase cursor-pointer"
            >
              Colección
            </button>
            <button 
              onClick={() => onViewChange('trade')} 
              className="text-on-surface-variant font-medium hover:text-primary transition-all duration-300 text-xs tracking-widest uppercase cursor-pointer"
            >
              Comunidad
            </button>
            <button 
              onClick={() => onViewChange('import')} 
              className="text-on-surface-variant font-medium hover:text-primary transition-all duration-300 text-xs tracking-widest uppercase cursor-pointer"
            >
              Importar
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => onViewChange('collection')} 
              className={`text-xs font-bold uppercase tracking-widest transition-all pb-1 border-b-2 cursor-pointer ${currentView === 'collection' ? 'text-primary border-primary' : 'text-on-surface hover:text-primary border-transparent'}`}
            >
              Colección
            </button>
            <button 
              onClick={() => onViewChange('trade')} 
              className={`text-xs font-bold uppercase tracking-widest transition-all pb-1 border-b-2 cursor-pointer ${currentView === 'trade' ? 'text-[#00f2ff] border-[#00f2ff]' : 'text-on-surface hover:text-[#00f2ff] border-transparent'}`}
            >
              Comunidad
            </button>
            <button 
              onClick={() => onViewChange('import')} 
              className={`text-xs font-bold uppercase tracking-widest transition-all pb-1 border-b-2 cursor-pointer ${currentView === 'import' ? 'text-primary border-primary' : 'text-on-surface hover:text-primary border-transparent'}`}
            >
              Importar
            </button>
          </>
        )}
      </nav>

      {/* Live Dólar Rates Selector Toggle */}
      <div className="hidden lg:flex items-center gap-1 bg-[#121221]/95 border border-primary/25 rounded p-1 font-mono text-[10px]">
        <button
          onClick={() => onDollarTypeChange('official')}
          className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
            dollarType === 'official'
              ? 'bg-primary text-white shadow-[0_0_8px_rgba(0,184,255,0.4)]'
              : 'text-[#908fa0] hover:text-white'
          }`}
          title={`Cotización Oficial: $${officialRate.toFixed(2)} ARS`}
        >
          OFICIAL: ${officialRate.toFixed(0)}
        </button>
        <button
          onClick={() => onDollarTypeChange('blue')}
          className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
            dollarType === 'blue'
              ? 'bg-secondary text-[#05050a] shadow-[0_0_8px_rgba(0,242,255,0.4)] font-black'
              : 'text-[#908fa0] hover:text-white'
          }`}
          title={`Cotización Blue: $${blueRate.toFixed(2)} ARS`}
        >
          BLUE: ${blueRate.toFixed(0)}
        </button>
      </div>

      {/* Dynamic Search Bar (Only shown on non-landing views, or small screens) */}
      <div className="hidden sm:block flex-1 max-w-xs mx-6">
        {currentView !== 'landing' && (
          <form onSubmit={handleSubmit} className="relative group" id="header-search-form">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-[20px] select-none">
              search
            </span>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar cartas..."
              className="w-full bg-[#121221] border border-[#2d2d44] rounded px-10 py-1.5 text-xs text-[#dae2fd] placeholder-[#c7c4d7]/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 font-sans"
            />
          </form>
        )}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4" id="header-user-actions">
        {/* Quick Notification & Settings */}
        <div className="flex gap-1.5 md:gap-2">
          <button 
            onClick={() => alert('No hay notificaciones nuevas en este momento.')}
            className="material-symbols-outlined text-[#c7c4d7] hover:text-primary hover:scale-110 transition-all p-1.5 rounded-full hover:bg-white/5 cursor-pointer"
            id="notifications-button"
          >
            notifications
          </button>
          <button 
            onClick={() => onViewChange('profile')}
            className="material-symbols-outlined text-[#c7c4d7] hover:text-primary hover:scale-110 transition-all p-1.5 rounded-full hover:bg-white/5 cursor-pointer"
            id="settings-button"
          >
            settings
          </button>
        </div>

        {/* Profile Card Indicators */}
        {currentView === 'landing' ? (
          <button 
            onClick={() => onViewChange('profile')}
            className="bg-primary text-white px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase hover:brightness-125 hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,184,255,0.4)] cursor-pointer"
            id="landing-profile-button"
          >
            Profile
          </button>
        ) : (
          <div className="flex items-center gap-3 pl-4 border-l border-[#2d2d44]">
            <div 
              onClick={() => onViewChange('profile')}
              className="flex items-center gap-3 cursor-pointer hover:opacity-90 active:scale-95 transition-all select-none"
              id="header-operator-card"
            >
              <div className="text-right hidden xs:block">
                <p className="font-mono text-[#dae2fd] text-[9px] uppercase tracking-wider opacity-60">
                  {session ? 'En Línea 🟢' : 'Invitado ⚪'}
                </p>
                <p className="font-sans text-xs font-bold text-on-surface">{userProfile.username}</p>
              </div>
              <div className={`w-8 h-8 rounded border p-0.5 shadow-sm transition-all duration-300 ${session ? 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'border-primary shadow-[0_0_8px_rgba(0,184,255,0.3)]'}`}>
                <img 
                  className="w-full h-full object-cover rounded-sm" 
                  src={userProfile.avatar} 
                  alt={userProfile.username}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            
            {session && (
              <button
                onClick={onLogout}
                className="material-symbols-outlined text-red-400 hover:text-red-300 hover:scale-110 transition-all p-1.5 rounded-full hover:bg-white/5 cursor-pointer ml-1 text-base flex items-center justify-center"
                title="Cerrar Sesión"
              >
                logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
