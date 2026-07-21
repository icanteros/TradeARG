export interface Card {
  id: string;
  name: string;
  price: number;
  quantity: number;
  rarity: 'Mythic' | 'Rare' | 'Uncommon' | 'Common';
  imageUrl: string;
  setName: string;
  collectorNumber: string;
  foil: boolean;
  lang: string;
  notes?: string;
  usdPriceHistory?: { date: string; value: number }[];
  purchaseUris?: { cardkingdom?: string };
  normalPrice?: number;
  foilPrice?: number;
  isWishlist?: boolean;
  isTradeable?: boolean;
}

export interface TradeProposal {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  offeredCard: Card | null;
  requestedCard: Card | null;
  status: 'Pending' | 'Accepted' | 'Declined';
  notes?: string;
  createdAt: string;
}
