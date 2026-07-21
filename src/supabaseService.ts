import { supabase } from './supabaseClient';
import { Card, TradeProposal } from './types';

// Helper to check if a string is a valid UUID
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(str);
};

// Map DB row to Card interface
const mapRowToCard = (row: any): Card => {
  return {
    id: row.id, // This will be the database UUID
    name: row.card_name,
    price: parseFloat(row.price_usd || '1.00'),
    quantity: row.quantity,
    rarity: row.rarity as 'Mythic' | 'Rare' | 'Uncommon' | 'Common',
    imageUrl: row.image_url,
    setName: row.set_name || '',
    collectorNumber: row.collector_number || '',
    foil: row.is_foil,
    lang: row.language || 'EN',
    notes: row.notes || '',
    isWishlist: row.is_wishlist,
    isTradeable: row.is_tradeable !== false, // default to true if null/undefined
    usdPriceHistory: [
      { date: '10 Jun', value: parseFloat(row.price_usd || '1.00') * 0.95 },
      { date: '15 Jun', value: parseFloat(row.price_usd || '1.00') * 0.97 },
      { date: '20 Jun', value: parseFloat(row.price_usd || '1.00') * 0.99 },
      { date: '25 Jun', value: parseFloat(row.price_usd || '1.00') * 1.01 },
      { date: '30 Jun', value: parseFloat(row.price_usd || '1.00') }
    ]
  };
};

// Map Card interface to DB columns
const mapCardToRow = (card: Card, profileId: string) => {
  // Use a temporary scryfall-id if it's a custom card
  const scryfallId = card.id && card.id.startsWith('scryfall-') ? card.id.replace('scryfall-', '') : 'custom';

  return {
    profile_id: profileId,
    scryfall_id: scryfallId,
    card_name: card.name,
    price_usd: card.price,
    quantity: card.quantity,
    rarity: card.rarity,
    image_url: card.imageUrl,
    set_name: card.setName,
    collector_number: card.collectorNumber,
    is_foil: card.foil,
    language: card.lang,
    notes: card.notes || '',
    condition: 'NM', // default value
    is_wishlist: card.isWishlist ?? false,
    is_tradeable: card.isTradeable ?? true
  };
};

/**
 * Fetch the current authenticated user's profile
 */
export async function fetchUserProfile(profileId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) throw error;
    return {
      username: data.username,
      location: data.location || 'Argentina',
      stores: data.favorite_stores || 'Local General',
      avatar: data.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbdoIxp_Cnk7hU5w0DX4ZH_TSG_MByPvwQyeIP58d1q89JJOw8ze26_JmPuIdS3ImrcV1bDUfNg01DYsW5biuiu-2y37bxw6w5ULCET2XIgG23uctjIEa-v-_A1u5CDQP5tGJaREtDq4BmfaYANOMTojgGR-bywm3I3DB4DKEsP9o8SfAXElwDlQqtGy8dAr6lmJk8rMwLBkWdapJY8-KYbTB47OUvTArd-1wwARK7eyiGltZw7Zpei7D9kH4sJN6W8xc7cDJQPE0',
      rating: parseFloat(data.rating || '5.0')
    };
  } catch (e) {
    console.error('Error fetching user profile:', e);
    return null;
  }
}

/**
 * Update the user's profile metadata
 */
export async function updateUserProfile(profileId: string, profile: { username: string; location: string; stores: string; avatar: string }) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        username: profile.username,
        location: profile.location,
        favorite_stores: profile.stores,
        avatar_url: profile.avatar
      })
      .eq('id', profileId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error updating user profile:', e);
    return false;
  }
}

/**
 * Fetch all cards in the user's collection
 */
export async function fetchUserCollection(profileId: string): Promise<Card[]> {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapRowToCard);
  } catch (e) {
    console.error('Error loading collections from Supabase:', e);
    return [];
  }
}

/**
 * Save or update a card in the collection
 */
export async function saveCollectionItem(profileId: string, card: Card): Promise<Card | null> {
  try {
    const row = mapCardToRow(card, profileId);

    if (isUUID(card.id)) {
      // It exists in DB, update it
      const { data, error } = await supabase
        .from('collections')
        .update(row)
        .eq('id', card.id)
        .select()
        .single();

      if (error) throw error;
      return mapRowToCard(data);
    } else {
      // It is a new card, insert it
      const { data, error } = await supabase
        .from('collections')
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      return mapRowToCard(data);
    }
  } catch (e) {
    console.error('Error saving collections item:', e);
    return null;
  }
}

