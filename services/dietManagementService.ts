import { apiGet } from "@/lib/apiClient";

export interface DietCategory {
  _id: string;
  id?: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

class DietManagementService {
  private readonly baseURL = process.env.NEXT_PUBLIC_API_URL;

  async getAllDiets(): Promise<DietCategory[]> {
    console.log('Fetching diets from:', `${this.baseURL}/api/diet`);
    const response = await fetch(`${this.baseURL}/api/diet`, {
      cache: 'no-store',
    });
    
    console.log('Diet API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Diet API error:', errorText);
      throw new Error('Failed to fetch diets');
    }
    
    const data = await response.json();
    console.log('Diet API returned:', data);
    return data;
  }
}

export const dietManagementService = new DietManagementService();
