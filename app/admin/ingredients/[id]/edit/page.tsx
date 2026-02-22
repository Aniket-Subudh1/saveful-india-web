"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import {
  ingredientManagementService,
  Ingredient,
  IngredientCategory,
  IngredientTheme,
  Month,
  UpdateIngredientDto,
} from "@/services/ingredientManagementService";
import { dietManagementService, DietCategory } from "@/services/dietManagementService";
import { sponsorManagementService, Sponsor } from "@/services/sponsorManagementService";
import { hackOrTipManagementService, HackOrTip } from "@/services/hackOrTipManagementService";
import { stickerManagementService, Sticker } from "@/services/stickerManagementService";
import { COUNTRIES } from "@/lib/countries";

const MONTHS = Object.values(Month);
const THEMES = Object.values(IngredientTheme);

export default function EditIngredientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");

  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [diets, setDiets] = useState<DietCategory[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [hacks, setHacks] = useState<HackOrTip[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ingredient, setIngredient] = useState<Ingredient | null>(null);

  const [form, setForm] = useState<UpdateIngredientDto>({});
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [parentOptions, setParentOptions] = useState<Ingredient[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoadingData(true);
        const [ingRes, categoriesRes, allIngredientsRes, dietsRes, sponsorsRes, hacksRes, stickersRes] = await Promise.allSettled([
          ingredientManagementService.getIngredientById(id),
          ingredientManagementService.getAllCategories(),
          ingredientManagementService.getAllIngredients(),
          dietManagementService.getAllDiets(),
          sponsorManagementService.getAllSponsors(),
          hackOrTipManagementService.getAll(),
          stickerManagementService.getAll(),
        ]);
        if (ingRes.status === "fulfilled") {
          const ing = ingRes.value;
          console.log('Loaded ingredient:', ing);
          setIngredient(ing);
          const categoryId = typeof ing.categoryId === "object" ? ing.categoryId._id : ing.categoryId;
          const suitableDiets = ing.suitableDiets.map((d) => (typeof d === "object" ? d._id : d));
          console.log('Parsed categoryId:', categoryId);
          console.log('Parsed suitableDiets:', suitableDiets);
          const parentIngredients = (ing.parentIngredients || [])
            .map((p) => (typeof p === "object" ? p._id : p))
            .filter((x): x is string => !!x);
          const relatedHacks = (ing.relatedHacks || []).map((h) => (typeof h === "object" ? h._id : h));
          const formData = {
            name: ing.name,
            averageWeight: ing.averageWeight,
            categoryId,
            suitableDiets,
            hasPage: ing.hasPage,
            theme: ing.theme,
            parentIngredients,
            description: ing.description,
            sponsorId: typeof ing.sponsorId === "object" ? ing.sponsorId?._id : ing.sponsorId,
            relatedHacks,
            inSeason: ing.inSeason || [],
            stickerId: typeof ing.stickerId === "object" ? ing.stickerId?._id : ing.stickerId,
            isPantryItem: ing.isPantryItem,
            nutrition: ing.nutrition,
            order: ing.order,
            countries: ing.countries || [],
          };
          console.log('Setting form data:', formData);
          console.log('Hero Image URL from backend:', ing.heroImageUrl);
          setForm(formData);
          if (ing.heroImageUrl) {
            console.log('Setting hero image preview to:', ing.heroImageUrl);
            setHeroImagePreview(ing.heroImageUrl);
          } else {
            console.log('No hero image URL found in ingredient data');
          }
        }
        const cats = categoriesRes.status === "fulfilled" ? categoriesRes.value : [];
        const dietsData = dietsRes.status === "fulfilled" ? dietsRes.value : [];
        console.log('Loaded categories:', cats);
        console.log('Loaded diets:', dietsData);
        setCategories(cats);
        setDiets(dietsData);
        setSponsors(sponsorsRes.status === "fulfilled" ? sponsorsRes.value : []);
        setHacks(hacksRes.status === "fulfilled" ? hacksRes.value : []);
        setStickers(stickersRes.status === "fulfilled" ? stickersRes.value : []);
        // Load parent options and exclude current ingredient
        if (allIngredientsRes.status === "fulfilled") {
          const all = allIngredientsRes.value as Ingredient[];
          setParentOptions(all.filter((x) => x._id !== id));
        }
      } finally {
        setLoadingData(false);
      }
    })();
  }, [id]);

  // Debug: Log form state changes
  useEffect(() => {
    console.log('Form state updated:', form);
    console.log('Categories available:', categories.length);
    console.log('Diets available:', diets.length);
  }, [form, categories, diets]);

  // Debug: Log heroImagePreview changes
  useEffect(() => {
    console.log('Hero image preview state:', heroImagePreview);
  }, [heroImagePreview]);

  const handleImageChange = (file?: File | null) => {
    if (!file) {
      setHeroImageFile(null);
      // Don't clear preview - keep existing image if no new file selected
      return;
    }
    
    // Validate image size (max 5MB to prevent timeout)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      alert(`Image file is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Please select an image smaller than 5MB to avoid timeout issues.`);
      return;
    }
    
    setHeroImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setHeroImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !id) return;
    setIsSubmitting(true);
    try {
      if (!form.name?.trim()) throw new Error("Name is required");
      if (!form.categoryId) throw new Error("Category is required");
      if (form.averageWeight === undefined || Number(form.averageWeight) <= 0) throw new Error("Average weight must be greater than 0");
      if (form.hasPage) {
        if (!form.theme) throw new Error("Theme is required when Has Page is enabled");
        if (!form.inSeason || form.inSeason.length === 0) throw new Error("Select at least one month");
      }
      const files = heroImageFile ? { heroImage: heroImageFile } : undefined;
      await ingredientManagementService.updateIngredient(id, form, files);
      alert("Ingredient updated successfully!");
      router.push("/admin/ingredients");
    } catch (err: any) {
      alert(err?.message || "Failed to update ingredient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sidebarConfig = {
    role: "admin" as const,
    userName: user?.name || "Admin",
    userEmail: user?.email || "",
    links: getAdminSidebarLinks(() => router.push("/admin/login")),
  };

  if (isLoading || (loadingData && !ingredient)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg font-saveful text-saveful-green">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout config={sidebarConfig}>
      <div className="relative h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-saveful-cream/20 to-gray-50 p-4 md:p-8">
      <div className="relative z-10 mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-saveful-bold text-3xl text-saveful-green">Edit Ingredient</h1>
          <p className="font-saveful text-saveful-gray">Update ingredient details</p>
        </div>
        <Link href="/admin/ingredients" className="rounded-xl border-2 border-gray-200 px-4 py-2 font-saveful hover:bg-gray-50">
          Back to Ingredients
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-saveful-bold text-xl text-gray-800">Basic Information</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Name *</label>
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              />
            </div>
            <div>
              <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Average Weight (g) *</label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={form.averageWeight ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = Number(val);
                  setForm({ ...form, averageWeight: val === '' || isNaN(num) ? undefined : num });
                }}
                required
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              />
            </div>
            <div>
              <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Ingredient Category *</label>
              <select
                value={form.categoryId || ''}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                required
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              >
                <option value="">{loadingData ? "Loading categories..." : "Select category..."}</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Suitable Diets</label>
              <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-3 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {loadingData ? (
                  <p className="text-sm text-gray-500">Loading diets...</p>
                ) : diets.length === 0 ? (
                  <p className="text-sm text-gray-500">No diets available. Please add diets first.</p>
                ) : (
                  diets.map((diet) => {
                    const id = diet._id || diet.id!;
                    const checked = (form.suitableDiets || []).includes(id);
                    return (
                      <label key={id} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${checked ? 'border-saveful-green bg-white' : 'border-gray-200 bg-white'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const current = form.suitableDiets || [];
                            setForm({
                              ...form,
                              suitableDiets: e.target.checked ? [...current, id] : current.filter((x) => x !== id),
                            });
                          }}
                        />
                        {diet.name}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="font-saveful-semibold text-sm text-gray-700">Has Page</label>
              <input
                type="checkbox"
                checked={!!form.hasPage}
                onChange={(e) => setForm({ ...form, hasPage: e.target.checked })}
              />
            </div>
          </div>
        </div>

        {/* Countries */}
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-saveful-bold text-xl text-gray-800">Available Countries</h3>
          <p className="mb-4 text-sm text-gray-500">Select the countries where this ingredient is available.</p>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((c) => {
              const checked = (form.countries || []).includes(c.name);
              return (
                <label key={c.code} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm cursor-pointer ${checked ? 'border-saveful-green bg-saveful-green/5' : 'border-gray-200 bg-white'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const current = form.countries || [];
                      setForm({
                        ...form,
                        countries: e.target.checked ? [...current, c.name] : current.filter((x) => x !== c.name),
                      });
                    }}
                  />
                  {c.name}
                </label>
              );
            })}
          </div>
        </div>

        {form.hasPage && (
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 space-y-6">
            <h3 className="font-saveful-bold text-xl text-gray-800">Page Details</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Hero Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageChange(e.target.files?.[0])} 
                  className="mb-3"
                />
                {heroImagePreview ? (
                  <div className="relative">
                    <img 
                      src={heroImagePreview} 
                      alt="Ingredient hero image" 
                      className="mt-3 h-40 w-full rounded-lg object-cover border-2 border-gray-200" 
                      onError={(e) => {
                        console.error('Failed to load image:', heroImagePreview);
                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em">Image not found</text></svg>';
                      }}
                    />
                    <p className="mt-1 text-xs text-gray-500">Current image</p>
                  </div>
                ) : (
                  <div className="mt-3 h-40 w-full rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <p className="text-sm text-gray-400">No image uploaded yet</p>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Theme *</label>
                <select
                  value={form.theme || ''}
                  onChange={(e) => setForm({ ...form, theme: e.target.value as IngredientTheme })}
                  required
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                >
                  <option value="">Select theme...</option>
                  {THEMES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Description</label>
                <RichTextEditor
                  value={form.description || ''}
                  onChange={(html) => setForm({ ...form, description: html })}
                  placeholder="Enter ingredient description..."
                />
              </div>
              <div>
                <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Nutrition (HTML)</label>
                <RichTextEditor
                  value={form.nutrition || ''}
                  onChange={(html) => setForm({ ...form, nutrition: html })}
                  placeholder="Enter nutrition information..."
                />
              </div>
              <div>
                <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">In Season *</label>
                <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-3 flex flex-wrap gap-2">
                  {MONTHS.map((m) => {
                    const checked = (form.inSeason || []).includes(m);
                    return (
                      <label key={m} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${checked ? 'border-saveful-green bg-white' : 'border-gray-200 bg-white'}`}>
                        <input
                          type="checkbox"
                          checked={!!checked}
                          onChange={(e) => {
                            const current = form.inSeason || [];
                            setForm({
                              ...form,
                              inSeason: e.target.checked ? [...current, m] : current.filter((x) => x !== m),
                            });
                          }}
                        />
                        {m}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Related Hacks & Tips</label>
                <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-3 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {hacks.map((h) => {
                    const id = h._id;
                    const checked = (form.relatedHacks || []).includes(id);
                    return (
                      <label key={id} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${checked ? 'border-saveful-green bg-white' : 'border-gray-200 bg-white'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const current = form.relatedHacks || [];
                            setForm({
                              ...form,
                              relatedHacks: e.target.checked ? [...current, id] : current.filter((x) => x !== id),
                            });
                          }}
                        />
                        {h.title}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Sticker</label>
                <select
                  value={form.stickerId || ''}
                  onChange={(e) => setForm({ ...form, stickerId: e.target.value || undefined })}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                >
                  <option value="">None</option>
                  {stickers.map((s) => {
                    const sid = (s as any)._id || s.id;
                    return (
                      <option key={sid} value={sid}>{s.title}</option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Sponsor</label>
                <select
                  value={form.sponsorId || ''}
                  onChange={(e) => setForm({ ...form, sponsorId: e.target.value || undefined })}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                >
                  <option value="">None</option>
                  {sponsors.map((s) => (
                    <option key={s._id} value={s._id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Display Order</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.order !== undefined ? form.order : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, order: val === '' ? undefined : Number(val) });
                  }}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                />
              </div>
              <div>
                <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">Parent Ingredient</label>
                <select
                  value={(form.parentIngredients && form.parentIngredients.length > 0) ? form.parentIngredients[0] : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm({ ...form, parentIngredients: value ? [value] : [] });
                  }}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                >
                  <option value="">None</option>
                  {parentOptions.map((ing) => (
                    <option key={ing._id} value={ing._id}>{ing.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="font-saveful-semibold text-sm text-gray-700">Pantry Item</label>
                <input
                  type="checkbox"
                  checked={!!form.isPantryItem}
                  onChange={(e) => setForm({ ...form, isPantryItem: e.target.checked })}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/ingredients')}
            className="rounded-xl border-2 border-gray-200 px-6 py-3 font-saveful hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-saveful-green px-6 py-3 font-saveful-semibold text-white hover:bg-saveful-green/90"
          >
            {isSubmitting ? 'Saving...' : 'Update Ingredient'}
          </button>
        </div>
      </form>
      </div>
      </div>
    </DashboardLayout>
  );
}
