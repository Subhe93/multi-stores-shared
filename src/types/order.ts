import { OrderStatus, FulfillmentStatus, FulfillerType } from '../constants/order-status';

export interface IOrder {
  id: string;
  order_number: string;
  customer_id: string;
  store_id?: string;
  address_id: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  currency: string;
  notes?: string;
  created_at: Date;
}

export interface IOrderItem {
  id: string;
  order_id: string;
  custom_product_id?: string;
  product_id?: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customer_design_url?: string;
  design_notes?: string;
  fulfiller_type: FulfillerType;
  fulfiller_id: string;
  fulfillment_status: FulfillmentStatus;
  tracking_number?: string;
  tracking_url?: string;
}

export interface IOrderCommission {
  id: string;
  order_id: string;
  provider_amount: number;
  platform_amount: number;
  creator_amount: number;
  currency: string;
}
