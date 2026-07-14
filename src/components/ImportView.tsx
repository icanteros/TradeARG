import React from 'react';
import { Card } from '../types';

interface ParsedCardLine {
  original: string;
  quantity: number;
  name: string;
  set?: string;
  collectorNumber?: string;
  foil: boolean;
}

function parseDecklistLine(line: string): ParsedCardLine | null {
  let clean = line.trim();
  if (!clean) return null;

  // 1. Detect and strip foil indicator
  let foil = false;
  const foilBracketRegex = /[\*\[\(](f|foil)[\*\]\)]/i;
  const foilTrailingRegex = /\s+(f|foil)$/i;

  let foilMatch = clean.match(foilBracketRegex);
  if (foilMatch) {
    foil = true;
    clean = clean.replace(foilBracketRegex, '').replace(/\s+/g, ' ').trim();
  } else {
    foilMatch = clean.match(foilTrailingRegex);
    if (foilMatch) {
      const tempClean = clean.replace(foilTrailingRegex, '').trim();
      const tempWithoutQty = tempClean.replace(/^(\d+)\s*x?\s+/i, '').trim();
      if (tempWithoutQty.length > 0) {
        foil = true;
        clean = tempClean;
      }
    }
  }

  // 2. Detect quantity at start or end
  let quantity = 1;
  const qtyMatch = clean.match(/^(\d+)\s*x?\s+/i);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10);
    clean = clean.slice(qtyMatch[0].length).trim();
  } else {
    const endQtyMatch = clean.match(/\s+(\d+)\s*x?$/i);
    const hasSetPattern = /[([][a-zA-Z0-9]{2,6}[)\]]/.test(clean);
    if (endQtyMatch && !hasSetPattern) {
      quantity = parseInt(endQtyMatch[1], 10);
      clean = clean.slice(0, clean.length - endQtyMatch[0].length).trim();
    }
  }

  // 3. Detect Set Code and Collector Number: (SET) NUMBER or [SET] NUMBER
  let setCode: string | undefined;
  let collectorNumber: string | undefined;
  let name = clean;

  const setCollectorRegex = /[([]([a-zA-Z0-9]{2,6})[)\]](?:\s*([a-zA-Z0-9\-★]+))?/gi;
  let match;
  let lastMatch: RegExpExecArray | null = null;
  while ((match = setCollectorRegex.exec(clean)) !== null) {
    lastMatch = match;
  }

  if (lastMatch) {
    setCode = lastMatch[1].toLowerCase();
    collectorNumber = lastMatch[2];
    name = clean.slice(0, lastMatch.index).trim();
  }

  return {
    original: line,
    quantity,
    name,
    set: setCode,
    collectorNumber,
    foil
  };
}

interface ImportViewProps {
  onAddCardsBulk: (cardsToAdd: Card[]) => void;
  onViewChange: (view: 'landing' | 'collection' | 'trade' | 'import' | 'profile') => void;
  pesoRate: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddCardToCollection: (card: Card) => void;
  onCardSelect: (card: Card) => void;
  onZoomCard: (card: Card) => void;
}

