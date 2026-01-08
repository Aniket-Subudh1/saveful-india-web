"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  frameworkCategoryManagementService,
  FrameworkCategory,
  UpdateFrameworkCategoryDto,
} from "@/services/frameworkCategoryManagementService";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave } from "@fortawesome/free-solid-svg-icons";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

export default function EditFrameworkCategoryPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<FrameworkCategory | null>(null);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user && categoryId) {
      fetchCategory();
    }
  }, [isLoading, user, categoryId]);

  const fetchCategory = async () => {
    try {
      setLoadingCategory(true);
      const data = await frameworkCategoryManagementService.getCategoryById(categoryId);
      setCategory(data);
    } catch (error: any) {
      console.error("Error fetching category:", error);
      alert("Failed to load framework category");
      router.push("/admin/framework-categories");
    } finally {
      setLoadingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateFrameworkCategoryDto = {
        title: category.title,
        description: category.description,
      };

      await frameworkCategoryManagementService.updateCategory(categoryId, updateData);
      alert("Framework category updated successfully!");
      router.push("/admin/framework-categories");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating category:", error);
      alert(error?.response?.data?.message || "Failed to update framework category");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loadingCategory) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  const handleLogout = () => {
    router.push("/admin/login");
  };

  const sidebarConfig = {
    role: "admin" as const,
    userName: user?.name || "Admin",
    userEmail: user?.email || "",
    links: getAdminSidebarLinks(handleLogout),
  };

  return (
    <DashboardLayout config={sidebarConfig}>
      <div className="relative h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-saveful-cream/20 to-gray-50 p-4 md:p-8">
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/framework-categories")}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white shadow-sm transition hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div>
              <h1 className="font-saveful-bold text-3xl text-gray-900">
                Edit Framework Category
              </h1>
              <p className="mt-1 font-saveful text-sm text-gray-600">{category.title}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={category.title}
                    onChange={(e) => setCategory({ ...category, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                    Description
                  </label>
                  <RichTextEditor
                    value={category.description || ""}
                    onChange={(html) => setCategory({ ...category, description: html })}
                    rows={8}
                    placeholder="Enter category description (optional)..."
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
              <button
                type="button"
                onClick={() => router.push("/admin/framework-categories")}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2.5 font-saveful-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-saveful-green px-4 py-2.5 font-saveful-semibold text-white shadow-md transition hover:bg-green-600 hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                {isSubmitting ? "Updating..." : "Update Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
