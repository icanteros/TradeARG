import React from 'react';
import { Card } from '../types';
import { SEARCHABLE_DATABASE } from '../data';

interface DashboardViewProps {
  onAddCardToCollection: (card: Card) => void;
  onCardSelect: (card: Card) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  pesoRate: number;
}

export default function DashboardView({ 
  onAddCardToCollection, 
  onCardSelect,
  searchQuery,
  onSearchChange,
  pesoRate
}: DashboardViewProps) {
  const [results, setResults] = React.useState<Card[]>([]);
  const [searched, setSearched] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Trigger search on query change or submit
  const fetchFromScryfall = React.useCallback(async (queryStr: string) => {
    if (!queryStr.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(queryStr)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.data) {
          const mappedCards: Card[] = data.data.map((item: any) => {
            const price = parseFloat(item.prices?.usd || item.prices?.usd_foil || '1.00');
            let rarity: 'Mythic' | 'Rare' | 'Uncommon' | 'Common' = 'Common';
            if (item.rarity === 'mythic') rarity = 'Mythic';
            else if (item.rarity === 'rare') rarity = 'Rare';
            else if (item.rarity === 'uncommon') rarity = 'Uncommon';
            
            const imageUrl = item.image_uris?.normal || item.image_uris?.small || (item.card_faces && item.card_faces[0]?.image_uris?.normal) || 'https://images.scryfall.com/cards/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg';
            
            return {
              id: `scryfall-${item.id}`,
              name: item.name,
              price: price || 1.00,
              quantity: 0,
              rarity,
              imageUrl,
              setName: item.set_name,
              collectorNumber: item.collector_number || '0',
              foil: !!item.prices?.usd_foil && !item.prices?.usd,
              lang: (item.lang || 'EN').toUpperCase(),
              notes: '',
              usdPriceHistory: [
                { date: '10 Jun', value: price * 0.95 },
                { date: '15 Jun', value: price * 0.97 },
                { date: '20 Jun', value: price * 0.99 },
                { date: '25 Jun', value: price * 1.01 },
                { date: '30 Jun', value: price }
              ]
            };
          });
          setResults(mappedCards);
        } else {
          setResults([]);
        }
      } else {
        // Fallback to local SEARCHABLE_DATABASE
        const filtered = SEARCHABLE_DATABASE.filter(card =>
          card.name.toLowerCase().includes(queryStr.toLowerCase())
        );
        setResults(filtered);
      }
    } catch (e) {
      console.error('Error querying Scryfall API:', e);
      // Fallback
      const filtered = SEARCHABLE_DATABASE.filter(card =>
        card.name.toLowerCase().includes(queryStr.toLowerCase())
      );
      setResults(filtered);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  const handleSearch = React.useCallback((queryStr: string) => {
    onSearchChange(queryStr);
  }, [onSearchChange]);

  // Synchronize search results when parent changes the search query (debounced)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchFromScryfall(searchQuery);
      } else {
        setResults([]);
        setSearched(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchFromScryfall]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFromScryfall(searchQuery);
  };

  const handleAddWithFeedback = (card: Card) => {
    onAddCardsBulkFeedback([card]);
  };

  const [addedMessage, setAddedMessage] = React.useState<string | null>(null);

  const onAddCardsBulkFeedback = (cards: Card[]) => {
    cards.forEach(card => {
      onAddCardToCollection(card);
    });
    setAddedMessage(`¡Se agregaron ${cards.length} carta(s) a tu colección!`);
    setTimeout(() => setAddedMessage(null), 3000);
  };

  return (
    <div className="retro-grid min-h-screen pt-24 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col justify-between">
      {/* Top Background glowing spotlight */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <main className="flex-1 flex flex-col items-center justify-center py-12 z-10 relative">
        <div className="w-full max-w-4xl space-y-12 text-center">
          
          {/* Main Titles */}
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter uppercase italic text-on-surface">
              Busca. <span className="text-primary drop-shadow-[0_0_10px_rgba(0,184,255,0.55)]">Intercambia.</span> Gana.
            </h2>
            <p className="text-base sm:text-lg text-secondary font-medium tracking-wide">
              Explora la base de datos de Scryfall en el multiverso digital.
            </p>
          </div>

          {/* Alert Toast for card additions */}
          {addedMessage && (
            <div className="bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 p-4 rounded-xl max-w-md mx-auto text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 animate-bounce">
              <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
              {addedMessage}
            </div>
          )}

          {/* Large Search Box */}
          <form 
            onSubmit={handleFormSubmit} 
            className="relative group max-w-3xl mx-auto bg-surface/80 border-2 border-primary/30 rounded-xl hover:border-primary focus-within:border-primary shadow-2xl transition-all duration-300 backdrop-blur-lg"
            id="dashboard-mega-search"
          >
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-primary text-2xl">
                search
              </span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="NOMBRE DE LA CARTA..."
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
          </form>

          {/* Trending Sector Badges */}
          <div className="flex flex-col items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#908fa0]">
              Tendencias del Sector
            </span>
            <div className="flex flex-wrap justify-center gap-3">
              {['Sheoldred', 'The One Ring', 'Ragavan', 'Black Lotus', 'Atraxa'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleSearch(tag)}
                  className={`text-xs font-bold uppercase tracking-widest bg-[#0b1326] border px-5 py-2 rounded-full transition-all cursor-pointer ${
                    searchQuery.toLowerCase() === tag.toLowerCase()
                      ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(0,184,255,0.3)]'
                      : 'border-primary/30 hover:bg-primary/10 hover:border-primary text-on-surface'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results / Loading section */}
          {loading ? (
            <div className="pt-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,184,255,0.4)]"></div>
              <p className="text-xs text-on-surface-variant font-mono uppercase tracking-[0.2em] animate-pulse">Buscando en el multiverso Scryfall...</p>
            </div>
          ) : searched && (
            <div className="pt-10 space-y-6 text-left" id="search-results-section">
              <div className="flex justify-between items-center border-b border-[#2d2d44] pb-2">
                <h3 className="font-sans text-xs font-extrabold uppercase tracking-widest text-[#908fa0]">
                  Resultados Encontrados ({results.length})
                </h3>
                 <span className="text-[10px] text-secondary font-mono">
                   Cotización: ${pesoRate.toFixed(0)} ARS
                 </span>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {results.map((card) => {
                    const priceInARS = Math.round(card.price * pesoRate);
                    return (
                      <div 
                        key={card.id}
                        className="group neon-card-hover card-transition bg-[#121221] border border-[#2d2d44] rounded p-3 flex flex-col relative"
                      >
                        {/* Aspect Ratio box for Card Artwork */}
                        <div 
                          onClick={() => onCardSelect(card)}
                          className="aspect-[63/88] overflow-hidden rounded-sm bg-black/40 relative cursor-pointer"
                        >
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            src={card.imageUrl}
                            alt={card.name}
                            referrerPolicy="no-referrer"
                          />
                          <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-tighter uppercase select-none ${
                            card.rarity === 'Mythic' 
                              ? 'mythic-glow bg-[#ffdcc5] text-[#301400]' 
                              : 'rare-glow bg-primary text-white'
                          }`}>
                            {card.rarity}
                          </div>
                        </div>

                        {/* Title and Pricing */}
                        <div className="pt-4 flex-1 flex flex-col justify-between">
                          <div>
                            <p 
                              onClick={() => onCardSelect(card)}
                              className="font-sans font-bold text-sm text-on-surface truncate cursor-pointer hover:text-primary transition-colors"
                            >
                              {card.name}
                            </p>
                            <p className="text-[9px] text-on-surface-variant uppercase mt-0.5">
                              {card.setName} ({card.collectorNumber})
                            </p>
                          </div>

                          <div className="mt-4 flex flex-col gap-1">
                            <div className="flex justify-between items-baseline">
                              <span className="font-mono text-xs text-secondary font-bold">
                                USD ${card.price.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-[#908fa0] font-mono">
                                ARS ${(priceInARS).toLocaleString('es-AR')}
                              </span>
                            </div>

                            {/* Action to Add Card to Collection */}
                            <button
                              onClick={() => handleAddWithFeedback(card)}
                              className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 rounded text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-xs">add_box</span>
                              Añadir a Colección
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-[#0b1326] border border-dashed border-primary/20 rounded-lg">
                  <span className="material-symbols-outlined text-4xl text-primary/40 mb-2">
                    search_off
                  </span>
                  <p className="text-xs text-[#dae2fd]/60 font-sans">
                    No encontramos cartas con ese nombre en la base de datos de Scryfall.
                  </p>
                  <p className="text-[10px] text-secondary mt-1">
                    Prueba buscando "Sheoldred", "Ring", "Ragavan" o "Lotus".
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <footer className="py-8 text-center border-t border-primary/10">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#464554]">
          TradeARG // PROTOCOLO V.2.0.4
        </p>
      </footer>
    </div>
  );
}
