import React from 'react';
import { Card } from '../types';

interface CollectionViewProps {
  cards: Card[];
  onAddCard: () => void;
  onEditCard: (card: Card) => void;
  onUpdateQuantity: (cardId: string, delta: number) => void;
  onViewChange: (view: 'landing' | 'collection' | 'trade' | 'import' | 'profile') => void;
  pesoRate: number;
  onZoomCard: (card: Card) => void;
}

export default function CollectionView({ 
  cards, 
  onAddCard, 
  onEditCard, 
  onUpdateQuantity,
  onViewChange,
  pesoRate,
  onZoomCard
}: CollectionViewProps) {
  // States for sorting and search filter
  const [listType, setListType] = React.useState<'inventory' | 'wishlist'>('inventory');
  const [sortBy, setSortBy] = React.useState<'value' | 'rarity' | 'name' | 'qty'>('value');
  const [filterQuery, setFilterQuery] = React.useState('');
  const [selectedRarity, setSelectedRarity] = React.useState<string>('All');
  const [showFilters, setShowFilters] = React.useState(false);
  const [showCharts, setShowCharts] = React.useState(false);
  const [showExportDropdown, setShowExportDropdown] = React.useState(false);

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeCards = React.useMemo(() => {
    return cards.filter(card => listType === 'wishlist' ? !!card.isWishlist : !card.isWishlist);
  }, [cards, listType]);

  const exportAsTXT = () => {
    if (!activeCards || activeCards.length === 0) return;
    const content = activeCards
      .map(card => {
        const foilStr = card.foil ? ' *Foil*' : '';
        const setStr = card.setName ? ` (${card.setName})` : '';
        const collectorStr = card.collectorNumber ? ` ${card.collectorNumber}` : '';
        return `${card.quantity} ${card.name}${setStr}${collectorStr}${foilStr}`;
      })
      .join('\n');

    downloadFile(content, `tradearg_${listType}.txt`, 'text/plain');
  };

  const exportAsCSV = () => {
    if (!activeCards || activeCards.length === 0) return;
    const headers = 'Nombre,Cantidad,Edicion,Nro Coleccionista,Foil,Precio USD,Idioma,Notas\n';
    const rows = activeCards
      .map(card => {
        const cleanName = card.name.replace(/"/g, '""');
        const cleanSetName = card.setName.replace(/"/g, '""');
        const cleanNotes = (card.notes || '').replace(/"/g, '""');
        return `"${cleanName}",${card.quantity},"${cleanSetName}","${card.collectorNumber}",${card.foil ? 'SI' : 'NO'},${card.price},"${card.lang}","${cleanNotes}"`;
      })
      .join('\n');

    downloadFile(headers + rows, `tradearg_${listType}.csv`, 'text/csv;charset=utf-8;');
  };

  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  // Filter and Sort Cards logic
  const filteredCards = React.useMemo(() => {
    return activeCards
      .filter(card => {
        const matchesQuery = card.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
                             card.setName.toLowerCase().includes(filterQuery.toLowerCase()) ||
                             (card.collectorNumber || '').toLowerCase().includes(filterQuery.toLowerCase());
        const matchesRarity = selectedRarity === 'All' || card.rarity === selectedRarity;
        return matchesQuery && matchesRarity;
      })
      .sort((a, b) => {
        if (sortBy === 'value') {
          return (b.price * b.quantity) - (a.price * a.quantity);
        }
        if (sortBy === 'rarity') {
          const priority = { 'Mythic': 4, 'Rare': 3, 'Uncommon': 2, 'Common': 1 };
          return priority[b.rarity] - priority[a.rarity];
        }
        if (sortBy === 'qty') {
          return b.quantity - a.quantity;
        }
        return a.name.localeCompare(b.name);
      });
  }, [activeCards, sortBy, filterQuery, selectedRarity]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCards.length / itemsPerPage) || 1;
  const paginatedCards = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCards.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCards, currentPage]);

  // Reset page if filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterQuery, selectedRarity, sortBy, listType]);

  // Rarity Stats
  const rarityStats = React.useMemo(() => {
    const counts = { Mythic: 0, Rare: 0, Uncommon: 0, Common: 0 };
    activeCards.forEach(c => {
      if (counts[c.rarity] !== undefined) {
        counts[c.rarity] += c.quantity;
      }
    });
    const total = activeCards.reduce((sum, c) => sum + c.quantity, 0) || 1;
    return {
      Mythic: { count: counts.Mythic, percentage: Math.round((counts.Mythic / total) * 100) },
      Rare: { count: counts.Rare, percentage: Math.round((counts.Rare / total) * 100) },
      Uncommon: { count: counts.Uncommon, percentage: Math.round((counts.Uncommon / total) * 100) },
      Common: { count: counts.Common, percentage: Math.round((counts.Common / total) * 100) }
    };
  }, [activeCards]);

  // Foil vs Normal Stats
  const finishStats = React.useMemo(() => {
    let foilCount = 0;
    let normalCount = 0;
    activeCards.forEach(c => {
      if (c.foil) {
        foilCount += c.quantity;
      } else {
        normalCount += c.quantity;
      }
    });
    const total = foilCount + normalCount || 1;
    return {
      foil: { count: foilCount, percentage: Math.round((foilCount / total) * 100) },
      normal: { count: normalCount, percentage: Math.round((normalCount / total) * 100) }
    };
  }, [activeCards]);

  // Top Sets by Value
  const topSets = React.useMemo(() => {
    const setValues: Record<string, number> = {};
    activeCards.forEach(c => {
      const name = c.setName || 'Otros';
      setValues[name] = (setValues[name] || 0) + (c.price * c.quantity);
    });
    return Object.entries(setValues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, value]) => ({ name, value }));
  }, [activeCards]);

  // Aggregate Portfolio Stats
  const portfolioValueUSD = React.useMemo(() => {
    return activeCards.reduce((sum, card) => sum + (card.price * card.quantity), 0);
  }, [activeCards]);

  const totalAssets = React.useMemo(() => {
    return activeCards.reduce((sum, card) => sum + card.quantity, 0);
  }, [activeCards]);

  const valueInARS = Math.round(portfolioValueUSD * pesoRate);

  return (
    <div className="flex min-h-screen pt-16 bg-[#05050a] text-[#dae2fd]">
      
      {/* Side Navigation Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#05050a] border-r border-[#2d2d44] flex flex-col py-8 px-4 justify-between hidden md:flex z-20">
        <nav className="space-y-1">
          <button
            onClick={() => onViewChange('landing')}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#c7c4d7] hover:text-primary hover:bg-primary/5 rounded transition-all group cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl group-hover:drop-shadow-[0_0_5px_#00b8ff]">
              dashboard
            </span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[11px]">
              Dashboard
            </span>
          </button>
          
          <button
            onClick={() => onViewChange('collection')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-primary/10 border-l-4 border-primary text-primary font-bold rounded-r transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              library_books
            </span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[11px]">
              My Collection
            </span>
          </button>
          
          <button
            onClick={() => onViewChange('import')}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#c7c4d7] hover:text-primary hover:bg-primary/5 rounded transition-all group cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">
              cloud_upload
            </span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[11px]">
              Import
            </span>
          </button>
          
          <button
            onClick={() => onViewChange('trade')}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#c7c4d7] hover:text-primary hover:bg-primary/5 rounded transition-all group cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">
              group
            </span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[11px]">
              Search Users
            </span>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="pb-10 px-2 space-y-3">
          
          
          <div className="relative">
            <button 
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="w-full bg-[#121221] border border-[#2d2d44] text-[#c7c4d7] hover:text-white font-black py-3 rounded uppercase tracking-widest text-[10px] hover:border-primary/50 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 z-30"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Exportar Inventario
            </button>
            {showExportDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowExportDropdown(false)}
                />
                <div className="absolute left-0 bottom-full mb-1 w-full bg-[#0b1326] border border-[#2d2d44] rounded shadow-xl z-30 divide-y divide-[#2d2d44]/30 animate-fadeIn">
                  <button
                    onClick={() => {
                      exportAsTXT();
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    Como Texto (.txt / Arena)
                  </button>
                  <button
                    onClick={() => {
                      exportAsCSV();
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    Como Planilla (.csv)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Collection Display Area */}
      <main className="flex-1 md:ml-64 bg-[#05050a] px-4 md:px-10 py-10 pb-36 overflow-y-auto">
        
        {/* Tengo / Busco Tabs Selector */}
        <div className="flex gap-4 border-b border-[#2d2d44] pb-4 mb-6">
          <button
            onClick={() => setListType('inventory')}
            className={`font-sans font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-2 ${
              listType === 'inventory'
                ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(0,184,255,0.3)]'
                : 'bg-[#121221] border-[#2d2d44] text-[#c7c4d7] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm font-bold flex items-center justify-center">inventory_2</span>
            Tengo (Mi Binder)
          </button>
          <button
            onClick={() => setListType('wishlist')}
            className={`font-sans font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-2 ${
              listType === 'wishlist'
                ? 'bg-secondary border-secondary text-white shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                : 'bg-[#121221] border-[#2d2d44] text-[#c7c4d7] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm font-bold flex items-center justify-center">favorite</span>
            Busco (Lista de Deseos)
          </button>
        </div>

        {/* Header section with live indicator */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
          <div>
            <h2 className="font-sans text-3xl md:text-4xl font-black text-on-surface tracking-tight uppercase italic select-none">
              {listType === 'wishlist' ? 'Lista de Deseos' : 'Mi Colección'}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_#00f2ff]"></span>
              <p className="font-sans text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.25em] select-none">
                Live Market Synchronized
              </p>
            </div>
          </div>

          {/* Filtering Toolbar */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            
            {/* Search filter inline */}
            <div className="relative flex-1 sm:flex-none">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#c7c4d7]/60 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filtrar en colección..."
                className="bg-[#121221] border border-[#2d2d44] text-[#dae2fd] text-xs font-sans rounded pl-9 pr-4 py-2 w-full sm:w-56 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-[#c7c4d7]/40"
              />
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center bg-[#121221] rounded border border-[#2d2d44] px-1 py-1">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-[#c7c4d7] text-xs font-bold uppercase tracking-wider focus:ring-0 cursor-pointer pr-8 py-1 font-sans"
              >
                <option value="value">Valor del Mazo</option>
                <option value="rarity">Por Rareza</option>
                <option value="qty">Por Cantidad</option>
                <option value="name">Por Nombre</option>
              </select>
            </div>

            {/* Filters Toggler */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`border p-2 rounded transition-all flex items-center gap-2 px-4 cursor-pointer text-xs font-bold uppercase tracking-wider ${
                showFilters || selectedRarity !== 'All'
                  ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(0,184,255,0.2)]'
                  : 'bg-[#121221] border-[#2d2d44] text-primary hover:bg-[#121221]/80'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Filtros {selectedRarity !== 'All' ? `(${selectedRarity})` : ''}</span>
            </button>

            {/* Charts Toggler */}
            <button 
              onClick={() => setShowCharts(!showCharts)}
              className={`border p-2 rounded transition-all flex items-center gap-2 px-4 cursor-pointer text-xs font-bold uppercase tracking-wider ${
                showCharts
                  ? 'bg-secondary/15 border-secondary text-secondary shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                  : 'bg-[#121221] border-[#2d2d44] text-secondary hover:bg-[#121221]/80'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">monitoring</span>
              <span>Estadísticas</span>
            </button>
          </div>
        </div>

        {/* Expanded Filters Drawer */}
        {showFilters && (
          <div className="mb-8 p-4 bg-[#121221] border border-primary/20 rounded-lg flex flex-col sm:flex-row items-center gap-4 justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#908fa0] uppercase tracking-wider">Filtrar por Rareza:</span>
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Mythic', 'Rare', 'Uncommon', 'Common'].map(rarity => (
                  <button
                    key={rarity}
                    onClick={() => setSelectedRarity(rarity)}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      selectedRarity === rarity
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-[#05050a] text-on-surface-variant hover:text-white border border-[#2d2d44]'
                    }`}
                  >
                    {rarity}
                  </button>
                ))}
              </div>
            </div>
            {(filterQuery || selectedRarity !== 'All') && (
              <button
                onClick={() => {
                  setFilterQuery('');
                  setSelectedRarity('All');
                }}
                className="text-xs text-secondary hover:text-primary underline font-bold"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        )}

        {/* Expanded Charts Panel */}
        {showCharts && (
          <div className="mb-8 p-6 bg-[#121221]/85 border border-primary/20 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn backdrop-blur-md">
            
            {/* Rarity Bar Chart */}
            <div className="space-y-3.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#908fa0] flex items-center gap-1.5 border-b border-[#2d2d44] pb-2">
                <span className="material-symbols-outlined text-sm text-[#ffb783]">stars</span>
                Distribución de Rarezas
              </h4>
              <div className="space-y-3">
                {/* Mythic */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono font-bold">
                    <span className="text-[#ffb783]">Mítica ({rarityStats.Mythic.count} u)</span>
                    <span className="text-[#dae2fd]">{rarityStats.Mythic.percentage}%</span>
                  </div>
                  <div className="w-full bg-[#05050a] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${rarityStats.Mythic.percentage}%` }}
                    />
                  </div>
                </div>
                {/* Rare */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono font-bold">
                    <span className="text-primary">Rara ({rarityStats.Rare.count} u)</span>
                    <span className="text-[#dae2fd]">{rarityStats.Rare.percentage}%</span>
                  </div>
                  <div className="w-full bg-[#05050a] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary to-[#00f2ff] h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${rarityStats.Rare.percentage}%` }}
                    />
                  </div>
                </div>
                {/* Uncommon */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono font-bold">
                    <span className="text-slate-400">Infrecuente ({rarityStats.Uncommon.count} u)</span>
                    <span className="text-[#dae2fd]">{rarityStats.Uncommon.percentage}%</span>
                  </div>
                  <div className="w-full bg-[#05050a] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-slate-500 to-slate-400 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${rarityStats.Uncommon.percentage}%` }}
                    />
                  </div>
                </div>
                {/* Common */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono font-bold">
                    <span className="text-neutral-500">Común ({rarityStats.Common.count} u)</span>
                    <span className="text-[#dae2fd]">{rarityStats.Common.percentage}%</span>
                  </div>
                  <div className="w-full bg-[#05050a] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#2d2d44] to-[#464554] h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${rarityStats.Common.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Foil vs Normal Panel */}
            <div className="space-y-3.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#908fa0] flex items-center gap-1.5 border-b border-[#2d2d44] pb-2">
                <span className="material-symbols-outlined text-sm text-pink-400">auto_awesome</span>
                Proporción de Acabados
              </h4>
              <div className="flex items-center justify-between h-[120px] bg-[#05050a]/40 p-4 border border-[#2d2d44]/30 rounded-xl">
                <div className="space-y-3 flex-1 pr-4">
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                    <span className="text-pink-400">✨ Foil ({finishStats.foil.count} u)</span>
                    <span className="text-[#dae2fd]">{finishStats.foil.percentage}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                    <span className="text-slate-400">📄 Regular ({finishStats.normal.count} u)</span>
                    <span className="text-[#dae2fd]">{finishStats.normal.percentage}%</span>
                  </div>
                </div>
                {/* Mini Visual Circle Gauge */}
                <div className="relative w-18 h-18 flex items-center justify-center">
                  <svg width="72" height="72" className="-rotate-90">
                    <circle cx="36" cy="36" r="28" fill="transparent" stroke="#05050a" strokeWidth="8" />
                    <circle 
                      cx="36" 
                      cy="36" 
                      r="28" 
                      fill="transparent" 
                      stroke="url(#foilGradient)" 
                      strokeWidth="8" 
                      strokeDasharray="175.9"
                      strokeDashoffset={175.9 - (175.9 * finishStats.foil.percentage) / 100}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="foilGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2dd4bf" />
                        <stop offset="50%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#f472b6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute text-[9px] font-mono font-bold text-pink-400">{finishStats.foil.percentage}%</span>
                </div>
              </div>
            </div>

            {/* Top Sets Panel */}
            <div className="space-y-3.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#908fa0] flex items-center gap-1.5 border-b border-[#2d2d44] pb-2">
                <span className="material-symbols-outlined text-sm text-secondary">database</span>
                Ediciones más Valiosas
              </h4>
              <div className="space-y-3">
                {topSets.length > 0 ? topSets.map((set, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#05050a]/40 px-3 py-2 border border-[#2d2d44]/30 rounded-lg">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <span className="font-mono text-[9px] text-[#908fa0] font-black">#{idx + 1}</span>
                      <span className="text-[9px] font-bold text-[#dae2fd] truncate" title={set.name}>{set.name}</span>
                    </div>
                    <span className="font-mono text-[9px] text-secondary font-bold">${set.value.toFixed(2)} USD</span>
                  </div>
                )) : (
                  <div className="text-center py-8 text-[9px] font-mono text-[#908fa0]">
                    No hay suficientes datos.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Display grid container */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" id="collection-grid-container">
          {paginatedCards.map((card) => {
            const totalPrice = card.price * card.quantity;
            return (
              <div 
                key={card.id}
                className="group neon-card-hover card-transition bg-[#0d0d1a] border border-[#2d2d44] rounded p-2.5 flex flex-col relative"
              >
                {/* Image and Rarity Overlays */}
                <div 
                  className="aspect-[63/88] overflow-hidden rounded-sm bg-[#121221] relative select-none cursor-pointer group/img"
                  onClick={() => onEditCard(card)}
                >
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    src={card.imageUrl} 
                    alt={card.name} 
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Rarity label */}
                  <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-tighter uppercase ${
                    card.rarity === 'Mythic' 
                      ? 'mythic-glow bg-[#ffb783] text-[#301400]' 
                      : card.rarity === 'Rare'
                      ? 'rare-glow bg-primary text-white'
                      : card.rarity === 'Uncommon'
                      ? 'bg-slate-500 text-white'
                      : 'bg-[#121221] text-on-surface-variant'
                  }`}>
                    {card.rarity}
                  </div>

                  {/* Foil Overlay */}
                  {card.foil && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-teal-400 via-indigo-400 to-pink-500 text-[8px] text-white font-extrabold px-1.5 py-0.5 rounded tracking-widest uppercase">
                      FOIL
                    </div>
                  )}

                  {/* Private (No Tradear) Overlay */}
                  {card.isTradeable === false && (
                    <div className="absolute bottom-2 left-2 bg-red-500/95 text-[7px] text-white font-black px-2 py-0.5 rounded tracking-widest uppercase flex items-center gap-1 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)] z-10 select-none">
                      <span className="material-symbols-outlined text-[10px] font-bold">visibility_off</span>
                      Privado
                    </div>
                  )}

                  {/* Hover Quick Edit Action Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCard(card);
                      }}
                      className="w-full bg-primary text-white py-2 rounded text-[9px] font-extrabold uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      Quick Edit
                    </button>
                  </div>
                </div>

                {/* Info Block */}
                <div className="pt-4 px-1 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="font-sans font-bold text-xs text-on-surface truncate" title={card.name}>
                      {card.name}
                    </p>
                    <p className="text-[9px] text-on-surface-variant uppercase mt-0.5 font-sans">
                      {card.setName} {card.collectorNumber ? `#${card.collectorNumber}` : ''}
                    </p>
                  </div>

                  {/* Quantity & Unit Pricing Adjuster */}
                  <div className="mt-3 pt-2 border-t border-[#2d2d44]/30 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs text-secondary font-bold">
                        ${card.price.toFixed(2)}
                      </span>
                      
                      {/* Interactive QTY incrementor on tile directly! */}
                      <div className="flex items-center bg-[#121221] border border-[#2d2d44] rounded">
                        <button
                          onClick={() => onUpdateQuantity(card.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-xs text-[#c7c4d7] hover:bg-red-500/20 active:scale-95 rounded-l select-none cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-[10px] text-on-surface font-bold px-2 text-center min-w-[20px] select-none">
                          {card.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(card.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-xs text-[#c7c4d7] hover:bg-emerald-500/20 active:scale-95 rounded-r select-none cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    {/* Sum pricing */}
                    <div className="flex flex-col gap-0.5 border-t border-[#2d2d44]/20 pt-1.5 text-[9px] font-mono text-[#908fa0]">
                      <div className="flex justify-between items-center">
                        <span>Suma USD:</span>
                        <span className="font-bold text-on-surface">${totalPrice.toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between items-center text-secondary font-bold">
                        <span>Suma ARS:</span>
                        <span>${Math.round(totalPrice * pesoRate).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Collection state */}
        {filteredCards.length === 0 && (
          <div className="text-center py-20 bg-[#121221] border border-[#2d2d44] rounded-lg mt-6">
            <span className="material-symbols-outlined text-5xl text-primary/30 mb-2 select-none">
              style
            </span>
            <p className="text-sm text-on-surface font-sans">No hay cartas que coincidan con los filtros</p>
            <p className="text-xs text-[#908fa0] mt-1">Prueba limpiando los filtros o agregando nuevas cartas.</p>
            <button 
              onClick={onAddCard}
              className="mt-4 bg-primary text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:brightness-115 active:scale-95 transition-all cursor-pointer"
            >
              + Agregar Nueva Carta
            </button>
          </div>
        )}

        {/* Floating Portfolio Stats Panel (matches Screen 2 exactly but dynamic!) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 sm:gap-8 bg-[#121221]/90 backdrop-blur-xl border border-primary/30 px-6 sm:px-10 py-4 sm:py-5 rounded shadow-[0_10px_40px_rgba(0,0,0,0.65)] z-40 transition-all">
          <div className="text-center border-r border-[#2d2d44] pr-6 sm:pr-8">
            <p className="text-[9px] sm:text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 select-none">
              Portfolio Value
            </p>
            <p className="text-lg sm:text-xl font-black text-secondary tracking-tight">
              ${portfolioValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[10px] text-on-surface-variant font-normal ml-1">USD</span>
            </p>
            <p className="text-[9px] font-mono text-[#c7c4d7]/60 block mt-0.5 select-none">
              ARS ${(valueInARS).toLocaleString('es-AR')}
            </p>
          </div>
          
          <div className="text-center border-r border-[#2d2d44] pr-6 sm:pr-8">
            <p className="text-[9px] sm:text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 select-none">
              Total Assets
            </p>
            <p className="text-lg sm:text-xl font-black text-on-surface tracking-tight">
              {totalAssets.toLocaleString()} <span className="text-[10px] sm:text-xs text-primary font-bold">u</span>
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-[9px] sm:text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 select-none">
              24H Delta
            </p>
            <p className="text-lg sm:text-xl font-black text-primary tracking-tight">
              +2.4%
            </p>
          </div>
        </div>

        {/* Pagination elements (matches Screen 2 exact visual style) */}
        {totalPages > 1 && (
          <div className="mt-16 flex justify-center pb-12">
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`w-10 h-10 border border-[#2d2d44] text-primary rounded flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none`}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isSelected = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded font-bold text-xs cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-primary text-white shadow-[0_0_15px_rgba(0,184,255,0.4)]' 
                        : 'border border-[#2d2d44] text-on-surface hover:border-primary'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`w-10 h-10 border border-[#2d2d44] text-primary rounded flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none`}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Mobile Sticky Navigation bar matching the second mockup */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#05050a]/95 backdrop-blur-md border-t border-primary/20 flex justify-around py-4 px-2 z-40 select-none">
        <button 
          onClick={() => onViewChange('landing')}
          className="flex flex-col items-center gap-1 text-[#c7c4d7] hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
        </button>
        <button 
          onClick={() => onViewChange('collection')}
          className="flex flex-col items-center gap-1 text-primary drop-shadow-[0_0_5px_#00b8ff] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            library_books
          </span>
        </button>
        <button 
          onClick={onAddCard}
          className="w-12 h-12 -mt-9 bg-primary text-white rounded-full shadow-[0_0_20px_#00b8ff] flex items-center justify-center border-4 border-[#05050a] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>
        <button 
          onClick={() => onViewChange('trade')}
          className="flex flex-col items-center gap-1 text-[#c7c4d7] hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">group</span>
        </button>
        <button 
          onClick={() => onViewChange('profile')}
          className="flex flex-col items-center gap-1 text-[#c7c4d7] hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">person</span>
        </button>
      </nav>
    </div>
  );
}
