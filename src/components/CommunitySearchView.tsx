import React from 'react';
import { Card } from '../types';
import { SEARCHABLE_DATABASE } from '../data';
import { Search, User, MapPin, MessageSquare, AlertCircle, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';
import { fetchCommunityListings } from '../supabaseService';

interface CommunitySearchViewProps {
  userCollection: Card[];
  onCardSelect: (card: Card) => void;
  onViewChange: (view: 'landing' | 'collection' | 'trade' | 'import' | 'profile') => void;
  pesoRate: number;
  onZoomCard: (card: Card) => void;
}

interface CommunityListing {
  id: string;
  username: string;
  rating: number;
  location: string;
  cardName: string;
  quantity: number;
  condition: 'NM' | 'SP' | 'MP' | 'HP'; // Near Mint, Slightly Played, Moderately Played, Heavily Played
  foil: boolean;
  language: string;
  priceUsd: number;
  notes: string;
  contacted: boolean;
}

// Fixed mock list of community members
const COMMUNITY_USERS = [
  { username: 'Diego_MTG', rating: 4.9, location: 'Rosario, Santa Fe' },
  { username: 'Santi_CardTrader', rating: 4.8, location: 'CABA, Buenos Aires' },
  { username: 'Flor_ManaBurn', rating: 5.0, location: 'Mendoza Capital' },
  { username: 'Lucho_Gamer', rating: 4.7, location: 'Córdoba Capital' },
  { username: 'Nico_Planeswalker', rating: 4.6, location: 'La Plata, Buenos Aires' },
  { username: 'Gaby_CABA', rating: 4.9, location: 'CABA, Buenos Aires' },
  { username: 'Emi_Lotus', rating: 4.5, location: 'San Miguel de Tucumán' },
  { username: 'Valen_EDH', rating: 4.9, location: 'Bahía Blanca, Buenos Aires' }
];

export default function CommunitySearchView({ userCollection, onCardSelect, onViewChange, pesoRate, onZoomCard }: CommunitySearchViewProps) {
  const [activeTab, setActiveTab] = React.useState<'search' | 'matcher'>('search');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCard, setSelectedCard] = React.useState<Card | null>(null);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  
  // Filtering options for owners
  const [selectedCondition, setSelectedCondition] = React.useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>('ALL');
  const [onlyFoil, setOnlyFoil] = React.useState<boolean>(false);

  // Message Sending Modal state
  const [activeListingForContact, setActiveListingForContact] = React.useState<CommunityListing | null>(null);
  const [contactMessage, setContactMessage] = React.useState('');
  const [sentContactIds, setSentContactIds] = React.useState<string[]>([]);
  const [successNotification, setSuccessNotification] = React.useState<string | null>(null);

  // Supabase community listings state
  const [dbListings, setDbListings] = React.useState<CommunityListing[]>([]);
  const [loadingListings, setLoadingListings] = React.useState(false);

  // Fetch from Supabase
  React.useEffect(() => {
    setLoadingListings(true);
    fetchCommunityListings()
      .then(listings => {
        const mapped: CommunityListing[] = listings.map((item: any) => ({
          id: item.id,
          username: item.username,
          rating: item.rating,
          location: item.location,
          cardName: item.cardName,
          quantity: item.quantity,
          condition: (item.condition || 'NM') as any,
          foil: item.foil,
          language: item.language,
          priceUsd: item.priceUsd,
          notes: item.notes,
          contacted: sentContactIds.includes(item.id)
        }));
        setDbListings(mapped);
      })
      .catch(e => console.error(e))
      .finally(() => setLoadingListings(false));
  }, [sentContactIds]);

  // Filter available cards for search suggestions
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    return SEARCHABLE_DATABASE.filter(card =>
      card.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Generate deterministic community owners based on the card name/properties
  const cardOwners = React.useMemo(() => {
    if (!selectedCard) return [];

    // Filter dbListings for this card first
    const realListings = dbListings.filter(listing => 
      listing.cardName.toLowerCase() === selectedCard.name.toLowerCase()
    );

    const list: CommunityListing[] = [];
    
    if (realListings.length > 0) {
      list.push(...realListings);
    } else {
      // Use name length, price, and rarity to seed community listings dynamically (fallback)
      const seedNum = selectedCard.name.charCodeAt(0) + selectedCard.name.length;
      const numOwners = (seedNum % 3) + 2; // 2 to 4 owners for every card

      for (let i = 0; i < numOwners; i++) {
        const userIndex = (seedNum + i * 3) % COMMUNITY_USERS.length;
        const user = COMMUNITY_USERS[userIndex];
        
        const conditionOptions: ('NM' | 'SP' | 'MP' | 'HP')[] = ['NM', 'SP', 'MP'];
        const condition = conditionOptions[(seedNum + i) % conditionOptions.length];
        
        const langOptions = ['EN', 'ES', 'JA'];
        const language = langOptions[(seedNum + i * 2) % langOptions.length];
        
        const isFoil = selectedCard.foil || (seedNum + i * 7) % 5 === 0;
        
        // Price fluctuates slightly around official Scryfall price (+/- 10%)
        const pricePercentDelta = (((seedNum + i * 11) % 21) - 10) / 100; // -10% to +10%
        const priceUsd = Number((selectedCard.price * (1 + pricePercentDelta)).toFixed(2));
        
        const qty = ((seedNum + i) % 3) + 1;

        const notesPool = [
          'Impecable estado, directo del sobre a folio.',
          'Hago envíos por Andreani o Correo Argentino a todo el país.',
          'Solo permuto por cartas de Commander o Modern. Consultar por privado.',
          'Retiro en persona zona centro. No hago envíos.',
          'Foil impecable, ideal para coleccionistas.',
          'Descuento si llevas más de una carta de mi perfil.'
        ];
        const notes = notesPool[(seedNum + i * 4) % notesPool.length];

        const listingId = `listing-${selectedCard.id}-${user.username}-${condition}-${isFoil ? 'foil' : 'normal'}`;

        list.push({
          id: listingId,
          username: user.username,
          rating: user.rating,
          location: user.location,
          cardName: selectedCard.name,
          quantity: qty,
          condition,
          foil: isFoil,
          language,
          priceUsd,
          notes,
          contacted: sentContactIds.includes(listingId)
        });
      }
    }

    // Apply front-end filters to the listings
    return list.filter(listing => {
      const matchesCond = selectedCondition === 'ALL' || listing.condition === selectedCondition;
      const matchesLang = selectedLanguage === 'ALL' || listing.language === selectedLanguage;
      const matchesFoil = !onlyFoil || listing.foil;
      return matchesCond && matchesLang && matchesFoil;
    });
  }, [selectedCard, selectedCondition, selectedLanguage, onlyFoil, sentContactIds, dbListings]);

  // Global Recent Listings (pre-populated feed for visual density)
  const recentCommunityListings = React.useMemo(() => {
    const list: CommunityListing[] = [];
    
    // Add real database listings first
    if (dbListings.length > 0) {
      list.push(...dbListings.slice(0, 6));
    }

    // If we have less than 6 items, fill up with mock ones
    if (list.length < 6) {
      const cardsToUse = SEARCHABLE_DATABASE.filter(c => c.price > 10).slice(0, 6 - list.length);
      
      cardsToUse.forEach((card, idx) => {
        const user = COMMUNITY_USERS[idx % COMMUNITY_USERS.length];
        const conditions: ('NM' | 'SP' | 'MP')[] = ['NM', 'SP', 'MP'];
        const condition = conditions[idx % conditions.length];
        const priceUsd = Number((card.price * 0.98).toFixed(2));
        const listingId = `recent-list-${card.id}-${user.username}`;
        
        list.push({
          id: listingId,
          username: user.username,
          rating: user.rating,
          location: user.location,
          cardName: card.name,
          quantity: 1,
          condition,
          foil: idx % 3 === 0,
          language: idx % 2 === 0 ? 'ES' : 'EN',
          priceUsd,
          notes: 'Disponible para entrega inmediata.',
          contacted: sentContactIds.includes(listingId)
        });
      });
    }

    return list;
  }, [sentContactIds, dbListings]);

  // Intelligent Trade Auto-Matcher calculations based on user collection
  const autoMatches = React.useMemo(() => {
    if (!userCollection || userCollection.length === 0) return [];

    const matches: {
      id: string;
      partnerName: string;
      partnerRating: number;
      partnerLocation: string;
      userCard: Card;
      partnerCard: Card;
      priceDeltaUSD: number;
      notes: string;
    }[] = [];

    userCollection.slice(0, 6).forEach((userCard, idx) => {
      const partner = COMMUNITY_USERS[idx % COMMUNITY_USERS.length];
      
      const offers = SEARCHABLE_DATABASE.filter(c => c.name.toLowerCase() !== userCard.name.toLowerCase());
      
      const partnerCard = offers.find(c => c.price >= userCard.price * 0.7 && c.price <= userCard.price * 1.6) || offers[idx % offers.length];
      
      const priceDeltaUSD = partnerCard.price - userCard.price;

      matches.push({
        id: `automatch-${userCard.id}-${partner.username}-${idx}`,
        partnerName: partner.username,
        partnerRating: partner.rating,
        partnerLocation: partner.location,
        userCard,
        partnerCard,
        priceDeltaUSD,
        notes: `¡Coincidencia alta! Busca tu "${userCard.name}" y te ofrece su "${partnerCard.name}".`
      });
    });

    return matches;
  }, [userCollection]);

  // Trigger search on selected card
  const handleSelectCard = (card: Card) => {
    setSelectedCard(card);
    setSearchQuery(card.name);
    setShowSearchResults(false);
    // Reset filters
    setSelectedCondition('ALL');
    setSelectedLanguage('ALL');
    setOnlyFoil(false);
  };

  // Simulated messaging
  const handleOpenContactModal = (listing: CommunityListing) => {
    setActiveListingForContact(listing);
    setContactMessage(`Hola @${listing.username}, me interesa tu "${listing.cardName}" (${listing.condition}, ${listing.foil ? 'Foil' : 'Regular'}) por $${listing.priceUsd} USD. ¿Sigue disponible?`);
  };

  const handleOpenContactFromMatcher = (match: any) => {
    const simulatedListing: CommunityListing = {
      id: match.id,
      username: match.partnerName,
      rating: match.partnerRating,
      location: match.partnerLocation,
      cardName: match.partnerCard.name,
      quantity: 1,
      condition: 'NM',
      foil: match.partnerCard.foil,
      language: match.partnerCard.lang || 'EN',
      priceUsd: match.partnerCard.price,
      notes: match.notes,
      contacted: sentContactIds.includes(match.id)
    };
    setActiveListingForContact(simulatedListing);
    setContactMessage(`Hola @${match.partnerName}, vi en la sección de Canjes de TradeARG que buscás mi "${match.userCard.name}" ($${match.userCard.price.toFixed(2)} USD) y ofrecés "${match.partnerCard.name}" ($${match.partnerCard.price.toFixed(2)} USD). ¿Te interesa hacer un canje?`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeListingForContact) return;

    const listingId = activeListingForContact.id;
    setSentContactIds(prev => [...prev, listingId]);
    
    // Set notification message
    setSuccessNotification(`¡Mensaje enviado con éxito a @${activeListingForContact.username}! Te llegará una notificación cuando responda.`);
    
    // Close modal
    setActiveListingForContact(null);
    setContactMessage('');

    // Clear notification after 4 seconds
    setTimeout(() => {
      setSuccessNotification(null);
    }, 4500);
  };

  return (
    <div className="retro-grid min-h-screen pt-24 pb-20 px-4 md:px-12 max-w-7xl mx-auto flex flex-col justify-between">
      {/* Top Background glowing spotlight */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <main className="flex-1 flex flex-col py-8 z-10 relative">
        <div className="w-full max-w-5xl mx-auto space-y-10">
          
          {/* Header Title block */}
          <div className="text-center select-none space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#00f2ff]/10 border border-[#00f2ff]/20 text-[#00f2ff] text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              Comunidad TradeARG
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-on-surface">
              Área de <span className="text-primary drop-shadow-[0_0_10px_rgba(0,184,255,0.4)]">Intercambio</span>
            </h2>
            <p className="text-on-surface-variant text-xs sm:text-sm max-w-xl mx-auto font-normal">
              Conectá con jugadores de todo el país. Buscá poseedores de cartas específicas o dejá que el sistema de Auto-Matcher analice coincidencias de canje directo con tu inventario.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center border-b border-[#2d2d44] max-w-md mx-auto" id="community-tab-switcher">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer ${
                activeTab === 'search'
                  ? 'border-primary text-primary drop-shadow-[0_0_10px_rgba(0,184,255,0.3)] font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Buscador de Cartas
            </button>
            <button
              onClick={() => setActiveTab('matcher')}
              className={`flex-1 pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer ${
                activeTab === 'matcher'
                  ? 'border-primary text-primary drop-shadow-[0_0_10px_rgba(0,184,255,0.3)] font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Canjes Inteligentes ({autoMatches.length})
            </button>
          </div>

          {/* Success toast alert */}
          {successNotification && (
            <div className="bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 p-4 rounded-xl flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.25)] animate-bounce">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <p className="text-xs font-bold font-sans">{successNotification}</p>
            </div>
          )}

          {activeTab === 'search' ? (
            /* BUSCADOR DE CARTAS TAB */
            <div className="space-y-8 animate-fadeIn">
              {/* Card Searcher Bar Area */}
              <div className="relative max-w-3xl mx-auto z-30">
                <div className="relative bg-surface/80 border-2 border-primary/30 rounded-xl hover:border-primary focus-within:border-primary shadow-2xl transition-all duration-300 backdrop-blur-lg">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Search className="text-primary text-xl w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    placeholder="ESCRIBÍ EL NOMBRE DE LA CARTA QUE BUSCÁS..."
                    className="w-full bg-transparent border-none rounded-xl py-4 md:py-5 pl-14 pr-16 text-xs sm:text-base font-light text-on-surface placeholder-[#464554] focus:ring-0 outline-none uppercase font-sans tracking-wider"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCard(null);
                        setShowSearchResults(false);
                      }}
                      className="absolute inset-y-0 right-4 flex items-center text-xs text-[#00f2ff] hover:text-primary uppercase font-bold"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Search Suggestion Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d1a] border border-[#2d2d44] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[250px] overflow-y-auto z-50">
                    {searchResults.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => handleSelectCard(card)}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-primary/10 cursor-pointer border-b border-white/5 transition-colors"
                      >
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-10 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-on-surface truncate">{card.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono uppercase">{card.setName} ({card.rarity})</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono font-bold text-secondary">${card.price.toFixed(2)} USD</p>
                          <p className="text-[9px] text-[#908fa0] font-mono">~${Math.round(card.price * pesoRate).toLocaleString('es-AR')} ARS</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedCard ? (
                /* Selected Card Owners Search Results View */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
                  
                  {/* Left Column: Card Profile Showcase */}
                  <div className="lg:col-span-4 bg-[#121221] border border-[#2d2d44] p-6 rounded-2xl flex flex-col items-center text-center space-y-4">
                    <div 
                      className="w-48 aspect-[63/88] rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-black/40 relative group cursor-pointer"
                      onClick={() => onCardSelect(selectedCard)}
                    >
                      <img
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={selectedCard.imageUrl}
                        alt={selectedCard.name}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 bg-black/70 border border-primary/40 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-primary">
                        {selectedCard.rarity}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 
                        onClick={() => onCardSelect(selectedCard)}
                        className="text-lg font-black text-on-surface hover:text-primary transition-colors cursor-pointer"
                      >
                        {selectedCard.name}
                      </h3>
                      <p className="text-[11px] text-on-surface-variant uppercase font-medium">
                        {selectedCard.setName} (#{selectedCard.collectorNumber})
                      </p>
                    </div>

                    {/* Reference values */}
                    <div className="w-full border-t border-[#2d2d44] pt-4 grid grid-cols-2 gap-4">
                      <div className="bg-[#05050a]/50 p-2.5 rounded border border-white/5">
                        <span className="block text-[8px] font-black text-[#908fa0] uppercase tracking-widest mb-1">Referencia Scryfall</span>
                        <span className="font-mono text-sm font-bold text-secondary">${selectedCard.price.toFixed(2)} USD</span>
                      </div>
                      <div className="bg-[#05050a]/50 p-2.5 rounded border border-white/5">
                        <span className="block text-[8px] font-black text-[#908fa0] uppercase tracking-widest mb-1">Equivalente ARS</span>
                        <span className="font-mono text-sm font-bold text-primary">${Math.round(selectedCard.price * pesoRate).toLocaleString('es-AR')} ARS</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCard(null);
                        setSearchQuery('');
                      }}
                      className="w-full text-xs text-[#908fa0] hover:text-white transition-colors pt-2 border-t border-white/5 font-sans font-bold"
                    >
                      ← Buscar otra carta
                    </button>
                  </div>

                  {/* Right Column: Listing Table and Filters */}
                  <div className="lg:col-span-8 bg-[#121221] border border-primary/20 rounded-2xl p-6 space-y-6">
                    
                    {/* Owners section header and filters */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#2d2d44] pb-4">
                      <div>
                        <h3 className="font-sans text-xs font-black uppercase tracking-widest text-[#00f2ff] flex items-center gap-1.5">
                          <User className="w-4 h-4 text-[#00f2ff]" />
                          Poseedores Disponibles ({cardOwners.length})
                        </h3>
                        <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">Filtros aplicados para: {selectedCard.name}</p>
                      </div>

                      {/* Filter Toolbar controls */}
                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {/* Condition selector */}
                        <div className="bg-[#05050a] border border-[#2d2d44] rounded px-2 py-1 flex items-center">
                          <select
                            value={selectedCondition}
                            onChange={(e) => setSelectedCondition(e.target.value)}
                            className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#dae2fd] border-none outline-none focus:ring-0 cursor-pointer pr-6 py-0.5"
                          >
                            <option value="ALL">Cualquier Estado</option>
                            <option value="NM">NM (Near Mint)</option>
                            <option value="SP">SP (Slightly Played)</option>
                            <option value="MP">MP (Moderately Played)</option>
                            <option value="HP">HP (Heavily Played)</option>
                          </select>
                        </div>

                        {/* Language selector */}
                        <div className="bg-[#05050a] border border-[#2d2d44] rounded px-2 py-1 flex items-center">
                          <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#dae2fd] border-none outline-none focus:ring-0 cursor-pointer pr-6 py-0.5"
                          >
                            <option value="ALL">Cualquier Idioma</option>
                            <option value="EN">EN (Inglés)</option>
                            <option value="ES">ES (Español)</option>
                            <option value="JA">JA (Japonés)</option>
                          </select>
                        </div>

                        {/* Foil toggler */}
                        <button
                          onClick={() => setOnlyFoil(!onlyFoil)}
                          className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all border ${
                            onlyFoil
                              ? 'bg-gradient-to-r from-teal-500/20 to-pink-500/20 border-pink-500 text-pink-400'
                              : 'bg-[#05050a] border-[#2d2d44] text-[#908fa0]'
                          }`}
                        >
                          Foil ✨
                        </button>
                      </div>
                    </div>

                    {/* Table list of Owners */}
                    <div className="space-y-4">
                      {cardOwners.map((listing) => {
                        const priceInARS = Math.round(listing.priceUsd * pesoRate);
                        const isSent = sentContactIds.includes(listing.id);

                        return (
                          <div 
                            key={listing.id}
                            className="group bg-[#05050a]/40 border border-[#2d2d44] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-primary/40 hover:bg-[#05050a]/60"
                          >
                            {/* Owner Profiling */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]"></span>
                                <span className="font-sans font-bold text-xs text-on-surface">@{listing.username}</span>
                                <span className="text-[9px] font-mono text-secondary bg-secondary/10 px-1.5 py-0.5 rounded font-bold">★ {listing.rating}</span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-on-surface-variant font-sans">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#908fa0]" />
                                  {listing.location}
                                </span>
                                <span className="text-[#2d2d44]">•</span>
                                <span>Disp: <strong className="text-on-surface">{listing.quantity}x</strong></span>
                              </div>

                              {/* Specific Owner Notes */}
                              <p className="text-[10px] text-[#908fa0] leading-relaxed italic bg-white/5 p-2 rounded border border-white/5">
                                "{listing.notes}"
                              </p>
                            </div>

                            {/* Inventory specifications */}
                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 sm:gap-2">
                              
                              {/* Card state characteristics tags */}
                              <div className="flex flex-wrap gap-1.5 justify-end">
                                <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded font-mono ${
                                  listing.condition === 'NM' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : listing.condition === 'SP'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {listing.condition === 'NM' ? 'NM (Near Mint)' : listing.condition === 'SP' ? 'SP (Slightly Played)' : listing.condition === 'MP' ? 'MP (Moderately Played)' : 'HP (Heavily Played)'}
                                </span>

                                <span className="bg-[#121221] text-on-surface-variant border border-[#2d2d44] text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  {listing.language}
                                </span>

                                {listing.foil && (
                                  <span className="bg-gradient-to-r from-teal-400 to-pink-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded tracking-widest uppercase shadow-[0_0_8px_rgba(244,114,182,0.3)]">
                                    FOIL ✨
                                  </span>
                                )}
                              </div>

                              {/* Pricing and request messaging button */}
                              <div className="text-left sm:text-right">
                                <p className="text-sm font-mono font-black text-secondary">${listing.priceUsd.toFixed(2)} USD</p>
                                <p className="text-[10px] text-[#908fa0] font-mono">~${priceInARS.toLocaleString('es-AR')} ARS</p>
                              </div>

                              {/* Contact buttons */}
                              <button
                                onClick={() => handleOpenContactModal(listing)}
                                disabled={isSent}
                                className={`w-full sm:w-auto px-4 py-2 rounded text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                  isSent 
                                    ? 'bg-[#121221] border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                                    : 'bg-primary hover:brightness-110 text-white shadow-[0_0_12px_rgba(0,184,255,0.35)] active:scale-95'
                                }`}
                              >
                                {isSent ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    Mensaje Enviado
                                  </>
                                ) : (
                                  <>
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    Enviar Consulta
                                  </>
                                )}
                              </button>

                            </div>

                          </div>
                        );
                      })}

                      {cardOwners.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-[#2d2d44] rounded-xl">
                          <AlertCircle className="w-8 h-8 text-primary/40 mx-auto mb-2 select-none" />
                          <p className="text-xs text-on-surface font-sans">No hay poseedores para esta combinación de filtros</p>
                          <p className="text-[10px] text-secondary mt-1">Prueba cambiando la rareza, el idioma, o desmarcando la opción de Foil.</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ) : (
                /* Global Listings Feed when no card has been selected yet */
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-[#2d2d44] pb-2">
                    <h3 className="font-sans text-xs font-black uppercase tracking-widest text-[#908fa0]">
                      Publicaciones Recientes de la Comunidad
                    </h3>
                    <span className="text-[10px] text-[#908fa0] font-mono">
                      Cotización: ${pesoRate.toFixed(0)} ARS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentCommunityListings.map((listing) => {
                      const matchingCard = SEARCHABLE_DATABASE.find(c => c.name === listing.cardName) || SEARCHABLE_DATABASE[0];
                      const priceInARS = Math.round(listing.priceUsd * pesoRate);
                      const isSent = sentContactIds.includes(listing.id);

                      return (
                        <div 
                          key={listing.id}
                          className="bg-[#121221]/90 border border-[#2d2d44] rounded-xl p-4 flex flex-col justify-between relative group hover:border-[#00f2ff]/30 transition-all shadow-lg hover:shadow-[0_0_15px_rgba(0,242,255,0.1)]"
                        >
                          {/* Top listing properties */}
                          <div className="space-y-3">
                            {/* Header user info */}
                            <div className="flex items-center justify-between border-b border-[#2d2d44]/50 pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                <span className="text-[11px] font-sans font-bold text-on-surface">@{listing.username}</span>
                              </div>
                              <span className="text-[9px] text-secondary font-mono">★ {listing.rating}</span>
                            </div>

                            {/* Card metadata preview */}
                            <div className="flex gap-3">
                              <img 
                                src={matchingCard.imageUrl} 
                                alt={listing.cardName} 
                                referrerPolicy="no-referrer"
                                className="w-10 h-14 object-cover rounded shadow cursor-pointer"
                                onClick={() => handleSelectCard(matchingCard)}
                              />
                              <div className="flex-1 min-w-0">
                                <p 
                                  onClick={() => handleSelectCard(matchingCard)}
                                  className="font-sans font-bold text-xs text-on-surface truncate cursor-pointer hover:text-secondary transition-colors"
                                >
                                  {listing.cardName}
                                </p>
                                <p className="text-[9px] text-[#908fa0] font-mono uppercase mt-0.5">
                                  {matchingCard.setName}
                                </p>
                                <div className="flex gap-1.5 mt-1">
                                  <span className="text-[8px] font-bold font-mono bg-white/5 text-on-surface-variant px-1 rounded">
                                    {listing.condition}
                                  </span>
                                  <span className="text-[8px] font-bold font-mono bg-white/5 text-on-surface-variant px-1 rounded uppercase">
                                    {listing.language}
                                  </span>
                                  {listing.foil && (
                                    <span className="bg-gradient-to-r from-teal-400 to-pink-500 text-white font-extrabold text-[7px] px-1 rounded uppercase tracking-wider">
                                      FOIL ✨
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Pricing and quick CTA */}
                          <div className="mt-4 pt-3 border-t border-[#2d2d44]/50 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-mono font-bold text-secondary">${listing.priceUsd.toFixed(2)} USD</p>
                              <p className="text-[9px] text-[#908fa0] font-mono">~${priceInARS.toLocaleString('es-AR')} ARS</p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSelectCard(matchingCard)}
                                className="bg-[#05050a] hover:bg-secondary/10 border border-[#2d2d44] hover:border-secondary text-[#c7c4d7] hover:text-[#00f2ff] px-2.5 py-1.5 rounded text-[8px] font-extrabold uppercase tracking-widest transition-all cursor-pointer"
                              >
                                Ver Todos
                              </button>

                              <button
                                onClick={() => handleOpenContactModal(listing)}
                                disabled={isSent}
                                className={`px-3 py-1.5 rounded text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 ${
                                  isSent 
                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                    : 'bg-primary text-white hover:brightness-110 shadow-sm'
                                }`}
                              >
                                {isSent ? 'Enviado' : 'Consulta'}
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* AUTO-MATCHER TAB (CANJES INTELIGENTES) */
            <div className="space-y-6 animate-fadeIn" id="auto-matcher-panel">
              <div className="border-b border-[#2d2d44] pb-2 flex justify-between items-center">
                <h3 className="font-sans text-xs font-black uppercase tracking-widest text-[#908fa0]">
                  Matches de Canje con tu Inventario
                </h3>
                <span className="text-[10px] text-[#908fa0] font-mono">
                  Cotización: ${pesoRate.toFixed(0)} ARS
                </span>
              </div>

              {userCollection.length === 0 ? (
                <div className="text-center py-20 bg-[#121221] border border-dashed border-primary/20 rounded-2xl">
                  <span className="material-symbols-outlined text-5xl text-primary/30 mb-2">
                    inventory_2
                  </span>
                  <p className="text-sm font-bold text-on-surface">Tu colección está vacía</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Para buscar combinaciones de canje, primero agrega cartas en tu panel de Colección.
                  </p>
                  <button
                    onClick={() => onViewChange('collection')}
                    className="mt-6 bg-primary hover:brightness-110 text-white px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Ir a mi Colección
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {autoMatches.map((match) => {
                    const deltaARS = Math.round(match.priceDeltaUSD * pesoRate);
                    const isSent = sentContactIds.includes(match.id);

                    return (
                      <div 
                        key={match.id}
                        className="bg-[#121221] border border-primary/20 p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-6 hover:border-secondary/40 transition-all duration-300 relative group"
                      >
                        {/* Partner profile header on left/top */}
                        <div className="flex items-center gap-3 w-full lg:w-1/5 border-b lg:border-b-0 lg:border-r border-[#2d2d44]/50 pb-4 lg:pb-0 pr-4">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]"></span>
                          <div>
                            <p className="font-bold text-xs text-on-surface">@{match.partnerName}</p>
                            <span className="text-[9px] font-mono text-secondary bg-secondary/10 px-1.5 py-0.5 rounded font-bold">★ {match.partnerRating}</span>
                            <p className="text-[9px] text-on-surface-variant font-mono mt-1 truncate max-w-[130px]">{match.partnerLocation}</p>
                          </div>
                        </div>

                        {/* Swap visualizer cards container */}
                        <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-6 w-full">
                          
                          {/* User card (give) */}
                          <div className="flex items-center gap-4 w-full sm:w-5/12 bg-[#05050a]/40 p-3 rounded-xl border border-white/5">
                            <img src={match.userCard.imageUrl} alt={match.userCard.name} className="w-10 h-14 object-cover rounded shadow" />
                            <div className="min-w-0">
                              <span className="text-[8px] font-black text-red-400 uppercase tracking-widest block mb-0.5">Entregás</span>
                              <p className="text-xs font-bold text-on-surface truncate" title={match.userCard.name}>{match.userCard.name}</p>
                              <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">${match.userCard.price.toFixed(2)} USD</p>
                            </div>
                          </div>

                          {/* Swap icon & Delta values */}
                          <div className="flex flex-col items-center justify-center text-center px-2 select-none">
                            <span className="material-symbols-outlined text-secondary text-2xl animate-pulse">
                              swap_horiz
                            </span>
                            <div className={`text-xs font-mono font-black mt-1 ${match.priceDeltaUSD >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {match.priceDeltaUSD >= 0 ? `+$${match.priceDeltaUSD.toFixed(2)}` : `-$${Math.abs(match.priceDeltaUSD).toFixed(2)}`}
                            </div>
                            <span className="text-[8px] text-on-surface-variant font-mono uppercase tracking-wide">
                              {match.priceDeltaUSD >= 0 ? 'A tu favor' : 'En tu contra'}
                            </span>
                            <span className="text-[8px] text-[#908fa0] font-mono mt-0.5">
                              {deltaARS >= 0 ? `+$${deltaARS.toLocaleString('es-AR')}` : `-$${Math.abs(deltaARS).toLocaleString('es-AR')}`} ARS
                            </span>
                          </div>

                          {/* Partner card (receive) */}
                          <div className="flex items-center gap-4 w-full sm:w-5/12 bg-[#05050a]/40 p-3 rounded-xl border border-white/5">
                            <img src={match.partnerCard.imageUrl} alt={match.partnerCard.name} className="w-10 h-14 object-cover rounded shadow" />
                            <div className="min-w-0">
                              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">Recibís</span>
                              <p className="text-xs font-bold text-on-surface truncate" title={match.partnerCard.name}>{match.partnerCard.name}</p>
                              <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">${match.partnerCard.price.toFixed(2)} USD</p>
                            </div>
                          </div>

                        </div>

                        {/* Action buttons */}
                        <div className="w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-[#2d2d44]/50 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-center items-center lg:items-end gap-3 min-w-[130px]">
                          <button
                            onClick={() => handleOpenContactFromMatcher(match)}
                            disabled={isSent}
                            className={`w-full px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isSent 
                                ? 'bg-[#05050a] border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                                : 'bg-primary hover:brightness-110 text-white shadow-[0_0_10px_rgba(0,184,255,0.35)] active:scale-95'
                            }`}
                          >
                            {isSent ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Canje Propuesto
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-3.5 h-3.5" />
                                Proponer Canje
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Messaging Modal overlay */}
      {activeListingForContact && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0b1326] border-2 border-secondary/40 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,242,255,0.25)] p-6 relative">
            <h4 className="font-sans text-xs font-black uppercase tracking-widest text-[#908fa0] mb-1 select-none">
              Enviar Propuesta de Canje
            </h4>
            <h3 className="text-lg font-black text-on-surface uppercase italic mb-4">
              A @{activeListingForContact.username}
            </h3>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-[#908fa0] mb-1 font-sans select-none">
                  Tu propuesta / Consulta
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  required
                  className="w-full bg-[#121221] border border-[#2d2d44] text-[#dae2fd] text-xs rounded-lg p-3 focus:outline-none focus:border-secondary resize-none placeholder:text-[#c7c4d7]/30 font-sans"
                />
                <p className="text-[9px] text-[#908fa0] font-mono mt-1 select-none">
                  ⚠️ El sistema emulará el envío de este mensaje de manera exitosa para que puedas validar el flujo del sector.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-[#2d2d44]">
                <button
                  type="button"
                  onClick={() => setActiveListingForContact(null)}
                  className="bg-transparent border border-[#2d2d44] hover:bg-[#121221] px-4 py-2.5 rounded text-[10px] font-black uppercase tracking-widest text-[#dae2fd] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-secondary text-black font-black px-5 py-2.5 rounded text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,242,255,0.4)] cursor-pointer"
                >
                  Enviar Mensaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer copyright section */}
      <footer className="py-8 text-center border-t border-primary/10 select-none">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#464554]">
          TradeARG // PROTOCOLO V.2.0.4
        </p>
      </footer>

      {/* Floating "+ Add New Card" button on the side (moves with scroll) */}
      <button
        onClick={() => onViewChange('import')}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 bg-gradient-to-r from-primary to-secondary text-white font-black px-5 py-3.5 rounded-full uppercase tracking-widest text-[10px] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,184,255,0.5)] cursor-pointer flex items-center gap-2 hover:shadow-[0_0_35px_rgba(0,242,255,0.7)] group border border-white/10"
        title="Agregar Nueva Carta"
      >
        <span className="material-symbols-outlined text-sm font-bold group-hover:rotate-90 transition-transform duration-300">add</span>
        <span>Add New Card</span>
      </button>
    </div>
  );
}
