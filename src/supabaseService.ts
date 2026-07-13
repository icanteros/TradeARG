import { supabase } from './supabaseClient';
import { Card } from './types';

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
  const scryfallId = card.id.startsWith('scryfall-') ? card.id.replace('scryfall-', '') : 'custom';

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
    condition: 'NM' // default value
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
