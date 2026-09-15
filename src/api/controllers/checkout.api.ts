import { APIRequestContext, TestInfo } from '@playwright/test';
import { BaseApiClient, ApiResponseWrapper } from '../base/base.api.client';
import {
  CalculateShippingApiRequest,
  CalculateShippingApiResponse,
  PlaceOrderApiRequest,
  PlaceOrderApiResponse,
} from '@interfaces/api/checkout.api.interface';

/**
 * CheckoutApiClient
 *
 * Encapsulates endpoints for shipping calculations, cart adjustments,
 * and order placement.
 */
export class CheckoutApiClient extends BaseApiClient {
  constructor(requestContext: APIRequestContext, baseURL = '', testInfo?: TestInfo) {
    super(requestContext, baseURL, testInfo);
  }

  /**
   * Calculates applicable shipping methods, taxes, and order totals.
   */
  async calculateShipping(payload: CalculateShippingApiRequest): Promise<ApiResponseWrapper<CalculateShippingApiResponse>> {
    return this.post<CalculateShippingApiResponse>('/api/checkout/shipping-rates', payload);
  }

  /**
   * Places an order for the selected plan and shipping details.
   */
  async placeOrder(payload: PlaceOrderApiRequest): Promise<ApiResponseWrapper<PlaceOrderApiResponse>> {
    return this.post<PlaceOrderApiResponse>('/api/checkout/order', payload);
  }

  /**
   * Retrieves order receipt / invoice details by order ID.
   */
  async getOrderDetails(orderId: string | number): Promise<ApiResponseWrapper<{ orderId: string | number; status: string; total: number }>> {
    return this.get<{ orderId: string | number; status: string; total: number }>(`/api/orders/${orderId}`);
  }
}
