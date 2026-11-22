import { Coffee, Crown, Flame, Heart, Laptop, Leaf, Scale, Shirt, ShoppingBag, ShoppingBasket, Smartphone, Sprout, Tag, Trophy, Utensils, Zap } from 'lucide-react';

export const CARD_ICONS: Record<string, { label: string; Icon: any }> = {
  utensils: { label: 'Makanan', Icon: Utensils },
  coffee: { label: 'Minuman', Icon: Coffee },
  basket: { label: 'Belanjaan', Icon: ShoppingBasket },
  bag: { label: 'Tas belanja', Icon: ShoppingBag },
  shirt: { label: 'Fesyen', Icon: Shirt },
  smartphone: { label: 'Gadget', Icon: Smartphone },
  laptop: { label: 'Laptop', Icon: Laptop },
};
export const RESULT_ICONS: Record<string, { label: string; Icon: any }> = {
  sprout: { label: 'Tunas', Icon: Sprout }, scale: { label: 'Timbangan', Icon: Scale },
  tag: { label: 'Label', Icon: Tag }, heart: { label: 'Hati', Icon: Heart }, trophy: { label: 'Piala', Icon: Trophy },
  flame: { label: 'Api', Icon: Flame }, zap: { label: 'Petir', Icon: Zap }, crown: { label: 'Mahkota', Icon: Crown }, leaf: { label: 'Daun', Icon: Leaf },
};
