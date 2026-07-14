import React from 'react';
import { Card } from '../types';

interface CardDetailModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCard: Card) => void;
  onDelete?: (cardId: string) => void;
  pesoRate: number;
}

export default function CardDetailModal({ card, isOpen, onClose, onSave, onDelete, pesoRate }: CardDetailModalProps) {
  const [quantity, setQuantity] = React.useState(card.quantity);
  const [price, setPrice] = React.useState(card.price);
  const [notes, setNotes] = React.useState(card.notes || '');
  const [foil, setFoil] = React.useState(card.foil);
  const [lang, setLang] = React.useState(card.lang || 'EN');

  // Synchronize when the card changes
  React.useEffect(() => {
    setQuantity(card.quantity);
    setPrice(card.price);
    setNotes(card.notes || '');
    setFoil(card.foil);
    setLang(card.lang || 'EN');
  }, [card, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      ...card,
      quantity,
      price: Number(price),
      notes,
      foil,
      lang
    });
    onClose();
  };

  const priceHistory = card.usdPriceHistory || [
    { date: '10 Jun', value: card.price * 0.95 },
    { date: '15 Jun', value: card.price * 0.97 },
    { date: '20 Jun', value: card.price * 0.99 },
    { date: '25 Jun', value: card.price * 1.01 },
    { date: '30 Jun', value: card.price }
  ];

  // Calculate coordinates for a custom SVG line chart
  const padding = 20;
  const chartHeight = 110;
  const chartWidth = 320;
  
  const minPrice = Math.min(...priceHistory.map(h => h.value));
  const maxPrice = Math.max(...priceHistory.map(h => h.value));
  const priceRange = (maxPrice - minPrice) || 1;

  const points = priceHistory.map((h, i) => {
    const x = padding + (i * (chartWidth - 2 * padding) / (priceHistory.length - 1));
    const y = chartHeight - padding - ((h.value - minPrice) * (chartHeight - 2 * padding) / priceRange);
    return { x, y, date: h.date, value: h.value };
  });

  const svgPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div 
        className="bg-[#0b1326] border border-primary/40 w-full max-w-2xl rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,184,255,0.3)] flex flex-col md:flex-row relative"
        id="card-detail-modal-container"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#c7c4d7] hover:text-primary w-8 h-8 rounded-full bg-[#05050a]/60 border border-[#2d2d44] flex items-center justify-center transition-colors z-10 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm font-bold">close</span>
        </button>

        {/* Card Artwork display */}
        <div className="w-full md:w-2/5 bg-black/40 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#2d2d44]">
          <div className="w-48 aspect-[63/88] rounded-lg overflow-hidden shadow-2xl relative select-none">
            <img 
              className="w-full h-full object-cover" 
              src={card.imageUrl} 
              alt={card.name} 
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[8px] font-extrabold text-[#00f2ff] uppercase border border-[#00f2ff]/30 tracking-widest">
              {card.rarity}
            </div>
            {foil && (
              <div className="absolute top-2 left-2 bg-gradient-to-r from-teal-400 via-indigo-400 to-pink-500 text-[8px] text-white font-extrabold px-1.5 py-0.5 rounded tracking-widest">
                FOIL
              </div>
            )}
          </div>
          <div className="mt-4 text-center w-full">
            <h4 className="font-sans font-black text-[#dae2fd] text-sm truncate max-w-[190px] mx-auto">{card.name}</h4>
            <p className="text-[10px] text-on-surface-variant font-mono uppercase mt-0.5">{card.setName}</p>
            <p className="text-[9px] text-[#908fa0] font-mono mt-0.5">COLLECTOR #{card.collectorNumber}</p>
          </div>

          {card.purchaseUris?.cardkingdom && (
            <a
              href={card.purchaseUris.cardkingdom}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 w-full max-w-[192px] bg-[#1a0e05] border border-[#f4c28c]/30 hover:border-[#f4c28c] text-[#f4c28c] py-2 rounded text-[9px] font-black uppercase tracking-widest text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(244,194,140,0.1)]"
            >
              <span className="material-symbols-outlined text-[14px]">shopping_cart</span>
              Ver en Card Kingdom
            </a>
          )}
        </div>

        {/* Info & Config fields */}
        <div className="w-full md:w-3/5 p-6 flex flex-col justify-between" id="card-detail-modal-form">
          <div className="space-y-4">
            <h3 className="font-sans text-xs font-black uppercase tracking-widest text-[#908fa0] border-b border-[#2d2d44] pb-2">
              Configuración de Inventario
            </h3>

            {/* Price & Quantity adjusting */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#908fa0] mb-1 font-sans">
                  Precio (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-secondary font-mono font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-[#121221] border border-[#2d2d44] text-[#dae2fd] text-xs font-mono font-bold rounded pl-7 pr-3 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-0.5 mt-1 font-mono text-[9px] text-[#c7c4d7]/50 select-none">
                  <span>
                    ARS ~{Math.round(price * pesoRate).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#908fa0] mb-1 font-sans">
                  Cantidad (QTY)
                </label>
                <div className="flex items-center bg-[#121221] border border-[#2d2d44] rounded h-9">
                  <button
                    onClick={() => setQuantity(Math.max(0, quantity - 1))}
                    className="w-10 h-full text-[#c7c4d7] hover:bg-red-500/20 active:scale-95 rounded-l transition-all cursor-pointer font-bold text-sm select-none"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono font-black text-xs text-on-surface">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-full text-[#c7c4d7] hover:bg-emerald-500/20 active:scale-95 rounded-r transition-all cursor-pointer font-bold text-sm select-none"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Language and Foil switch */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#908fa0] mb-1 font-sans">
                  Idioma
                </label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="w-full bg-[#121221] border border-[#2d2d44] text-[#dae2fd] text-xs font-bold rounded px-3 py-2 focus:outline-none focus:border-primary cursor-pointer font-sans uppercase"
                >
                  <option value="EN">EN (Inglés)</option>
                  <option value="ES">ES (Español)</option>
                  <option value="JA">JA (Japonés)</option>
                  <option value="IT">IT (Italiano)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#908fa0] mb-1.5 font-sans">
                  Acabado Foil
                </label>
                <button
                  onClick={() => setFoil(!foil)}
                  className={`w-full h-9 rounded text-xs font-black uppercase tracking-widest transition-all cursor-pointer border ${
                    foil 
                      ? 'bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-pink-500/20 border-pink-500 text-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.2)]'
                      : 'bg-[#121221] border-[#2d2d44] text-on-surface-variant'
                  }`}
                >
                  {foil ? '✨ Activado' : '❌ Desactivado'}
                </button>
              </div>
            </div>

            {/* Notes field */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#908fa0] mb-1 font-sans">
                Notas de estado / Detalles
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Near Mint, firmado por el artista, para mazo de Commander..."
                rows={2}
                className="w-full bg-[#121221] border border-[#2d2d44] text-[#dae2fd] text-xs rounded p-2 focus:outline-none focus:border-primary resize-none placeholder:text-[#c7c4d7]/30"
              />
            </div>

            {/* Glowing Historical Price trend SVG chart */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[#908fa0] mb-2 font-sans flex items-center justify-between select-none">
                <span>Historial de Precios (30 Días)</span>
                <span className="text-[#00f2ff] font-mono text-[9px] lowercase">scryfall tracking active</span>
              </p>
              
              <div className="bg-[#05050a]/60 border border-[#2d2d44]/50 rounded-lg p-2 flex items-center justify-center">
                <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00b8ff" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#00b8ff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Area fill */}
                  <path
                    d={`${svgPath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`}
                    fill="url(#chartGlow)"
                  />

                  {/* Line path */}
                  <path
                    d={svgPath}
                    fill="none"
                    stroke="#00b8ff"
                    strokeWidth="2.5"
                    className="drop-shadow-[0_0_4px_#00b8ff]"
                  />

                  {/* Chart points */}
                  {points.map((p, i) => (
                    <g key={i} className="group/dot">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill="#05050a"
                        stroke="#00f2ff"
                        strokeWidth="1.5"
                      />
                      <text
                        x={p.x}
                        y={p.y - 7}
                        textAnchor="middle"
                        fill="#00f2ff"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="Geist"
                        className="opacity-0 group-hover/dot:opacity-100 transition-opacity bg-black pointer-events-none"
                      >
                        ${p.value.toFixed(2)}
                      </text>
                      <text
                        x={p.x}
                        y={chartHeight - 4}
                        textAnchor="middle"
                        fill="#908fa0"
                        fontSize="7"
                        fontFamily="Sora"
                        className="pointer-events-none"
                      >
                        {p.date}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-4 border-t border-[#2d2d44] flex items-center justify-between">
            {onDelete && card.id.startsWith('db-') === false && (
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres eliminar esta carta de tu colección?')) {
                    onDelete(card.id);
                    onClose();
                  }
                }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Delete
              </button>
            )}
            
            <div className="flex gap-3 ml-auto">
              <button
                onClick={onClose}
                className="bg-transparent border border-[#2d2d44] hover:bg-[#121221] px-5 py-2.5 rounded text-[10px] font-black uppercase tracking-widest text-[#dae2fd] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="bg-primary hover:brightness-110 text-white px-6 py-2.5 rounded text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,184,255,0.4)] transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm font-bold">check</span>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
