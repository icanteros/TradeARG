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
}

export interface TradeItem {
  card: Card;
  quantity: number;
}

export interface TradeProposal {
  id: string;
  userGive: TradeItem[];
  userReceive: TradeItem[];
  status: 'Pending' | 'Accepted' | 'Declined';
  partnerName: string;
  date: string;
}