/**
 * Delete a card from the collection
 */
export async function deleteCollectionItem(cardId: string): Promise<boolean> {
  try {
    if (!isUUID(cardId)) {
      // If it's a local/temporary card not yet in the DB, return success
      return true;
    }
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', cardId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error deleting collection item:', e);
    return false;
  }
}

/**
 * Fetch community listings (all public collection items from other users)
 */
export async function fetchCommunityListings() {
  try {
    // Fetch collections joining with the owner's profile metadata
    // Only fetch items that are NOT on the wishlist and ARE tradeable
    const { data, error } = await supabase
      .from('collections')
      .select(`
        id,
        card_name,
        price_usd,
        quantity,
        is_foil,
        language,
        notes,
        image_url,
        set_name,
        profiles (
          id,
          username,
          location,
          rating
        )
      `)
      .eq('is_tradeable', true)
      .eq('is_wishlist', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => {
      const profile = row.profiles || { username: 'Invitado', location: 'Argentina', rating: 5.0 };
      return {
        id: row.id,
        username: profile.username || 'Usuario',
        rating: parseFloat(profile.rating || '5.0'),
        location: profile.location || 'Argentina',
        cardName: row.card_name,
        quantity: row.quantity,
        condition: 'NM', // default simulator condition
        foil: row.is_foil,
        language: row.language || 'EN',
        priceUsd: parseFloat(row.price_usd || '1.00'),
        notes: row.notes || '',
        imageUrl: row.image_url,
        setName: row.set_name || 'Desconocido',
        ownerId: profile.id
      };
    });
  } catch (e) {
    console.error('Error fetching community listings:', e);
    return [];
  }
}

/**
 * Fetch all trade proposals involving the user (sent or received)
 */
export async function fetchTrades(profileId: string): Promise<TradeProposal[]> {
  try {
    const { data, error } = await supabase
      .from('trades')
      .select(`
        id,
        status,
        notes,
        created_at,
        sender_id,
        receiver_id,
        offered_card:collections!offered_card_id(*),
        requested_card:collections!requested_card_id(*),
        sender:profiles!sender_id(username),
        receiver:profiles!receiver_id(username)
      `)
      .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => {
      const senderProfile = row.sender || { username: 'Usuario' };
      const receiverProfile = row.receiver || { username: 'Usuario' };
      return {
        id: row.id,
        senderId: row.sender_id,
        senderName: senderProfile.username,
        receiverId: row.receiver_id,
        receiverName: receiverProfile.username,
        offeredCard: row.offered_card ? mapRowToCard(row.offered_card) : null,
        requestedCard: row.requested_card ? mapRowToCard(row.requested_card) : null,
        status: row.status as 'Pending' | 'Accepted' | 'Declined',
        notes: row.notes || '',
        createdAt: row.created_at
      };
    });
  } catch (e) {
    console.error('Error fetching trades:', e);
    return [];
  }
}

/**
 * Propose a new trade
 */
