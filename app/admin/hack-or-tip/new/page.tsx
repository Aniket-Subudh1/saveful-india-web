"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  hackOrTipManagementService,
  CreateHackOrTipDto,
  HackOrTipType,
} from "@/services/hackOrTipManagementService";
import { sponsorManagementService, Sponsor } from "@/services/sponsorManagementService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
  }
);

export default function NewHackOrTipPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<HackOrTipType>(HackOrTipType.PRO_TIP);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [sponsorHeading, setSponsorHeading] = useState("");
  const [sponsorId, setSponsorId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      fetchSponsors();
    }
  }, [isLoading, user]);

  const fetchSponsors = async () => {
    try {
      setLoadingSponsors(true);
      const sponsorsData = await sponsorManagementService.getAllSponsors();
      setSponsors(sponsorsData);
    } catch (error: any) {
      console.error("Error fetching sponsors:", error);
      alert("Failed to fetch sponsors. Please refresh the page.");
    } finally {
      setLoadingSponsors(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!shortDescription.trim()) {
      alert("Please enter a short description");
      return;
    }

    setIsSubmitting(true);
    try {
      const data: CreateHackOrTipDto = {
        title: title.trim(),
        type,
        shortDescription: shortDescription.trim(),
        description: description?.trim() || "",
        isActive,
      };

      if (sponsorId) {
        data.sponsorId = sponsorId;
        data.sponsorHeading = sponsorHeading.trim() || "Sponsored by";
      }

      await hackOrTipManagementService.create(data);
      alert("Hack or Tip created successfully!");
      router.push("/admin/hack-or-tip");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating hack or tip:", error);
      const errorMessage = error?.message || error?.response?.data?.message || "Failed to create hack or tip";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loadingSponsors) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
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
        <div className="relative z-10 mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-saveful-bold text-3xl text-gray-900 md:text-4xl">
                New Hack or Tip
              </h1>
              <p className="mt-2 font-saveful text-sm text-gray-600">
                Create a new pro tip, mini hack, or serving suggestion
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="rounded-lg border-2 border-gray-300 px-4 py-2 font-saveful-semibold transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
              {/* Title */}
              <div className="mb-6">
                <label className="mb-2 block font-saveful-semibold text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 font-saveful transition focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                  placeholder="Enter title"
                  required
                />
              </div>

              {/* Type */}
              <div className="mb-6">
                <label className="mb-2 block font-saveful-semibold text-gray-700">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as HackOrTipType)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 font-saveful transition focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                  required
                >
                  <option value={HackOrTipType.PRO_TIP}>Pro Tip</option>
                  <option value={HackOrTipType.MINI_HACK}>Mini Hack</option>
                  <option value={HackOrTipType.SERVING_SUGGESTION}>Serving Suggestion</option>
                </select>
              </div>

              {/* Short Description */}
              <div className="mb-6">
                <label className="mb-2 block font-saveful-semibold text-gray-700">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 font-saveful transition focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                  rows={3}
                  placeholder="Enter a brief description"
                  required
                />
              </div>

              {/* Description (Rich Text) */}
              <div className="mb-6">
                <label className="mb-2 block font-saveful-semibold text-gray-700">
                  Description
                </label>
                <div className="rounded-lg border-2 border-gray-200 transition focus-within:border-saveful-green focus-within:ring-2 focus-within:ring-saveful-green/20">
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Enter detailed description (supports bold, italic, links, lists, etc.)"
                  />
                </div>
                <p className="mt-1 font-saveful text-xs text-gray-500">
                  Use the toolbar to format text with bold, italic, links, lists, etc.
                </p>
              </div>

              {/* Sponsor Section */}
              <div className="mb-6 rounded-lg bg-gray-50 p-4">
                <h3 className="mb-4 font-saveful-bold text-lg text-gray-800">
                  Sponsor Information (Optional)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block font-saveful-semibold text-gray-700">
                      Sponsor
                    </label>
                    <select
                      value={sponsorId}
                      onChange={(e) => setSponsorId(e.target.value)}
                      className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-saveful transition focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                    >
                      <option value="">No Sponsor</option>
                      {sponsors.map((sponsor) => (
                        <option key={sponsor._id} value={sponsor._id}>
                          {sponsor.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  {sponsorId && (
                    <div>
                      <label className="mb-2 block font-saveful-semibold text-gray-700">
                        Sponsor Heading
                      </label>
                      <input
                        type="text"
                        value={sponsorHeading}
                        onChange={(e) => setSponsorHeading(e.target.value)}
                        className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 font-saveful transition focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                        placeholder="Enter sponsor heading"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Active Status */
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-saveful-green focus:ring-2 focus:ring-saveful-green/20"
                />
                <label htmlFor="isActive" className="font-saveful-semibold text-gray-700">
                  Active
                </label>
              </div>}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 font-saveful-semibold transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-saveful-green px-6 py-3 font-saveful-semibold text-white shadow-lg transition hover:bg-green-600 hover:shadow-xl disabled:bg-gray-300"
              >
                {isSubmitting ? "Creating..." : "Create Hack or Tip"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
