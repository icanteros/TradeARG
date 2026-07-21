import React from 'react';
import { Card } from './types';
import { INITIAL_CARDS } from './data';
import Header from './components/Header';
import LandingView from './components/LandingView';
import CollectionView from './components/CollectionView';
import CommunitySearchView from './components/CommunitySearchView';
import CardDetailModal from './components/CardDetailModal';
import ImportView from './components/ImportView';
import ProfileView from './components/ProfileView';
import TradesInboxView from './components/TradesInboxView';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import {
  fetchUserProfile,
  updateUserProfile,
  fetchUserCollection,
  saveCollectionItem,
  deleteCollectionItem,
  fetchTrades
} from './supabaseService';

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = React.useState<'landing' | 'collection' | 'trade' | 'import' | 'profile' | 'trades_inbox'>('landing');
  const [dashboardSearchQuery, setDashboardSearchQuery] = React.useState('');
  const [pendingTradesCount, setPendingTradesCount] = React.useState(0);

  // Supabase Session State
  const [session, setSession] = React.useState<Session | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  // User Profile configuration
  const [userProfile, setUserProfile] = React.useState(() => {
    try {
      const saved = localStorage.getItem('tradearg_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      username: 'Neo_User',
      location: 'CABA, Buenos Aires',
      stores: 'Magic Lair, Sector 9',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbdoIxp_Cnk7hU5w0DX4ZH_TSG_MByPvwQyeIP58d1q89JJOw8ze26_JmPuIdS3ImrcV1bDUfNg01DYsW5biuiu-2y37bxw6w5ULCET2XIgG23uctjIEa-v-_A1u5CDQP5tGJaREtDq4BmfaYANOMTojgGR-bywm3I3DB4DKEsP9o8SfAXElwDlQqtGy8dAr6lmJk8rMwLBkWdapJY8-KYbTB47OUvTArd-1wwARK7eyiGltZw7Zpei7D9kH4sJN6W8xc7cDJQPE0'
    };
  });

  const handleUpdateProfile = async (updated: typeof userProfile) => {
    setUserProfile(updated);
    localStorage.setItem('tradearg_user_profile', JSON.stringify(updated));
    if (session) {
      await updateUserProfile(session.user.id, updated);
    }
  };

  // Dollar Rates
  const [dollarType, setDollarType] = React.useState<'official' | 'blue'>(() => {
    try {
      const saved = localStorage.getItem('tradearg_dollar_type');
      if (saved === 'official' || saved === 'blue') return saved;
    } catch (e) {}
    return 'blue'; // Default to Blue as it's standard for MTG trades
  });

  const [pesoRate, setPesoRate] = React.useState<number>(950); // default official rate fallback
  const [bluePesoRate, setBluePesoRate] = React.useState<number>(1420); // default blue rate fallback

  // Fetch live Official and Blue rates
  React.useEffect(() => {
    const fetchRates = async () => {
      try {
        // Fetch Official Rate
        const officialRes = await fetch('https://dolarapi.com/v1/dolares/oficial');
        if (officialRes.ok) {
          const data = await officialRes.json();
          if (data && data.venta) {
            setPesoRate(data.venta);
          }
        }
      } catch (e) {
        console.error('Error fetching dolar oficial rate:', e);
      }

      try {
        // Fetch Blue Rate
        const blueRes = await fetch('https://dolarapi.com/v1/dolares/blue');
        if (blueRes.ok) {
          const data = await blueRes.json();
          if (data && data.venta) {
            setBluePesoRate(data.venta);
          }
        }
      } catch (e) {
        console.error('Error fetching dolar blue rate:', e);
      }
    };
    fetchRates();
  }, []);

  const activePesoRate = dollarType === 'official' ? pesoRate : bluePesoRate;

  // Collection State
  const [collection, setCollection] = React.useState<Card[]>(INITIAL_CARDS);

  // Sync / Listen to Supabase Auth and load collections accordingly
  React.useEffect(() => {
    setAuthLoading(true);
    
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserData(session.user.id);
      } else {
        loadLocalCollection();
        setAuthLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadUserData(session.user.id);
      } else {
        loadLocalCollection();
        // Reset profile to default
        setUserProfile({
          username: 'Neo_User',
          location: 'CABA, Buenos Aires',
          stores: 'Magic Lair, Sector 9',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbdoIxp_Cnk7hU5w0DX4ZH_TSG_MByPvwQyeIP58d1q89JJOw8ze26_JmPuIdS3ImrcV1bDUfNg01DYsW5biuiu-2y37bxw6w5ULCET2XIgG23uctjIEa-v-_A1u5CDQP5tGJaREtDq4BmfaYANOMTojgGR-bywm3I3DB4DKEsP9o8SfAXElwDlQqtGy8dAr6lmJk8rMwLBkWdapJY8-KYbTB47OUvTArd-1wwARK7eyiGltZw7Zpei7D9kH4sJN6W8xc7cDJQPE0'
        });
        setAuthLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const profile = await fetchUserProfile(userId);
      if (profile) {
        setUserProfile(profile);
      }
      const dbCollection = await fetchUserCollection(userId);
      setCollection(dbCollection);
    } catch (e) {
      console.error('Error loading Supabase user data:', e);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadLocalCollection = () => {
    try {
      const saved = localStorage.getItem('tradearg_collection');
      if (saved) {
        setCollection(JSON.parse(saved));
      } else {
        setCollection(INITIAL_CARDS);
      }
    } catch (e) {
      setCollection(INITIAL_CARDS);
    }
  };

  // Persist collection to localStorage ONLY if guest user (not logged in)
  React.useEffect(() => {
    if (!session && !authLoading) {
      localStorage.setItem('tradearg_collection', JSON.stringify(collection));
    }
  }, [collection, session, authLoading]);

  // Poll pending trades count for authenticated user
  React.useEffect(() => {
    if (!session) {
      setPendingTradesCount(0);
      return;
    }

    const checkPendingTrades = async () => {
      try {
        const trades = await fetchTrades(session.user.id);
        const pending = trades.filter(t => t.receiverId === session.user.id && t.status === 'Pending');
        setPendingTradesCount(pending.length);
      } catch (e) {
        console.error('Error checking pending trades:', e);
      }
    };

    checkPendingTrades();
    const interval = setInterval(checkPendingTrades, 15000);
    return () => clearInterval(interval);
  }, [session]);

  // Card detail modal control
  const [selectedCard, setSelectedCard] = React.useState<Card | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Zoom state for card magnifier
  const [zoomedCard, setZoomedCard] = React.useState<Card | null>(null);

  // Quick edit quantity directly on tile
  const handleUpdateQuantity = async (cardId: string, delta: number) => {
    let cardToSave: Card | null = null;
    let shouldDelete = false;

    setCollection(prev => {
      return prev.map(card => {
        if (card.id === cardId) {
          const nextQty = Math.max(0, card.quantity + delta);
          if (nextQty === 0) {
            shouldDelete = true;
          }
          cardToSave = { ...card, quantity: nextQty };
          return cardToSave;
        }
        return card;
      }).filter(card => card.quantity > 0); // Cleanup if quantity becomes 0
    });

    if (session) {
      if (shouldDelete) {
        await deleteCollectionItem(cardId);
      } else if (cardToSave) {
        await saveCollectionItem(session.user.id, cardToSave);
      }
    }
  };

  // Add new card flow (generates blank custom card)
  const handleAddNewCardClick = () => {
    const blankCard: Card = {
      id: `new-${Date.now()}`,
      name: 'Nueva Carta MTG',
      price: 15.00,
      quantity: 1,
      rarity: 'Rare',
      imageUrl: 'https://cards.scryfall.io/normal/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg', // Retro default card back
      setName: 'Custom Set',
      collectorNumber: '42',
      foil: false,
      lang: 'EN',
      notes: '',
      usdPriceHistory: [
        { date: '10 Jun', value: 12.00 },
        { date: '15 Jun', value: 13.50 },
        { date: '20 Jun', value: 14.20 },
        { date: '25 Jun', value: 14.80 },
        { date: '30 Jun', value: 15.00 }
      ]
    };
    setSelectedCard(blankCard);
    setIsModalOpen(true);
  };

  // Trigger modal for editing existing card
  const handleEditCardClick = (card: Card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  // Callback to add a card directly to collection
  const handleAddCardToCollection = async (card: Card) => {
    if (session) {
      // Check if it already exists in the local state (matching name, set, collector number, and foil)
      const existing = collection.find(c => 
        c.name.toLowerCase() === card.name.toLowerCase() &&
        (c.setName || '').toLowerCase() === (card.setName || '').toLowerCase() &&
        (c.collectorNumber || '').toLowerCase() === (card.collectorNumber || '').toLowerCase() &&
        c.foil === card.foil
      );
      if (existing) {
        const updated = { ...existing, quantity: existing.quantity + 1 };
        setCollection(prev => prev.map(c => c.id === existing.id ? updated : c));
        await saveCollectionItem(session.user.id, updated);
      } else {
        const cloned: Card = {
          ...card,
          id: `new-${Date.now()}`, // Temporary local ID
          quantity: 1,
          notes: 'Añadida a la colección'
        };
        const saved = await saveCollectionItem(session.user.id, cloned);
        if (saved) {
          setCollection(prev => [...prev, saved]);
        }
      }
    } else {
      setCollection(prev => {
        const existing = prev.find(c => 
          c.name.toLowerCase() === card.name.toLowerCase() &&
          (c.setName || '').toLowerCase() === (card.setName || '').toLowerCase() &&
          (c.collectorNumber || '').toLowerCase() === (card.collectorNumber || '').toLowerCase() &&
          c.foil === card.foil
        );
        if (existing) {
          // Increment quantity if already possessed
          return prev.map(c => c.id === existing.id ? { ...c, quantity: c.quantity + 1 } : c);
        }
        // Otherwise clone and append to active collection with quantity 1
        const cloned: Card = {
          ...card,
          id: `collection-${Date.now()}`,
          quantity: 1,
          notes: 'Añadida a la colección'
        };
        return [...prev, cloned];
      });
    }
  };

  // Save changes from details modal back to the collection list
  const handleSaveCardDetails = async (updated: Card) => {
    if (session) {
      const saved = await saveCollectionItem(session.user.id, updated);
      if (saved) {
        setCollection(prev => {
          const exists = prev.some(c => c.id === updated.id || c.id === saved.id);
          if (exists) {
            return prev.map(c => (c.id === updated.id || c.id === saved.id) ? saved : c);
          }
          return [...prev, saved];
        });
      }
    } else {
      setCollection(prev => {
        const exists = prev.some(c => c.id === updated.id);
        if (exists) {
          return prev.map(c => c.id === updated.id ? updated : c);
        }
        return [...prev, updated];
      });
    }
  };

  // Delete card from collection list
  const handleDeleteCard = async (cardId: string) => {
    setCollection(prev => prev.filter(c => c.id !== cardId));
    if (session) {
      await deleteCollectionItem(cardId);
    }
  };

  // Global search from header routes to import & queries the item
  const handleSearchGlobal = (query: string) => {
    setCurrentView('import');
    setDashboardSearchQuery(query);
  };

  return (
    <div className="bg-[#05050a] text-[#dae2fd] min-h-screen relative font-sans">
      
      {/* Universal header navigation */}
      <Header 
        currentView={currentView} 
        onViewChange={(view) => setCurrentView(view)}
        onSearchGlobal={handleSearchGlobal}
        openAddCard={() => setCurrentView('import')}
        pesoRate={activePesoRate}
        officialRate={pesoRate}
        blueRate={bluePesoRate}
        dollarType={dollarType}
        onDollarTypeChange={(type) => {
          setDollarType(type);
          localStorage.setItem('tradearg_dollar_type', type);
        }}
        userProfile={userProfile}
        session={session}
        onLogout={() => supabase.auth.signOut()}
        pendingTradesCount={pendingTradesCount}
      />

      {/* Primary views selection switcher */}
      <div className="w-full">
        {currentView === 'landing' && (
          <LandingView onNavigate={(view) => setCurrentView(view)} />
        )}

        {currentView === 'collection' && (
          <CollectionView 
            cards={collection}
            onAddCard={() => setCurrentView('import')}
            onEditCard={handleEditCardClick}
            onUpdateQuantity={handleUpdateQuantity}
            onViewChange={(view) => setCurrentView(view)}
            pesoRate={activePesoRate}
            onZoomCard={setZoomedCard}
          />
        )}

        {currentView === 'trade' && (
          <CommunitySearchView 
            userCollection={collection}
            onCardSelect={(card) => handleEditCardClick(card)}
            onViewChange={(view) => setCurrentView(view)}
            pesoRate={activePesoRate}
            onZoomCard={setZoomedCard}
            profileId={session?.user.id}
          />
        )}

        {currentView === 'trades_inbox' && (
          session ? (
            <TradesInboxView 
              profileId={session.user.id}
              pesoRate={activePesoRate}
              onViewChange={(view) => setCurrentView(view)}
              onZoomCard={setZoomedCard}
            />
          ) : (
            <div className="retro-grid min-h-screen pt-32 pb-20 px-6 max-w-md mx-auto text-center flex flex-col justify-center items-center">
              <span className="material-symbols-outlined text-5xl text-primary mb-4 animate-pulse">lock</span>
              <h3 className="text-xl font-black uppercase italic mb-2 text-on-surface">Iniciar Sesión Requerido</h3>
              <p className="text-xs text-on-surface-variant mb-6">Debes iniciar sesión o crear una cuenta para ver tu bandeja de entrada de propuestas de canje.</p>
              <button 
                onClick={() => setCurrentView('profile')}
                className="bg-primary text-white font-black px-6 py-3 rounded-full text-xs tracking-widest uppercase hover:scale-105 shadow-[0_0_20px_rgba(0,184,255,0.4)] transition-all cursor-pointer"
              >
                Ir a mi Perfil
              </button>
            </div>
          )
        )}

        {currentView === 'import' && (
          <ImportView 
            onAddCardsBulk={async (cardsToAdd) => {
              if (session) {
                const updatedList = [...collection];
                for (const card of cardsToAdd) {
                  const existingIndex = updatedList.findIndex(c => 
                    c.name.toLowerCase() === card.name.toLowerCase() &&
                    (c.setName || '').toLowerCase() === (card.setName || '').toLowerCase() &&
                    (c.collectorNumber || '').toLowerCase() === (card.collectorNumber || '').toLowerCase() &&
                    c.foil === card.foil
                  );
                  if (existingIndex > -1) {
                    const updated = {
                      ...updatedList[existingIndex],
                      quantity: updatedList[existingIndex].quantity + card.quantity
                    };
                    updatedList[existingIndex] = updated;
                    await saveCollectionItem(session.user.id, updated);
                  } else {
                    const cloned: Card = {
                      ...card,
                      id: `bulk-${Date.now()}-${Math.random()}`
                    };
                    const saved = await saveCollectionItem(session.user.id, cloned);
                    if (saved) {
                      updatedList.push(saved);
                    }
                  }
                }
                setCollection(updatedList);
              } else {
                setCollection(prev => {
                  const nextCollection = [...prev];
                  cardsToAdd.forEach(card => {
                    const existingIndex = nextCollection.findIndex(c => 
                      c.name.toLowerCase() === card.name.toLowerCase() &&
                      (c.setName || '').toLowerCase() === (card.setName || '').toLowerCase() &&
                      (c.collectorNumber || '').toLowerCase() === (card.collectorNumber || '').toLowerCase() &&
                      c.foil === card.foil
                    );
                    if (existingIndex > -1) {
                      nextCollection[existingIndex] = {
                        ...nextCollection[existingIndex],
                        quantity: nextCollection[existingIndex].quantity + card.quantity
                      };
                    } else {
                      nextCollection.push({
                        ...card,
                        id: `collection-${Date.now()}-${Math.random()}`
                      });
                    }
                  });
                  return nextCollection;
                });
              }
              setCurrentView('collection');
            }}
            onViewChange={(view) => setCurrentView(view)}
            pesoRate={activePesoRate}
            searchQuery={dashboardSearchQuery}
            onSearchChange={setDashboardSearchQuery}
            onAddCardToCollection={handleAddCardToCollection}
            onCardSelect={(card) => handleEditCardClick(card)}
            onZoomCard={setZoomedCard}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView 
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onViewChange={(view) => setCurrentView(view)}
            session={session}
            authLoading={authLoading}
          />
        )}
      </div>

      {/* Floating detail inspector modal */}
      {selectedCard && (
        <CardDetailModal 
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCard(null);
          }}
          onSave={handleSaveCardDetails}
          onDelete={handleDeleteCard}
          pesoRate={activePesoRate}
          onZoomCard={setZoomedCard}
        />
      )}

      {/* Full-screen Card Zoom Lightbox Modal */}
      {zoomedCard && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out select-none animate-fadeIn"
          onClick={() => setZoomedCard(null)}
        >
          {/* Close button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setZoomedCard(null);
            }}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full border border-white/10 flex items-center justify-center transition-all cursor-pointer hover:scale-110 z-50"
            title="Cerrar Lupa"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          
          {/* Card Image Container */}
          <div 
            className="relative flex flex-col items-center justify-center max-w-xs sm:max-w-md w-full aspect-[63/88] rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,184,255,0.55)] border border-primary/30 transform transition-all duration-300 scale-95 hover:scale-100 hover:shadow-[0_0_100px_rgba(0,184,255,0.7)]"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              className="w-full h-full object-cover cursor-zoom-out" 
              src={zoomedCard.imageUrl} 
              alt={zoomedCard.name}
              referrerPolicy="no-referrer"
              onClick={() => setZoomedCard(null)}
            />
            {zoomedCard.foil && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-teal-400 via-indigo-400 to-pink-500 text-[10px] text-white font-black px-2.5 py-1 rounded-md tracking-widest uppercase shadow-[0_0_15px_rgba(0,242,255,0.5)]">
                FOIL
              </div>
            )}
            <div className="absolute top-4 right-4 bg-black/75 px-2.5 py-1 rounded text-[10px] font-black text-primary border border-primary/30 uppercase tracking-widest">
              {zoomedCard.rarity}
            </div>
          </div>
          
          {/* Caption */}
          <div 
            className="mt-6 text-center text-white space-y-1 p-4 bg-[#0b1326]/80 border border-[#2d2d44]/50 rounded-xl backdrop-blur-md max-w-sm pointer-events-none"
          >
            <h3 className="font-sans font-black text-base text-primary tracking-tight">{zoomedCard.name}</h3>
            <p className="font-mono text-[10px] uppercase text-[#908fa0]">{zoomedCard.setName} {zoomedCard.collectorNumber ? `• #${zoomedCard.collectorNumber}` : ''}</p>
            <p className="font-mono text-xs text-secondary font-bold">${zoomedCard.price.toFixed(2)} USD</p>
          </div>
        </div>
      )}

    </div>
  );
}
