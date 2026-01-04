import { authService } from "@/services/authService";
import { apiGet } from "@/lib/apiClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://0.0.0.0:3000";

export interface Sponsor {
  _id: string;
  title: string;
  broughtToYouBy?: string;
  tagline?: string;
  logo: string;
  logoBlackAndWhite: string;
}

export interface CreateSponsorDto {
  title: string;
  broughtToYouBy?: string;
  tagline?: string;
  logo?: File;
  logoBlackAndWhite?: File;
}

export type UpdateSponsorDto = Partial<CreateSponsorDto>;

export const sponsorManagementService = {
  async createSponsor(data: CreateSponsorDto): Promise<Sponsor> {
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      
      if (data.broughtToYouBy) {
        formData.append("broughtToYouBy", data.broughtToYouBy);
      }
      
      if (data.tagline) {
        formData.append("tagline", data.tagline);
      }

      if (data.logo) {
        formData.append("logo", data.logo);
      }

      if (data.logoBlackAndWhite) {
        formData.append("logoBlackAndWhite", data.logoBlackAndWhite);
      }

      const token = authService.getStoredToken("admin");
      if (!token) {
        throw new Error("No authentication token available");
      }

      console.log("Creating sponsor with data:", {
        title: data.title,
        broughtToYouBy: data.broughtToYouBy,
        tagline: data.tagline,
        hasLogo: !!data.logo,
        hasLogoBlackAndWhite: !!data.logoBlackAndWhite,
      });

      const response = await fetch(`${API_BASE_URL}/api/sponsers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || "Failed to create sponsor" };
        }
        throw { response: { data: error, status: response.status } };
      }

      const result = await response.json();
      console.log("Sponsor created successfully:", result);
      return result;
    } catch (error: any) {
      console.error("createSponsor error:", error);
      throw error;
    }
  },

  async getAllSponsors(): Promise<Sponsor[]> {
    try {
      const response = await apiGet(`${API_BASE_URL}/api/sponsers`, "admin");

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching sponsors:", errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || "Failed to fetch sponsors" };
        }
        throw { response: { data: error, status: response.status } };
      }

      return response.json();
    } catch (error: any) {
      console.error("getAllSponsors error:", error);
      throw error;
    }
  },

  async updateSponsor(id: string, data: UpdateSponsorDto): Promise<Sponsor> {
    try {
      const formData = new FormData();
      if (data.title !== undefined) formData.append("title", data.title);
      if (data.broughtToYouBy !== undefined) formData.append("broughtToYouBy", data.broughtToYouBy);
      if (data.tagline !== undefined) formData.append("tagline", data.tagline);
      if (data.logo) formData.append("logo", data.logo);
      if (data.logoBlackAndWhite) formData.append("logoBlackAndWhite", data.logoBlackAndWhite);

      const token = authService.getStoredToken("admin");
      if (!token) throw new Error("No authentication token available");

      const response = await fetch(`${API_BASE_URL}/api/sponsers/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try { error = JSON.parse(errorText); } catch { error = { message: errorText || "Failed to update sponsor" }; }
        throw { response: { data: error, status: response.status } };
      }

      return response.json();
    } catch (error) {
      console.error("updateSponsor error:", error);
      throw error;
    }
  },

  async deleteSponsor(id: string): Promise<{ success: boolean }>{
    try {
      const token = authService.getStoredToken("admin");
      if (!token) throw new Error("No authentication token available");

      const response = await fetch(`${API_BASE_URL}/api/sponsers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try { error = JSON.parse(errorText); } catch { error = { message: errorText || "Failed to delete sponsor" }; }
        throw { response: { data: error, status: response.status } };
      }

      return response.json();
    } catch (error) {
      console.error("deleteSponsor error:", error);
      throw error;
    }
  },
};
