"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  hackOrTipManagementService,
  HackOrTip,
  HackOrTipType,
} from "@/services/hackOrTipManagementService";
import { sponsorManagementService, Sponsor } from "@/services/sponsorManagementService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion, AnimatePresence } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faLightbulb,
  faToggleOn,
  faToggleOff,
} from "@fortawesome/free-solid-svg-icons";

export default function HackOrTipPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [hackOrTips, setHackOrTips] = useState<HackOrTip[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HackOrTip | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      fetchData();
    }
  }, [isLoading, user]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [hackOrTipsData, sponsorsData] = await Promise.all([
        hackOrTipManagementService.getAll(),
        sponsorManagementService.getAllSponsors(),
      ]);
      setHackOrTips(hackOrTipsData);
      setSponsors(sponsorsData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      const errorMessage = error?.message || "Failed to fetch data. Please refresh the page.";
      alert(errorMessage);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsSubmitting(true);
    try {
      await hackOrTipManagementService.delete(itemToDelete._id);
      alert("Hack or Tip deleted successfully!");
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting:", error);
      alert(error?.response?.data?.message || "Failed to delete");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: HackOrTip) => {
    try {
      await hackOrTipManagementService.toggleActive(item._id);
      fetchData();
    } catch (error: any) {
      console.error("Error toggling status:", error);
      alert(error?.response?.data?.message || "Failed to toggle status");
    }
  };

  const filteredItems = hackOrTips
    .filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || item.type === selectedType;
      return matchesSearch && matchesType;
    });

  const getSponsorName = (sponsorId: string | any): string => {
    if (!sponsorId) return "No Sponsor";
    const id = typeof sponsorId === "object" ? sponsorId._id : sponsorId;
    const sponsor = sponsors.find((s) => s._id === id);
    return sponsor?.title || "Unknown Sponsor";
  };

  if (isLoading || loadingData) {
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
        {/* Decorative Background */}
        <div className="pointer-events-none absolute right-0 top-0 opacity-5">
          <svg className="h-96 w-96" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#F59E0B" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,72.8,41.7C64.2,54.2,52.6,64.6,39.1,71.8C25.6,79,10.2,83,-5.6,83.3C-21.4,83.6,-42.8,80.2,-58.3,71.2C-73.8,62.2,-83.4,47.6,-87.7,31.8C-92,16,-91,-1,-84.9,-16.2C-78.8,-31.4,-67.6,-44.8,-54.2,-52.4C-40.8,-60,-25.2,-61.8,-10.4,-64.8C4.4,-67.8,8.8,-72,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-saveful-bold text-3xl text-gray-900 md:text-4xl">
                Hacks & Tips Management
              </h1>
              <p className="mt-2 font-saveful text-sm text-gray-600">
                Manage pro tips, mini hacks, and serving suggestions
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/hack-or-tip/new")}
              className="flex items-center gap-2 rounded-lg bg-saveful-green px-4 py-2.5 font-saveful-semibold text-white shadow-lg transition hover:bg-green-600 hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faPlus} />
              New Hack or Tip
            </button>
          </div>

          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 font-saveful shadow-sm transition focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-saveful shadow-sm transition focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
            >
              <option value="all">All Types</option>
              <option value={HackOrTipType.PRO_TIP}>Pro Tip</option>
              <option value={HackOrTipType.MINI_HACK}>Mini Hack</option>
              <option value={HackOrTipType.SERVING_SUGGESTION}>Serving Suggestion</option>
            </select>
          </div>

          {/* Items Grid */}
          <div className="space-y-4">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-saveful-green border-t-transparent"></div>
                <p className="mt-4 font-saveful text-gray-500">Loading...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16">
                <div className="mb-4 rounded-full bg-gray-200 p-6">
                  <FontAwesomeIcon icon={faLightbulb} className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="font-saveful-bold text-lg text-gray-700">
                  {searchQuery ? "No items match your search" : "No items yet"}
                </h3>
                <p className="mt-2 font-saveful text-sm text-gray-500">
                  {searchQuery ? "Try a different search term" : "Click 'New Hack or Tip' to create your first item"}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="group rounded-xl border border-gray-200 bg-white p-5 shadow-md transition hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 font-saveful-bold text-xs ${
                              item.type === HackOrTipType.PRO_TIP
                                ? "bg-blue-100 text-blue-700"
                                : item.type === HackOrTipType.MINI_HACK
                                ? "bg-purple-100 text-purple-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {item.type}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 font-saveful-bold text-xs ${
                              item.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <h3 className="mb-2 font-saveful-bold text-lg text-gray-900">
                          {item.title}
                        </h3>
                        <p className="mb-2 font-saveful text-sm text-gray-600 line-clamp-2">
                          {item.shortDescription}
                        </p>
                        {item.sponsorId && (
                          <p className="font-saveful text-xs text-gray-500">
                            {item.sponsorHeading || "Sponsored by"}: {getSponsorName(item.sponsorId)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className="rounded-lg bg-gray-500 px-3 py-2 font-saveful-semibold text-xs text-white shadow-md transition hover:bg-gray-600"
                          title={item.isActive ? "Deactivate" : "Activate"}
                        >
                          <FontAwesomeIcon
                            icon={item.isActive ? faToggleOn : faToggleOff}
                          />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/hack-or-tip/${item._id}/edit`)}
                          className="rounded-lg bg-blue-500 px-3 py-2 font-saveful-semibold text-xs text-white shadow-md transition hover:bg-blue-600"
                        >
                          <FontAwesomeIcon icon={faEdit} className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(item);
                            setShowDeleteModal(true);
                          }}
                          className="rounded-lg bg-red-500 px-3 py-2 font-saveful-semibold text-xs text-white shadow-md transition hover:bg-red-600"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="w-full max-w-md rounded-lg bg-white p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="mb-4 font-saveful-bold text-xl">Confirm Delete</h2>
                <p className="mb-4 font-saveful text-gray-600">
                  Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 font-saveful-semibold transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-saveful-semibold text-white transition hover:bg-red-600 disabled:bg-gray-300"
                  >
                    {isSubmitting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
