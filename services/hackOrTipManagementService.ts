import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/apiClient";

export enum HackOrTipType {
  PRO_TIP = "Pro Tip",
  MINI_HACK = "Mini Hack",
  SERVING_SUGGESTION = "Serving Suggestion",
}

export interface HackOrTip {
  _id: string;
  title: string;
  type: HackOrTipType;
  shortDescription: string;
  description: string; // HTML formatted
  sponsorHeading?: string;
  sponsorId?: string | any;
  order?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHackOrTipDto {
  title: string;
  type: HackOrTipType;
  shortDescription: string;
  description: string;
  sponsorHeading?: string;
  sponsorId?: string;
  order?: number;
  isActive?: boolean;
}

export interface UpdateHackOrTipDto {
  title?: string;
  type?: HackOrTipType;
  shortDescription?: string;
  description?: string;
  sponsorHeading?: string;
  sponsorId?: string;
  order?: number;
  isActive?: boolean;
}

class HackOrTipManagementService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  async getAll(type?: string, isActive?: boolean): Promise<HackOrTip[]> {
    try {
      const params = new URLSearchParams();
      if (type) params.append("type", type);
      if (isActive !== undefined) params.append("isActive", String(isActive));

      const queryString = params.toString();
      const url = `${this.API_BASE_URL}/api/hack-or-tip${queryString ? `?${queryString}` : ""}`;

      const response = await apiGet(url, "admin");

      if (!response.ok) {
        let errorMessage = "Failed to fetch hack or tips";
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorDetails = errorData;
        } catch (e) {
          const errorText = await response.text().catch(() => "");
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          details: errorDetails
        });
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      console.error("Get all hack or tips error:", error);
      throw error;
    }
  }

  async getById(id: string): Promise<HackOrTip> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/hack-or-tip/${id}`,
        "admin"
      );

      if (!response.ok) {
        let errorMessage = "Failed to fetch hack or tip";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          const errorText = await response.text().catch(() => "");
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      console.error("Get hack or tip by ID error:", error);
      throw error;
    }
  }

  async getByType(type: string): Promise<HackOrTip[]> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/hack-or-tip/type/${type}`,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to fetch hack or tips",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Get hack or tips by type error:", error);
      throw error;
    }
  }

  async create(data: CreateHackOrTipDto): Promise<{ message: string; result: HackOrTip }> {
    try {
      const response = await apiPost(
        `${this.API_BASE_URL}/api/hack-or-tip`,
        data,
        "admin"
      );

      if (!response.ok) {
        let errorMessage = "Failed to create hack or tip";
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorDetails = errorData;
        } catch (e) {
          const errorText = await response.text().catch(() => "");
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          details: errorDetails
        });
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      console.error("Create hack or tip error:", error);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateHackOrTipDto
  ): Promise<{ message: string; result: HackOrTip }> {
    try {
      const response = await apiPatch(
        `${this.API_BASE_URL}/api/hack-or-tip/${id}`,
        data,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to update hack or tip",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Update hack or tip error:", error);
      throw error;
    }
  }

  async toggleActive(
    id: string
  ): Promise<{ message: string; result: HackOrTip }> {
    try {
      const response = await apiPatch(
        `${this.API_BASE_URL}/api/hack-or-tip/${id}/toggle-active`,
        {},
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to toggle status",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Toggle active error:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<{ message: string }> {
    try {
      const response = await apiDelete(
        `${this.API_BASE_URL}/api/hack-or-tip/${id}`,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to delete hack or tip",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error("Delete hack or tip error:", error);
      throw error;
    }
  }
}

export const hackOrTipManagementService = new HackOrTipManagementService();