export default function ImportView({ 
  onAddCardsBulk, 
  onViewChange, 
  pesoRate,
  searchQuery,
  onSearchChange,
  onAddCardToCollection,
  onCardSelect,
  onZoomCard
}: ImportViewProps) {
  // Tabs State
  const [activeSubTab, setActiveSubTab] = React.useState<'single' | 'bulk'>('single');

  // Single Search states
  const [singleResults, setSingleResults] = React.useState<Card[]>([]);
  const [singleSearched, setSingleSearched] = React.useState(false);
  const [singleLoading, setSingleLoading] = React.useState(false);
  const [singleAddedMessage, setSingleAddedMessage] = React.useState<string | null>(null);

  // Bulk Importer states
  const [inputText, setInputText] = React.useState('');
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [bulkErrorMsg, setBulkErrorMsg] = React.useState<string | null>(null);
  const [bulkReport, setBulkReport] = React.useState<{
    imported: Card[];
    notFound: string[];
  } | null>(null);

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Autocomplete suggestions effect
  React.useEffect(() => {
    if (activeSubTab !== 'single' || !searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.data) {
            setSuggestions(data.data);
            setShowSuggestions(data.data.length > 0);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      } catch (err) {
        console.error('Error fetching autocomplete suggestions:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, activeSubTab]);

  const handleSelectSuggestion = (name: string) => {
    onSearchChange(name);
    setSuggestions([]);
    setShowSuggestions(false);
    fetchSingleFromScryfall(name);
  };

  // Fetch single card from Scryfall
  const fetchSingleFromScryfall = React.useCallback(async (queryStr: string) => {
    if (!queryStr.trim()) {
      setSingleResults([]);
      setSingleSearched(false);
      return;
    }
    setSingleLoading(true);
    try {
      const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(queryStr)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.data) {
          const mappedCards: Card[] = data.data.map((item: any) => {
            const normalPrice = item.prices?.usd ? parseFloat(item.prices.usd) : undefined;
            const foilPrice = item.prices?.usd_foil ? parseFloat(item.prices.usd_foil) : undefined;
            const defaultFoil = !!foilPrice && !normalPrice;
            const price = defaultFoil ? (foilPrice || 1.00) : (normalPrice || foilPrice || 1.00);

            let rarity: 'Mythic' | 'Rare' | 'Uncommon' | 'Common' = 'Common';
            if (item.rarity === 'mythic') rarity = 'Mythic';
            else if (item.rarity === 'rare') rarity = 'Rare';
            else if (item.rarity === 'uncommon') rarity = 'Uncommon';
            
            const imageUrl = item.image_uris?.normal || item.image_uris?.small || (item.card_faces && item.card_faces[0]?.image_uris?.normal) || 'https://cards.scryfall.io/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg';
            
            return {
              id: `scryfall-${item.id}`,
              name: item.name,
              price: price || 1.00,
              quantity: 0,
              rarity,
              imageUrl,
              setName: item.set_name,
              collectorNumber: item.collector_number || '0',
              foil: defaultFoil,
              lang: (item.lang || 'EN').toUpperCase(),
              notes: '',
              purchaseUris: {
                cardkingdom: item.purchase_uris?.cardkingdom
              },
              normalPrice,
              foilPrice,
              usdPriceHistory: [
                { date: '10 Jun', value: price * 0.95 },
                { date: '15 Jun', value: price * 0.97 },
                { date: '20 Jun', value: price * 0.99 },
                { date: '25 Jun', value: price * 1.01 },
                { date: '30 Jun', value: price }
              ]
            };
          });
          setSingleResults(mappedCards);
        } else {
          setSingleResults([]);
        }
      } else {
        setSingleResults([]);
      }
    } catch (e) {
      console.error('Error querying Scryfall API:', e);
      setSingleResults([]);
    } finally {
      setSingleLoading(false);
      setSingleSearched(true);
    }
  }, []);

  // Debounced effect for single search
  React.useEffect(() => {
    if (activeSubTab !== 'single') return;
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchSingleFromScryfall(searchQuery);
      } else {
        setSingleResults([]);
        setSingleSearched(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchSingleFromScryfall, activeSubTab]);

  const handleSingleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSingleFromScryfall(searchQuery);
  };

  const handleAddSingleCard = (card: Card) => {
    onAddCardToCollection(card);
    setSingleAddedMessage(`¡"${card.name}" fue añadida a tu Colección!`);
    setTimeout(() => setSingleAddedMessage(null), 3000);
  };

  const handleToggleSingleFoil = (cardId: string) => {
    setSingleResults(prev => prev.map(c => {
      if (c.id === cardId) {
        const nextFoil = !c.foil;
        const newPrice = nextFoil
          ? (c.foilPrice !== undefined ? c.foilPrice : (c.normalPrice || 1.00))
          : (c.normalPrice !== undefined ? c.normalPrice : (c.foilPrice || 1.00));
        return {
          ...c,
          foil: nextFoil,
          price: newPrice,
          usdPriceHistory: [
            { date: '10 Jun', value: newPrice * 0.95 },
            { date: '15 Jun', value: newPrice * 0.97 },
            { date: '20 Jun', value: newPrice * 0.99 },
            { date: '25 Jun', value: newPrice * 1.01 },
            { date: '30 Jun', value: newPrice }
          ]
        };
      }
      return c;
    }));
  };

  // Bulk import parser & resolve
  const handleParseAndFetchBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const lines = inputText.split('\n');
    const items = lines
      .map(line => parseDecklistLine(line))
      .filter((item): item is ParsedCardLine => item !== null);

    if (items.length === 0) {
      setBulkErrorMsg('No se detectaron cartas válidas. Por favor ingresa al menos un nombre de carta.');
      return;
    }

    setBulkLoading(true);
    setBulkErrorMsg(null);
    setBulkReport(null);

    const batches: ParsedCardLine[][] = [];
    for (let i = 0; i < items.length; i += 75) {
      batches.push(items.slice(i, i + 75));
    }

    const allImported: Card[] = [];
    const allNotFound: string[] = [];

    try {
      for (const batch of batches) {
        const body = {
          identifiers: batch.map(item => {
            if (item.set && item.collectorNumber) {
              return {
                set: item.set,
                collector_number: item.collectorNumber
              };
            } else if (item.set) {
              return {
                name: item.name,
                set: item.set
              };
            } else {
              return {
                name: item.name
              };
            }
          })
        };

        const response = await fetch('https://api.scryfall.com/cards/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          throw new Error('Error al conectar con la API de Scryfall. Reintente en unos instantes.');
        }

        const data = await response.json();

        if (data.data) {
          data.data.forEach((scryCard: any) => {
            const matchedInput = batch.find(b => {
              const bSet = b.set?.toLowerCase();
              const bColl = b.collectorNumber?.toLowerCase();
              const sSet = scryCard.set?.toLowerCase();
              const sColl = scryCard.collector_number?.toLowerCase();
              
              if (bSet && bColl) {
                return bSet === sSet && bColl === sColl;
              }
              if (bSet) {
                return bSet === sSet && (b.name.toLowerCase() === scryCard.name?.toLowerCase() || scryCard.name?.toLowerCase().includes(b.name.toLowerCase()));
              }
              return b.name.toLowerCase() === scryCard.name?.toLowerCase() || 
                     scryCard.name?.toLowerCase().includes(b.name.toLowerCase());
            });

            const qty = matchedInput ? matchedInput.quantity : 1;
            const isFoil = matchedInput ? matchedInput.foil : false;

            const price = isFoil 
              ? parseFloat(scryCard.prices?.usd_foil || scryCard.prices?.usd || '1.00')
              : parseFloat(scryCard.prices?.usd || scryCard.prices?.usd_foil || '1.00');

            let rarity: 'Mythic' | 'Rare' | 'Uncommon' | 'Common' = 'Common';
            if (scryCard.rarity === 'mythic') rarity = 'Mythic';
            else if (scryCard.rarity === 'rare') rarity = 'Rare';
            else if (scryCard.rarity === 'uncommon') rarity = 'Uncommon';

            const imageUrl = scryCard.image_uris?.normal || scryCard.image_uris?.small || (scryCard.card_faces && scryCard.card_faces[0]?.image_uris?.normal) || 'https://cards.scryfall.io/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg';

            allImported.push({
              id: `scryfall-bulk-${scryCard.id}-${Date.now()}-${Math.random()}`,
              name: scryCard.name,
              price: price || 1.00,
              quantity: qty,
              rarity,
              imageUrl,
              setName: scryCard.set_name,
              collectorNumber: scryCard.collector_number || '0',
              foil: isFoil,
              lang: (scryCard.lang || 'EN').toUpperCase(),
              notes: 'Importación masiva',
              purchaseUris: {
                cardkingdom: scryCard.purchase_uris?.cardkingdom
              },
              usdPriceHistory: [
                { date: '10 Jun', value: price * 0.95 },
                { date: '15 Jun', value: price * 0.97 },
                { date: '20 Jun', value: price * 0.99 },
                { date: '25 Jun', value: price * 1.01 },
                { date: '30 Jun', value: price }
              ]
            });
          });
        }

        if (data.not_found) {
          data.not_found.forEach((nf: any) => {
            const matchedInput = batch.find(b => {
              if (nf.collector_number && nf.set) {
                return b.set?.toLowerCase() === nf.set.toLowerCase() &&
                       b.collectorNumber?.toLowerCase() === nf.collector_number.toLowerCase();
              }
              if (nf.name && nf.set) {
                return b.name.toLowerCase() === nf.name.toLowerCase() &&
                       b.set?.toLowerCase() === nf.set.toLowerCase();
              }
              if (nf.name) {
                return b.name.toLowerCase() === nf.name.toLowerCase();
              }
              return false;
            });
            
            if (matchedInput) {
              allNotFound.push(matchedInput.original);
            } else {
              allNotFound.push(nf.name || (nf.set && nf.collector_number ? `${nf.set.toUpperCase()} #${nf.collector_number}` : 'Carta no encontrada'));
            }
          });
        }
      }

      setBulkReport({
        imported: allImported,
        notFound: allNotFound
      });

    } catch (err: any) {
      console.error(err);
      setBulkErrorMsg(err.message || 'Ocurrió un error inesperado al procesar la lista.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleConfirmBulkImport = () => {
    if (bulkReport && bulkReport.imported.length > 0) {
      onAddCardsBulk(bulkReport.imported);
      setBulkReport(null);
      setInputText('');
    }
  };

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
            className="w-full flex items-center gap-3 px-4 py-3 text-[#c7c4d7] hover:text-primary hover:bg-primary/5 rounded transition-all group cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">
              library_books
            </span>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[11px]">
              My Collection
            </span>
          </button>
          
          <button
            onClick={() => onViewChange('import')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-primary/10 border-l-4 border-primary text-primary font-bold rounded-r transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
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
      </aside>

      {/* Main Container */}
      <main className="flex-1 md:ml-64 bg-[#05050a] px-4 md:px-10 py-10 pb-36 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          
          {/* Header Title block */}
          <div className="space-y-2">
            <h2 className="font-sans text-3xl md:text-4xl font-black text-on-surface tracking-tight uppercase italic select-none">
              MÓDULO DE IMPORTACIÓN
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_#00f2ff]"></span>
              <p className="font-sans text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.25em] select-none">
                Consolidated Search & Bulk Resolver
              </p>
            </div>
          </div>

          {/* SubTab switcher */}
          <div className="flex justify-start border-b border-[#2d2d44] max-w-md">
            <button
              onClick={() => setActiveSubTab('single')}
              className={`flex-1 pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer ${
                activeSubTab === 'single'
                  ? 'border-primary text-primary drop-shadow-[0_0_10px_rgba(0,184,255,0.3)] font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Buscar Carta Individual
            </button>
            <button
              onClick={() => setActiveSubTab('bulk')}
              className={`flex-1 pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer ${
                activeSubTab === 'bulk'
                  ? 'border-primary text-primary drop-shadow-[0_0_10px_rgba(0,184,255,0.3)] font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Importación Masiva (Texto)
            </button>
          </div>

          {/* SINGLE CARD SEARCHER TAB */}
          {activeSubTab === 'single' && (
            <div className="space-y-6 animate-fadeIn">
              
              {singleAddedMessage && (
                <div className="bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 p-4 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-bounce">
                  <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                  {singleAddedMessage}
                </div>
              )}

              {/* Mega Search Input */}
              <form 
                onSubmit={handleSingleFormSubmit} 
                className="relative group bg-surface/80 border-2 border-primary/30 rounded-xl hover:border-primary focus-within:border-primary shadow-2xl transition-all duration-300 backdrop-blur-lg"
              >
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    search
                  </span>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onBlur={() => setShowSuggestions(false)}
                  placeholder="ESCRIBE EL NOMBRE DE LA CARTA PARA AGREGAR..."
                  className="w-full bg-transparent border-none rounded-xl py-5 md:py-6 pl-14 pr-32 text-base md:text-xl font-light text-on-surface placeholder-[#464554] focus:ring-0 outline-none uppercase font-sans tracking-wide"
                />
                <div className="absolute inset-y-3 right-3 flex items-center">
                  <button
                    type="submit"
                    className="bg-primary text-white px-6 md:px-8 h-full rounded-lg text-xs md:text-sm font-black uppercase tracking-widest hover:bg-primary/95 transition-all shadow-[0_0_15px_rgba(0,184,255,0.4)] hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                  >
                    Buscar
                  </button>
                </div>

                {/* Autocomplete suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0b1326] border border-[#2d2d44] rounded-xl overflow-hidden shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-[#2d2d44]/30 backdrop-blur-xl">
                    {suggestions.map((name, idx) => (
                      <div
                        key={idx}
                        onMouseDown={() => handleSelectSuggestion(name)}
                        className="px-5 py-3.5 text-xs text-[#dae2fd] hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer font-sans font-bold flex items-center gap-2.5"
                      >
                        <span className="material-symbols-outlined text-[14px] text-primary/60">search</span>
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </form>

              {/* Single Search Loading or Results */}
              {singleLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,184,255,0.4)]"></div>
                  <p className="text-xs text-on-surface-variant font-mono uppercase tracking-[0.2em] animate-pulse">Buscando en el multiverso Scryfall...</p>
                </div>
              ) : singleSearched && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-[#2d2d44] pb-2">
                    <h3 className="font-sans text-xs font-extrabold uppercase tracking-widest text-[#908fa0]">
                      Resultados del Multiverso ({singleResults.length})
                    </h3>
                    <span className="text-[10px] text-secondary font-mono">
                      Cotización: ${pesoRate.toFixed(0)} ARS
                    </span>
                  </div>

                  {singleResults.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                      {singleResults.map((card) => {
                        const priceInARS = Math.round(card.price * pesoRate);
                        return (
                          <div 
                            key={card.id}
                            className="group neon-card-hover card-transition bg-[#121221] border border-[#2d2d44] rounded p-2.5 flex flex-col relative"
                          >
                            <div 
                              onClick={() => onCardSelect(card)}
                              className="aspect-[63/88] overflow-hidden rounded-sm bg-[#121221] relative cursor-pointer select-none"
                            >
                              <img
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                src={card.imageUrl}
                                alt={card.name}
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-tighter uppercase bg-primary text-white">
                                {card.rarity}
                              </div>
                              {card.foil && (
                                <div className="absolute top-2 left-2 bg-gradient-to-r from-teal-400 via-indigo-400 to-pink-500 text-[8px] text-white font-extrabold px-1.5 py-0.5 rounded tracking-widest uppercase">
                                  FOIL
                                </div>
                              )}
                            </div>

                            <div className="pt-3 flex-1 flex flex-col justify-between">
                              <div>
                                <p 
                                  onClick={() => onCardSelect(card)}
                                  className="font-sans font-bold text-xs text-on-surface truncate cursor-pointer hover:text-primary transition-colors"
                                >
                                  {card.name}
                                </p>
                                <p className="text-[8px] text-on-surface-variant uppercase mt-0.5 font-mono">
                                  {card.setName} (#{card.collectorNumber})
                                </p>

                                {/* Finish Selector Toggle */}
                                {(card.normalPrice !== undefined && card.foilPrice !== undefined) ? (
                                  <div className="flex gap-1 mt-2 bg-[#05050a]/40 border border-[#2d2d44]/60 p-0.5 rounded text-[8px] font-sans font-bold select-none">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (card.foil) handleToggleSingleFoil(card.id);
                                      }}
                                      className={`flex-1 py-1 rounded text-center transition-all cursor-pointer uppercase ${
                                        !card.foil 
                                          ? 'bg-primary/20 text-primary border border-primary/30' 
                                          : 'text-[#908fa0] hover:text-white border border-transparent'
                                      }`}
                                    >
                                      Normal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!card.foil) handleToggleSingleFoil(card.id);
                                      }}
                                      className={`flex-1 py-1 rounded text-center transition-all cursor-pointer uppercase ${
                                        card.foil 
                                          ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30 font-black' 
                                          : 'text-[#908fa0] hover:text-white border border-transparent'
                                      }`}
                                    >
                                      Foil
                                    </button>
                                  </div>
                                ) : (
                                  <div className="mt-2 text-[8px] font-mono uppercase text-[#908fa0]">
                                    Acabado: {card.foilPrice !== undefined ? '✨ Foil Único' : '📄 Regular Único'}
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 flex flex-col gap-1.5">
                                <div className="flex justify-between items-baseline text-[10px]">
                                  <span className="font-mono text-secondary font-bold">
                                    USD ${card.price.toFixed(2)}
                                  </span>
                                  <span className="text-[#908fa0] font-mono text-[9px]">
                                    ARS ${(priceInARS).toLocaleString('es-AR')}
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleAddSingleCard(card)}
                                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 rounded text-[8px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[10px]">add_box</span>
                                  Añadir
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[#0b1326] border border-dashed border-primary/20 rounded-xl">
                      <span className="material-symbols-outlined text-4xl text-primary/40 mb-2">
                        search_off
                      </span>
                      <p className="text-xs text-[#dae2fd]/60 font-sans">
                        No se encontraron cartas en Scryfall con ese criterio.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* BULK TEXT IMPORTER TAB */}
          {activeSubTab === 'bulk' && (
            <div className="space-y-6">
              {bulkErrorMsg && (
                <div className="bg-red-500/10 border-2 border-red-500/40 text-red-400 p-4 rounded-xl text-xs font-bold font-sans">
                  ⚠️ {bulkErrorMsg}
                </div>
              )}

              {!bulkReport && !bulkLoading && (
                <div className="bg-[#121221] border border-primary/20 p-6 rounded-2xl space-y-6 animate-fadeIn">
                  <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#dae2fd]">Instrucciones de Importación</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed font-normal">
                      Pega tu decklist o lista de cartas para subirlas a tu inventario en lote. El sistema resolverá cantidades y precios actualizados.
                    </p>
                  </div>

                  <form onSubmit={handleParseAndFetchBulk} className="space-y-4">
                    <div>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ejemplo:&#10;4 Sheoldred, the Apocalypse&#10;2 Orcish Bowmasters&#10;1 The One Ring&#10;Sol Ring"
                        rows={10}
                        className="w-full bg-[#05050a] border border-[#2d2d44] text-[#dae2fd] text-xs font-mono rounded-xl p-4 focus:outline-none focus:border-primary placeholder:text-[#c7c4d7]/20 resize-y"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#2d2d44]/30">
                      <div className="text-[10px] text-on-surface-variant font-mono uppercase">
                        Formatos: [Cant] [Nombre] o [Nombre]
                      </div>
                      <button
                        type="submit"
                        className="bg-primary hover:brightness-110 text-white px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,184,255,0.4)] hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        Procesar en Lote
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {bulkLoading && (
                <div className="bg-[#121221] border border-primary/20 py-20 rounded-2xl flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,184,255,0.4)]"></div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#dae2fd] animate-pulse">Resolviendo lista de cartas...</p>
                    <p className="text-[10px] text-on-surface-variant font-mono">Llamada batch masiva a Scryfall API</p>
                  </div>
                </div>
              )}

              {bulkReport && !bulkLoading && (
                <div className="space-y-6 animate-fadeIn">
                  {bulkReport.notFound.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 rounded-xl space-y-2">
                      <p className="text-xs font-black uppercase tracking-wider font-sans">⚠️ Omitidas ({bulkReport.notFound.length})</p>
                      <ul className="list-disc list-inside text-[10px] font-mono pl-2">
                        {bulkReport.notFound.map((name, i) => <li key={i}>{name}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="bg-[#121221] border border-primary/20 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-[#2d2d44] bg-[#0d0d1a] flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#00f2ff]">Vista Previa de Carga</h3>
                      </div>
                      <div>
                        <span className="text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded">
                          {bulkReport.imported.length} CARTAS ENCONTRADAS
                        </span>
                      </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#05050a] text-on-surface-variant font-black uppercase text-[9px] border-b border-[#2d2d44]/30">
                            <th className="p-3">Carta</th>
                            <th className="p-3 text-center">Cant</th>
                            <th className="p-3">Set</th>
                            <th className="p-3 text-right">Precio USD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkReport.imported.map((card, i) => (
                            <tr key={i} className="border-b border-[#2d2d44]/20 hover:bg-[#05050a]/25 transition-colors">
                              <td className="p-3 flex items-center gap-3">
                                <img src={card.imageUrl} alt={card.name} className="w-6 h-9 object-cover rounded" />
                                <span className="font-bold text-[#dae2fd]">{card.name}</span>
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-secondary">{card.quantity}x</td>
                              <td className="p-3 text-on-surface-variant font-mono text-[10px] uppercase">{card.setName}</td>
                              <td className="p-3 text-right font-mono">${card.price.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 border-t border-[#2d2d44] bg-[#0d0d1a] flex justify-between items-center">
                      <button
                        onClick={() => setBulkReport(null)}
                        className="bg-transparent border border-[#2d2d44] hover:bg-[#05050a] text-on-surface-variant text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all cursor-pointer"
                      >
                        ← Volver
                      </button>
                      <button
                        onClick={handleConfirmBulkImport}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        Confirmar y Añadir →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Mobile navigation placeholder */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#05050a]/95 backdrop-blur-md border-t border-primary/20 flex justify-around py-4 px-2 z-40 select-none">
        <button 
          onClick={() => onViewChange('landing')}
          className="flex flex-col items-center gap-1 text-[#c7c4d7] hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
        </button>
        <button 
          onClick={() => onViewChange('collection')}
          className="flex flex-col items-center gap-1 text-[#c7c4d7] hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">library_books</span>
        </button>
        <button 
          onClick={() => onViewChange('import')}
          className="flex flex-col items-center gap-1 text-primary drop-shadow-[0_0_5px_#00b8ff] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            cloud_upload
          </span>
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
