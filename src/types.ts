export type UserRole = 'user' | 'business' | 'moderator' | 'admin';

export interface User {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  avatar?: string;
  role: UserRole;
  region_id?: number;
  is_verified: boolean;
  is_blocked: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  parent_id: number | null;
}

export interface Ad {
  id: number;
  user_id: number;
  category_id: number;
  category_name?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: 'new' | 'used';
  region_id?: number;
  district_id?: number;
  location: string;
  lat?: number;
  lng?: number;
  status: 'pending' | 'active' | 'rejected' | 'sold';
  is_premium: boolean;
  is_vip: boolean;
  views_count: number;
  main_image: string;
  video_url?: string;
  telegram?: string;
  has_delivery: boolean;
  created_at: string;
  seller_name?: string;
  seller_phone?: string;
  seller_avatar?: string;
  seller_role?: UserRole;
  images?: { image_url: string }[];
  auction?: Auction;
}

export interface Auction {
  id: number;
  ad_id: number;
  start_price: number;
  end_time: string;
  status: 'active' | 'finished';
  highest_bid?: number;
  bids?: Bid[];
}

export interface Bid {
  id: number;
  auction_id: number;
  user_id: number;
  user_name: string;
  amount: number;
  created_at: string;
}

export interface Banner {
  id: number;
  image_url: string;
  link_url: string;
  position: 'home_top' | 'sidebar';
}

export interface Chat {
  id: number;
  ad_id: number;
  buyer_id: number;
  seller_id: number;
  last_message: string;
  last_message_time: string;
  ad_title?: string;
  other_user_name?: string;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  message: string;
  file_url?: string;
  created_at: string;
}

export interface Shop {
  id: number;
  user_id: number;
  shop_name: string;
  logo?: string;
  description?: string;
  tariff_id?: number;
  subscription_status: string;
  expires_at?: string;
}

export interface Tariff {
  id: number;
  name: string;
  price: number;
  duration_day: number;
  features: string;
}
