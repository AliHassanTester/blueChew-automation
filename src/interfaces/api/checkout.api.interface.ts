export interface CalculateShippingApiRequest {
  zip: string;
  state: string;
  planId: string | number;
}

export interface ShippingMethodOption {
  id: string | number;
  name: string;
  price: number;
  estimatedDelivery?: string;
}

export interface CalculateShippingApiResponse {
  shippingMethods: ShippingMethodOption[];
  tax: number;
  subtotal: number;
  total: number;
}

export interface PlaceOrderApiRequest {
  planId: string | number;
  shippingAddressId?: string | number;
  paymentMethodId?: string;
}

export interface PlaceOrderApiResponse {
  orderId: string | number;
  status: 'pending' | 'processing' | 'approved' | 'completed';
  total: number;
}
