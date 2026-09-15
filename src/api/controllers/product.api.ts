import { APIRequestContext, TestInfo } from '@playwright/test';
import { BaseApiClient, ApiResponseWrapper } from '../base/base.api.client';
import {
  ProductCatalogResponse,
  PlanDetailsResponse,
  ProductPlan,
} from '@interfaces/api/product.api.interface';

/**
 * ProductApiClient
 *
 * Encapsulates endpoints for retrieving BlueChew product plans, treatments, pricing, and dosages.
 */
export class ProductApiClient extends BaseApiClient {
  constructor(requestContext: APIRequestContext, baseURL = '', testInfo?: TestInfo) {
    super(requestContext, baseURL, testInfo);
  }

  /**
   * Retrieves the full product catalog or filters by treatment.
   */
  async getProducts(treatment?: string): Promise<ApiResponseWrapper<ProductCatalogResponse>> {
    const params = treatment ? { treatment } : undefined;
    return this.get<ProductCatalogResponse>('/api/products', { params });
  }

  /**
   * Retrieves details for a specific plan ID or slug.
   */
  async getPlanDetails(planId: string | number): Promise<ApiResponseWrapper<PlanDetailsResponse>> {
    return this.get<PlanDetailsResponse>(`/api/plans/${planId}`);
  }

  /**
   * Retrieves plan pricing and promotional offers.
   */
  async getPlanPricing(planId: string | number, promoCode?: string): Promise<ApiResponseWrapper<{ price: number; discount?: number; total: number }>> {
    const params = promoCode ? { promoCode } : undefined;
    return this.get<{ price: number; discount?: number; total: number }>(`/api/plans/${planId}/pricing`, { params });
  }
}
