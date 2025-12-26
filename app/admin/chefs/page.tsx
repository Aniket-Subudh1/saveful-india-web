"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { chefManagementService } from "@/services/chefManagementService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserTie,
  faEnvelope,
  faPhone,
  faLock,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";

interface Chef {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  createdAt: string;
}

export default function ChefsPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loadingChefs, setLoadingChefs] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chefToDelete, setChefToDelete] = useState<Chef | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      loadChefs();
    }
  }, [isLoading, user]);

  const loadChefs = async () => {
    try {
      setLoadingChefs(true);
      const data = await chefManagementService.getAllChefs();
      setChefs(data);
    } catch (error: any) {
      console.error("Failed to load chefs:", error);
    } finally {
      setLoadingChefs(false);
    }
  };

  const handleCreateChef = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);

    try {
      await chefManagementService.createChef(formData);
      setFormSuccess("Chef created successfully!");
      setFormData({ name: "", email: "", password: "", phoneNumber: "" });
      loadChefs();
      
      // Close modal after 1.5 seconds to show success message
      setTimeout(() => {
        setShowCreateForm(false);
        setFormSuccess("");
      }, 1500);
    } catch (error: any) {
      setFormError(error.response?.data?.message || "Failed to create chef");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChef = async (id: string) => {
    setIsDeleting(true);

    try {
      await chefManagementService.deleteChef(id);
      loadChefs();
      setShowDeleteModal(false);
      setChefToDelete(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete chef");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (chef: Chef) => {
    setChefToDelete(chef);
    setShowDeleteModal(true);
  };

  const handleLogout = async () => {
    await authService.logout("admin");
    router.push("/admin/login");
  };

  const sidebarConfig = {
    role: "admin" as const,
    userName: user?.name || "Admin",
    userEmail: user?.email || "",
    links: getAdminSidebarLinks(handleLogout),
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg font-saveful text-saveful-green">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout config={sidebarConfig}>
      <div className="relative h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-saveful-cream/30 to-gray-50 p-4 md:p-8">
        {/* Decorative Background Elements */}
        <div className="pointer-events-none absolute right-0 top-0 opacity-10">
          <Image
            src="/Illustration@2x.png"
            alt="Decoration"
            width={400}
            height={400}
            className="object-contain"
          />
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 opacity-5">
          <Image
            src="/food.png"
            alt="Food"
            width={300}
            height={300}
            className="object-contain"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          {/* Header with Animation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-saveful-orange to-saveful-pink p-4 shadow-lg">
                <FontAwesomeIcon icon={faUserTie} className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="mb-1 font-saveful-bold text-4xl text-saveful-green">
                  Chef Management
                </h1>
                <p className="font-saveful text-saveful-gray">
                  Build your culinary dream team
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="absolute right-0 top-0 opacity-10">
                <Image
                  src="/profile-green-apples.png"
                  alt=""
                  width={100}
                  height={100}
                  className="object-contain"
                />
              </div>
              <div className="relative">
                <p className="mb-1 font-saveful text-sm text-gray-500">Total Chefs</p>
                <p className="font-saveful-bold text-3xl text-saveful-green">
                  {chefs.length}
                </p>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="absolute right-0 top-0 opacity-10">
                <Image
                  src="/profile-pink-limes.png"
                  alt=""
                  width={100}
                  height={100}
                  className="object-contain"
                />
              </div>
              <div className="relative">
                <p className="mb-1 font-saveful text-sm text-gray-500">Active This Month</p>
                <p className="font-saveful-bold text-3xl text-saveful-purple">
                  {chefs.length}
                </p>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="absolute right-0 top-0 opacity-10">
                <Image
                  src="/eggplant-survey.png"
                  alt=""
                  width={100}
                  height={100}
                  className="object-contain"
                />
              </div>
              <div className="relative">
                <p className="mb-1 font-saveful text-sm text-gray-500">Recipes Created</p>
                <p className="font-saveful-bold text-3xl text-saveful-orange">
                  {chefs.length * 14}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Chef Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/80 p-6 shadow-2xl backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-saveful-bold text-2xl text-saveful-green">
                Your Culinary Team
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-saveful-green to-saveful-green/80 px-6 py-3 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl"
              >
                <FontAwesomeIcon icon={faUserPlus} className="h-5 w-5 transition-transform group-hover:rotate-12" />
                {showCreateForm ? "Cancel" : "Add New Chef"}
              </motion.button>
            </div>

            {/* Create Chef Modal */}
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={() => setShowCreateForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-saveful-purple/20 bg-white p-8 shadow-2xl"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-saveful-purple/10 p-3">
                        <FontAwesomeIcon icon={faUserTie} className="h-6 w-6 text-saveful-purple" />
                      </div>
                      <h3 className="font-saveful-semibold text-2xl text-saveful-purple">
                        Create New Chef Account
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <form onSubmit={handleCreateChef} className="space-y-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="mb-2 flex items-center gap-2 font-saveful-semibold text-sm text-saveful-green">
                        <FontAwesomeIcon icon={faUserTie} className="h-4 w-4" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-saveful transition-all focus:border-saveful-purple focus:outline-none focus:ring-2 focus:ring-saveful-purple/20"
                        placeholder="Enter chef's full name"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="mb-2 flex items-center gap-2 font-saveful-semibold text-sm text-saveful-green">
                        <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-saveful transition-all focus:border-saveful-purple focus:outline-none focus:ring-2 focus:ring-saveful-purple/20"
                        placeholder="chef@saveful.in"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="mb-2 flex items-center gap-2 font-saveful-semibold text-sm text-saveful-green">
                        <FontAwesomeIcon icon={faLock} className="h-4 w-4" />
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-saveful transition-all focus:border-saveful-purple focus:outline-none focus:ring-2 focus:ring-saveful-purple/20"
                        placeholder="Create a secure password"
                        minLength={6}
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <label className="mb-2 flex items-center gap-2 font-saveful-semibold text-sm text-saveful-green">
                        <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phoneNumber: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 font-saveful transition-all focus:border-saveful-purple focus:outline-none focus:ring-2 focus:ring-saveful-purple/20"
                        placeholder="+91 9876543210"
                      />
                    </motion.div>
                  </div>

                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-red-50 p-4 font-saveful text-sm text-red-600 shadow-sm"
                    >
                      ⚠️ {formError}
                    </motion.div>
                  )}
                  {formSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-green-50 p-4 font-saveful text-sm text-green-600 shadow-sm"
                    >
                      ✓ {formSuccess}
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-gradient-to-r from-saveful-purple to-saveful-pink px-6 py-4 font-saveful-semibold text-lg text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating Chef...
                      </span>
                    ) : (
                      "Create Chef Account"
                    )}
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
            )}

            {/* Chefs List */}
            {loadingChefs ? (
              <div className="py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-saveful-green border-t-transparent"></div>
                <p className="mt-4 font-saveful text-saveful-gray">Loading chefs...</p>
              </div>
            ) : chefs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-saveful-cream to-white p-12 text-center"
              >
                <div className="absolute inset-0 opacity-5">
                  <Image
                    src="/Illustration@2x.png"
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-full bg-saveful-orange/10 p-6">
                    <FontAwesomeIcon icon={faUserTie} className="h-16 w-16 text-saveful-orange" />
                  </div>
                  <p className="mb-2 font-saveful-bold text-2xl text-saveful-green">
                    No chefs yet
                  </p>
                  <p className="font-saveful text-saveful-gray">
                    Start building your culinary team by creating your first chef account
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="overflow-hidden rounded-xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-saveful-green/20 bg-gradient-to-r from-saveful-green/5 to-saveful-green/10">
                        <th className="px-6 py-4 text-left font-saveful-bold text-sm uppercase tracking-wide text-saveful-green">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faUserTie} className="h-4 w-4" />
                            Chef
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left font-saveful-bold text-sm uppercase tracking-wide text-saveful-green">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                            Email
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left font-saveful-bold text-sm uppercase tracking-wide text-saveful-green">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
                            Phone
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left font-saveful-bold text-sm uppercase tracking-wide text-saveful-green">
                          Joined
                        </th>
                        <th className="px-6 py-4 text-center font-saveful-bold text-sm uppercase tracking-wide text-saveful-green">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {chefs.map((chef, index) => (
                        <motion.tr
                          key={chef.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group border-b border-gray-100 transition-all hover:bg-saveful-cream/30"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-saveful-purple to-saveful-pink shadow-md">
                                <span className="font-saveful-bold text-lg text-white">
                                  {chef.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-saveful-semibold text-saveful-black">
                                {chef.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-saveful text-saveful-gray">
                            {chef.email}
                          </td>
                          <td className="px-6 py-4 font-saveful text-saveful-gray">
                            {chef.phoneNumber || (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-saveful text-sm text-saveful-gray">
                            {new Date(chef.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openDeleteModal(chef)}
                              className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 font-saveful-semibold text-sm text-white shadow-md transition-all hover:shadow-lg"
                            >
                              Remove
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && chefToDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
          >
            <div className="mb-6 flex items-center gap-4">
              <div className="rounded-full bg-red-100 p-3">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-saveful-bold text-2xl text-saveful-black">
                  Remove Chef
                </h3>
                <p className="font-saveful text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-gray-50 p-4">
              <p className="mb-2 font-saveful text-saveful-gray">
                Are you sure you want to remove:
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-saveful-purple to-saveful-pink shadow-md">
                  <span className="font-saveful-bold text-lg text-white">
                    {chefToDelete.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-saveful-semibold text-saveful-black">
                    {chefToDelete.name}
                  </p>
                  <p className="font-saveful text-sm text-gray-500">
                    {chefToDelete.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-6 py-3 font-saveful-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDeleteChef(chefToDelete.id)}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Removing...
                  </span>
                ) : (
                  "Yes, Remove Chef"
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