export async function createTradeProposal(proposal: {
  senderId: string;
  receiverId: string;
  offeredCardId: string | null;
  requestedCardId: string | null;
  notes?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('trades')
      .insert({
        sender_id: proposal.senderId,
        receiver_id: proposal.receiverId,
        offered_card_id: proposal.offeredCardId,
        requested_card_id: proposal.requestedCardId,
        status: 'Pending',
        notes: proposal.notes || ''
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Error creating trade proposal:', e);
    return null;
  }
}

/**
 * Update the status of a trade proposal (Accept/Decline)
 */
export async function updateTradeStatus(tradeId: string, status: 'Pending' | 'Accepted' | 'Declined') {
  try {
    const { error } = await supabase
      .from('trades')
      .update({ status })
      .eq('id', tradeId);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Error updating trade status:', e);
    return false;
  }
}

/**
 * Intelligent Trade Auto-Matcher calculations querying real users collections from database
 */
export async function fetchAutoMatchesReal(profileId: string) {
  try {
    // 1. Fetch current user's inventory and wishlist
    const myItems = await fetchUserCollection(profileId);
    const myInventory = myItems.filter(c => !c.isWishlist && c.isTradeable);
    const myWishlist = myItems.filter(c => c.isWishlist);

    if (myInventory.length === 0 && myWishlist.length === 0) {
      return [];
    }

    // Get current user profile for location reference
    const myProfile = await fetchUserProfile(profileId);
    const myLocation = myProfile?.location || 'Argentina';

    // 2. Fetch all other collections where tradeable = true
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        profiles (
          id,
          username,
          location,
          rating
        )
      `)
      .neq('profile_id', profileId)
      .eq('is_tradeable', true);

    if (error) throw error;

    const otherItems = data || [];
    const matches: any[] = [];

    // Group other items by profile_id to find matches with specific users
    const usersMap = new Map<string, any[]>();
    otherItems.forEach((row: any) => {
      const pId = row.profile_id;
      if (!usersMap.has(pId)) {
        usersMap.set(pId, []);
      }
      usersMap.get(pId)!.push(row);
    });

    usersMap.forEach((items, pId) => {
      const partnerItems = items.map(mapRowToCard);
      const partnerInventory = partnerItems.filter(c => !c.isWishlist && c.isTradeable);
      const partnerWishlist = partnerItems.filter(c => c.isWishlist);
      const profile = items[0].profiles || { username: 'Usuario', location: 'Argentina', rating: 5.0 };

      let foundMatch = false;

      // Case A: Partner has a card from my Wishlist, and I have a card from partner's Wishlist (Double Match)
      myWishlist.forEach(myWant => {
        const partnerHas = partnerInventory.find(pHave => pHave.name.toLowerCase() === myWant.name.toLowerCase());
        if (partnerHas) {
          const partnerWants = partnerWishlist.find(pWant => myInventory.some(myHave => myHave.name.toLowerCase() === pWant.name.toLowerCase()));
          if (partnerWants) {
            const myOffered = myInventory.find(myHave => myHave.name.toLowerCase() === partnerWants.name.toLowerCase())!;
            matches.push({
              id: `automatch-wish-${myWant.id}-${partnerHas.id}`,
              partnerId: pId,
              partnerName: profile.username,
              partnerRating: parseFloat(profile.rating || '5.0'),
              partnerLocation: profile.location || 'Argentina',
              userCard: myOffered,
              partnerCard: partnerHas,
              priceDeltaUSD: partnerHas.price - myOffered.price,
              notes: `¡Coincidencia Doble! Buscás su "${partnerHas.name}" y el usuario busca tu "${myOffered.name}".`
            });
            foundMatch = true;
          }
        }
      });

      // Case B: Partner has a card from my Wishlist (Single Match - user can offer something similar in value)
      if (!foundMatch) {
        myWishlist.forEach(myWant => {
          const partnerHas = partnerInventory.find(pHave => pHave.name.toLowerCase() === myWant.name.toLowerCase());
          if (partnerHas) {
            // Find a card from my inventory closest in value to their card
            const myOffer = myInventory.slice().sort((a, b) => 
              Math.abs(a.price - partnerHas.price) - Math.abs(b.price - partnerHas.price)
            )[0];
            
            if (myOffer) {
              matches.push({
                id: `automatch-wish-single-${myWant.id}-${partnerHas.id}`,
                partnerId: pId,
                partnerName: profile.username,
                partnerRating: parseFloat(profile.rating || '5.0'),
                partnerLocation: profile.location || 'Argentina',
                userCard: myOffer,
                partnerCard: partnerHas,
                priceDeltaUSD: partnerHas.price - myOffer.price,
                notes: `¡Buscás esta carta! Tiene tu "${partnerHas.name}" en su binder.`
              });
              foundMatch = true;
            }
          }
        });
      }

      // Case C: Value-based match in same location (same city/LGS)
      if (!foundMatch && profile.location === myLocation) {
        myInventory.slice(0, 3).forEach(myHave => {
          const partnerOffer = partnerInventory.find(pHave => Math.abs(pHave.price - myHave.price) / myHave.price < 0.25);
          if (partnerOffer) {
            matches.push({
              id: `automatch-val-${myHave.id}-${partnerOffer.id}`,
              partnerId: pId,
              partnerName: profile.username,
              partnerRating: parseFloat(profile.rating || '5.0'),
              partnerLocation: profile.location || 'Argentina',
              userCard: myHave,
              partnerCard: partnerOffer,
              priceDeltaUSD: partnerOffer.price - myHave.price,
              notes: `Canje local por valor similar ($${myHave.price.toFixed(2)} USD vs $${partnerOffer.price.toFixed(2)} USD).`
            });
          }
        });
      }
    });

    return matches.slice(0, 10);
  } catch (e) {
    console.error('Error calculating real auto-matches:', e);
    return [];
  }
}
