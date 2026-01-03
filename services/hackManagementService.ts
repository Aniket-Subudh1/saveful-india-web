import { apiGet, apiPost, apiPatch, apiDelete, apiClient } from "@/lib/apiClient";
import { authService } from "@/services/authService";


export enum ArticleBlockType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  LIST = "list",
  ACCORDION = "accordion",
  IMAGE_DETAILS = "image_details",
  HACK_OR_TIP = "hack_or_tip",
}

export interface BaseBlock {
  type: ArticleBlockType;
  id: string;
  order?: number;
}

export interface TextBlock extends BaseBlock {
  type: ArticleBlockType.TEXT;
  text: string;
}

export interface ImageBlock extends BaseBlock {
  type: ArticleBlockType.IMAGE;
  imageUrl: string;
  caption?: string;
}

export interface VideoBlock extends BaseBlock {
  type: ArticleBlockType.VIDEO;
  videoUrl: string;
  videoCaption?: string;
  videoCredit?: string;
  thumbnailUrl?: string;
}

export interface ListItem {
  id: string;
  listText: string;
}

export interface ListBlock extends BaseBlock {
  type: ArticleBlockType.LIST;
  listTitle: string;
  listItems: ListItem[];
}

export interface AccordionItem {
  id: string;
  accordionTitle: string;
  accordionText: string;
  accordionFramework?: string[];
}

export interface AccordionBlock extends BaseBlock {
  type: ArticleBlockType.ACCORDION;
  accordion: AccordionItem[];
}

export interface ImageDetailsBlock extends BaseBlock {
  type: ArticleBlockType.IMAGE_DETAILS;
  blockImageUrl: string;
  blockTitle: string;
  blockDescription: string;
}

export interface HackOrTipBlock extends BaseBlock {
  type: ArticleBlockType.HACK_OR_TIP;
  hackOrTipIds: string[];
}

export type ArticleBlock =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | ListBlock
  | AccordionBlock
  | ImageDetailsBlock
  | HackOrTipBlock;

export interface HackCategory {
  _id: string;
  name: string;
  heroImageUrl: string;
  iconImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Hack {
  _id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  thumbnailImageUrl?: string;
  heroImageUrl?: string;
  iconImageUrl?: string;
  leadText?: string;
  sponsorId?: string;
  categoryId: string;
  articleBlocks: ArticleBlock[];
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHackCategoryDto {
  name: string;
}

export interface CreateHackDto {
  title: string;
  shortDescription?: string;
  description?: string;
  leadText?: string;
  categoryId: string;
  sponsorId?: string;
  articleBlocks: ArticleBlock[];
}

export interface UpdateHackDto {
  title?: string;
  shortDescription?: string;
  description?: string;
  leadText?: string;
  categoryId?: string;
  sponsorId?: string;
  articleBlocks?: ArticleBlock[];
}


class HackManagementService {
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;


  async getAllCategories(): Promise<HackCategory[]> {
    try {
      const response = await apiGet(
        `${this.API_BASE_URL}/api/hack/category`,
        "admin"
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Failed to fetch categories",
        }));
        throw { response: { data: error } };
      }

      return response.json();
    } catch (error: any) {
      console.error('Category fetch error:', error);
      throw error;
    }
  }

  async createCategory(
    data: CreateHackCategoryDto,
    heroImage: File,
    iconImage: File
  ): Promise<{ message: string; result: HackCategory }> {
    try {
      console.log('Creating category:', data.name);
      console.log('API URL:', `${this.API_BASE_URL}/api/hack/category`);
      
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("heroImage", heroImage);
      formData.append("iconImage", iconImage);

      console.log('FormData prepared, making request...');
      console.log("=== FormData Contents ===");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? `[File: ${value.name}]` : value}`);
      }

      const token = authService.getStoredToken("admin");
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(`${this.API_BASE_URL}/api/hack/category`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      console.log('Response status:', response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || "Failed to create category" };
        }
        throw { response: { data: error } };
      }

      const result = await response.json();
      console.log('Category created successfully:', result);
      return result;
    } catch (error: any) {
      console.error('createCategory error:', {
        message: error?.message,
        response: error?.response,
        stack: error?.stack,
      });
      throw error;
    }
  }

  async getHacksByCategory(categoryId: string): Promise<{
    response: {
      category: HackCategory;
      hacks: Hack[];
    };
  }> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/hack/category/${categoryId}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to fetch hacks",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async deleteCategory(categoryId: string): Promise<{ message: string }> {
    const response = await apiDelete(
      `${this.API_BASE_URL}/api/hack/category/${categoryId}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to delete category",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }


  async createHack(
    data: CreateHackDto,
    files?: {
      thumbnailImage?: File;
      heroImage?: File;
      iconImage?: File;
    }
  ): Promise<{ message: string; hackId: string }> {
    const formData = new FormData();

    formData.append("title", data.title);
    formData.append("categoryId", data.categoryId);

    if (data.shortDescription) {
      formData.append("shortDescription", data.shortDescription);
    }
    if (data.description) {
      formData.append("description", data.description);
    }
    if (data.leadText) {
      formData.append("leadText", data.leadText);
    }
    if (data.sponsorId) {
      formData.append("sponsorId", data.sponsorId);
    }

    formData.append("articleBlocks", JSON.stringify(data.articleBlocks));

    if (files?.thumbnailImage) {
      formData.append("thumbnailImage", files.thumbnailImage);
    }
    if (files?.heroImage) {
      formData.append("heroImage", files.heroImage);
    }
    if (files?.iconImage) {
      formData.append("iconImage", files.iconImage);
    }

    const response = await apiClient(
      `${this.API_BASE_URL}/api/hack`,
      {
        method: "POST",
        role: "admin",
        body: formData
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to create hack",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async getHackById(hackId: string): Promise<Hack> {
    const response = await apiGet(
      `${this.API_BASE_URL}/api/hack/${hackId}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to fetch hack",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async updateHack(
    hackId: string,
    data: UpdateHackDto,
    files?: {
      thumbnailImage?: File;
      heroImage?: File;
      iconImage?: File;
    }
  ): Promise<{ message: string; hack: Hack }> {
    const formData = new FormData();

    if (data.title) {
      formData.append("title", data.title);
    }
    if (data.shortDescription !== undefined) {
      formData.append("shortDescription", data.shortDescription);
    }
    if (data.description !== undefined) {
      formData.append("description", data.description);
    }
    if (data.leadText !== undefined) {
      formData.append("leadText", data.leadText);
    }
    if (data.categoryId) {
      formData.append("categoryId", data.categoryId);
    }
    if (data.sponsorId !== undefined) {
      formData.append("sponsorId", data.sponsorId);
    }
    if (data.articleBlocks) {
      formData.append("articleBlocks", JSON.stringify(data.articleBlocks));
    }

    if (files?.thumbnailImage) {
      formData.append("thumbnailImage", files.thumbnailImage);
    }
    if (files?.heroImage) {
      formData.append("heroImage", files.heroImage);
    }
    if (files?.iconImage) {
      formData.append("iconImage", files.iconImage);
    }

    const response = await apiClient(`${this.API_BASE_URL}/api/hack/${hackId}`, {
      method: "PUT",
      role: "admin",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to update hack",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }

  async deleteHack(hackId: string): Promise<{ message: string }> {
    const response = await apiDelete(
      `${this.API_BASE_URL}/api/hack/${hackId}`,
      "admin"
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Failed to delete hack",
      }));
      throw { response: { data: error } };
    }

    return response.json();
  }
}

export const hackManagementService = new HackManagementService();
