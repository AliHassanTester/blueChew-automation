export interface ProductPlan {
  id: string | number;
  name: string;
  treatment: 'Sildenafil' | 'Tadalafil' | 'Vardenafil' | 'DailyTad' | 'Max' | 'VMax' | 'Gold';
  dosage: string;
  quantity: number;
  price: number;
  description?: string;
  isPopular?: boolean;
}

export interface ProductCatalogResponse {
  products: ProductPlan[];
  treatments?: string[];
  total?: number;
}

export interface PlanDetailsResponse {
  plan: ProductPlan;
  availableQuantities?: number[];
  availableStrengths?: string[];
}
