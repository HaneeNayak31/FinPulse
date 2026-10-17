export interface User {
  id: number;
  username?: string;
  email: string;
  created_at?: string;
  iat?: number;
  exp?: number;
}

export interface Portfolio {
  id: number;
  name: string;
  user_id?: number;
  created_at: string;
}

export interface HoldingRaw {
  id: number | string;
  portfolio_id: number | string;
  asset_id: number | string;
  symbol: string;
  name: string;
  quantity: string | number;
  average_price: string | number;
  current_price: string | number;
}

export interface Holding {
  id: number;
  portfolio_id: number;
  asset_id: number;
  symbol: string;
  name: string;
  quantity: number;
  average_price: number;
  current_price: number;
  market_value: number;
  cost_basis: number;
  unrealized_pl: number;
  unrealized_pl_percent: number;
}

export type OrderType = 'BUY' | 'SELL';

export interface OrderRaw {
  id: number | string;
  portfolio_id: number | string;
  asset_id: number | string;
  type: OrderType;
  quantity: string | number;
  price: string | number;
  created_at: string;
}

export interface Order {
  id: number;
  portfolio_id: number;
  asset_id: number;
  type: OrderType;
  quantity: number;
  price: number;
  created_at: string;
}

export interface AssetRaw {
  id: number | string;
  symbol: string;
  name: string;
  current_price: string | number;
  created_at?: string;
}

export interface Asset {
  id: number;
  symbol: string;
  name: string;
  current_price: number;
  created_at?: string;
}

export interface PriceUpdatedEvent {
  event: 'PRICE_UPDATED';
  symbol: string;
  price: string | number;
  timestamp: string;
}

export type ConnectionState = 'Connected' | 'Connecting' | 'Reconnecting' | 'Disconnected';

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
}
