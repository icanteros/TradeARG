import React from 'react';
import { ASSETS } from '../data';

interface LandingViewProps {
  onNavigate: (view: 'landing' | 'collection' | 'trade' | 'import' | 'profile') => void;
}

export default function LandingView({ onNavigate }: LandingViewProps) {
  // Animate dynamic analytics and predictions
  const [latency, setLatency] = React.useState(12);
  const [termLogs, setTermLogs] = React.useState<string[]>([
    'SYS: Inicializando módulo predictivo v2.4...',
    'DATA: Escaneando Scryfall API en vivo...',
    'ALERT: Comportamiento inusual detectado en "The One Ring" (+8.4% USD)',
  ]);
  const [barWidth, setBarWidth] = React.useState(75);

  React.useEffect(() => {
    // Fluctuating latency
    const latencyInterval = setInterval(() => {
      setLatency(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = prev + delta;
        return next > 6 && next < 19 ? next : 12;
      });
    }, 2000);

    // Dynamic progress bar fluctuations
    const progressInterval = setInterval(() => {
      setBarWidth(prev => {
        const delta = Math.floor(Math.random() * 11) - 5;
        const next = prev + delta;
        return next > 60 && next < 95 ? next : 75;
      });
    }, 1500);

    // Live predictor log updates
    const logPool = [
      'PREDICT: "Sheoldred, the Apocalypse" estabilizada en $78.50.',
      'BUYOUT ALERT: Oferta decreciente para "Orcish Bowmasters" (Foil).',
      'CORREO_ARG: Tarifas de envío recalculadas para Buenos Aires.',
      'SYS: Sincronización exitosa con cotización de Dólar Tarjeta ($1450).',
      'MARKET: Transacciones P2P en alza (+14.2% esta semana).',
      'ALERT: "Gold-Span Dragon" muestra signos de acumulación.',
    ];

    const logInterval = setInterval(() => {
      setTermLogs(prev => {
        const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
        const updated = [...prev.slice(1), randomLog];
        return updated;
      });
    }, 4000);

    return () => {
      clearInterval(latencyInterval);
      clearInterval(progressInterval);
      clearInterval(logInterval);
    };
  }, []);

  return (
    <div className="retro-grid min-h-screen pt-24 pb-20 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden relative">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex flex-col justify-center items-center text-center z-10 px-4">
        {/* Banner badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary mb-8 animate-pulse shadow-[0_0_15px_rgba(0,184,255,0.15)]">
          <span className="material-symbols-outlined text-sm font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
            bolt
          </span>
          <span className="text-[10px] font-black tracking-[0.2em] uppercase font-sans">
            Status: Beta Pro Online
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl leading-[1.05] mb-8 font-black tracking-tighter uppercase italic text-on-surface">
          Domina el <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent neon-text-glow">Mercado</span> de Magic
        </h1>

        {/* Description */}
        <p className="text-on-surface-variant text-base sm:text-lg max-w-2xl mx-auto mb-12 leading-relaxed font-normal">
          Gestión de inventario de alto rendimiento, precios Scryfall en tiempo real y trading directo. La infraestructura definitiva para el trader argentino.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center w-full max-w-md">
          <button 
            onClick={() => onNavigate('collection')}
            className="bg-primary text-white font-black px-8 py-4 rounded-full text-xs tracking-widest uppercase flex items-center justify-center gap-3 hover:scale-105 shadow-[0_0_25px_rgba(0,184,255,0.5)] transition-all cursor-pointer"
          >
            Empieza a Intercambiar
            <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
          </button>
          <button 
            onClick={() => onNavigate('import')}
            className="bg-transparent border-2 border-secondary text-secondary font-black px-8 py-4 rounded-full text-xs tracking-widest uppercase hover:bg-secondary/10 transition-all cursor-pointer"
          >
            Ver Demo
          </button>
        </div>

        {/* Floating cards for decoration */}
        {/* Left Floating Card */}
        <div className="hidden lg:block absolute -left-20 top-20 w-64 h-[380px] rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_20px_rgba(0,184,255,0.15)] animate-float opacity-80 select-none pointer-events-none">
          <img 
            className="w-full h-full object-cover" 
            src={ASSETS.floatingLeft} 
            alt="Fila de cartas de Magic" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05050a]/60 to-transparent" />
        </div>

        {/* Right Floating Card */}
        <div className="hidden lg:block absolute -right-20 top-20 w-64 h-[380px] rounded-xl overflow-hidden border border-secondary/30 shadow-[0_0_20px_rgba(0,242,255,0.15)] animate-float-reverse opacity-80 select-none pointer-events-none">
          <img 
            className="w-full h-full object-cover" 
            src={ASSETS.floatingRight} 
            alt="Black lotus en acrílico protector" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05050a]/60 to-transparent" />
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section className="py-20 relative z-10" id="sistemas-operacion-section">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 italic text-on-surface">
            Sistemas de Operación
          </h2>
          <div className="h-1 w-24 bg-primary mx-auto mb-4 rounded-full" />
          <p className="text-on-surface-variant text-sm max-w-md mx-auto">
            Herramientas optimizadas para la máxima eficiencia en el trading.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Card 1: Gestión de Inventario */}
          <div 
            onClick={() => onNavigate('collection')}
            className="col-span-12 lg:col-span-8 bg-[#121221]/90 neon-border p-8 rounded-xl relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
          >
            <div className="relative z-10 max-w-md">
              <span className="material-symbols-outlined text-primary text-4xl mb-4 neon-text-glow select-none">
                data_exploration
              </span>
              <h3 className="text-xl font-black uppercase italic mb-3 text-on-surface">
                Gestión de Inventario
              </h3>
              <p className="text-on-surface-variant text-xs sm:text-sm mb-6 leading-relaxed">
                Centraliza tus activos. Sincronización masiva y análisis de valor instantáneo para carteras profesionales de coleccionistas y tiendas de Argentina.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[9px] font-black tracking-widest text-[#00f2ff] border border-[#00f2ff]/30 bg-[#00f2ff]/5 px-3 py-1 rounded select-none">
                  V4.2 ENGINE
                </span>
                <span className="text-[9px] font-black tracking-widest text-[#00f2ff] border border-[#00f2ff]/30 bg-[#00f2ff]/5 px-3 py-1 rounded select-none">
                  MULTI-PORTFOLIO
                </span>
              </div>
            </div>
            {/* Background dashboard image */}
            <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-10 group-hover:opacity-35 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0 select-none pointer-events-none">
              <img 
                className="w-full h-full object-cover object-left" 
                src={ASSETS.dashboardBg} 
                alt="TradeARG Dashboard mockup" 
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Card 2: Live Analytics */}
          <div 
            onClick={() => onNavigate('import')}
            className="col-span-12 lg:col-span-4 bg-[#121221]/90 neon-border p-8 rounded-xl flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
          >
            <div>
              <span className="material-symbols-outlined text-secondary text-4xl mb-4 neon-text-glow-cyan select-none">
                show_chart
              </span>
              <h3 className="text-xl font-black uppercase italic mb-3 text-on-surface">
                Live Analytics
              </h3>
              <p className="text-on-surface-variant text-xs sm:text-sm leading-relaxed">
                Streaming de precios Scryfall en vivo 24/7. Notificaciones críticas ante movimientos bruscos del mercado internacional para comprar antes de la subida.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-primary/10 flex items-center justify-between">
              <span className="text-primary font-black text-[10px] tracking-[0.2em] uppercase animate-pulse flex items-center gap-1.5 select-none">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                Live Link Active
              </span>
              <span className="text-secondary font-mono font-black text-sm tracking-tighter bg-secondary/10 border border-secondary/20 px-2 py-0.5 rounded select-none">
                {latency}ms latency
              </span>
            </div>
          </div>

          {/* Card 3: Comunidad y Poseedores */}
          <div 
            onClick={() => onNavigate('trade')}
            className="col-span-12 lg:col-span-4 bg-[#121221]/90 neon-border p-8 rounded-xl flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
          >
            <div>
              <span className="material-symbols-outlined text-primary text-4xl mb-4 select-none">
                person_search
              </span>
              <h3 className="text-xl font-black uppercase italic mb-3 text-on-surface">
                Comunidad Activa
              </h3>
              <p className="text-on-surface-variant text-xs sm:text-sm mb-6 leading-relaxed">
                Buscá cualquier carta y encontrá jugadores locales en Argentina que la tengan en su inventario. Consultá precios del Blue, estado de conservación y contactalos directamente.
              </p>
            </div>
            <div className="bg-black/40 rounded border border-[#00f2ff]/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase font-sans">
                  Jugadores en Línea
                </span>
                <span className="text-secondary text-[9px] font-bold font-mono">
                  +2,480 ACTIVO
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-secondary transition-all duration-500 rounded-full" 
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Inteligencia de Mercado Terminal */}
          <div 
            className="col-span-12 lg:col-span-8 bg-[#121221]/90 neon-border p-8 rounded-xl flex flex-col md:flex-row gap-8 items-center group transition-all duration-300"
          >
            <div className="flex-1">
              <h3 className="text-xl font-black uppercase italic mb-3 text-on-surface">
                Inteligencia de Mercado
              </h3>
              <p className="text-on-surface-variant text-xs sm:text-sm mb-6 leading-relaxed">
                Algoritmos predictivos entrenados con metajuego histórico. Descubrí qué cartas aumentarán de valor por su rendimiento en torneos internacionales.
              </p>
              <button 
                onClick={() => onNavigate('import')}
                className="text-secondary font-black text-[11px] tracking-widest uppercase flex items-center gap-2 hover:translate-x-2 transition-all hover:text-primary"
              >
                ACCEDER AL TERMINAL 
                <span className="material-symbols-outlined text-sm font-bold">terminal</span>
              </button>
            </div>
            
            {/* Terminal Live logs mock screen */}
            <div className="w-full md:w-64 aspect-video bg-black/70 border border-primary/20 rounded-lg p-3 font-mono text-[9px] flex flex-col justify-between overflow-hidden relative select-none shadow-inner">
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              </div>
              <div className="space-y-1 text-on-surface-variant/80">
                <p className="text-primary font-bold uppercase tracking-widest text-[8px] border-b border-primary/10 pb-1 mb-2">
                  [LIVE PREDICTIVE TERMINAL]
                </p>
                {termLogs.map((log, index) => (
                  <p key={index} className="truncate select-none">
                    {log}
                  </p>
                ))}
              </div>
              <p className="text-secondary text-[8px] text-right mt-2 animate-pulse uppercase tracking-widest font-bold">
                ● ANALYZING_HISTORIC_METAGAME
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Footer Details */}
      <footer className="mt-16 pt-8 border-t border-primary/10 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#464554]">
        TRADEARG // PROTOCOLO V.2.0.4
      </footer>
    </div>
  );
}
