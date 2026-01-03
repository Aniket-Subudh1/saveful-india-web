"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { userManagementService } from "@/services/userManagementService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faUtensils,
  faChartLine,
  faCheck,
  faTimes,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { User, UserStats } from "@/types/user";

export default function UsersPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      loadUsers();
      loadStats();
    }
  }, [isLoading, user]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await userManagementService.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      console.error("Failed to load users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await userManagementService.getUserStats();
      setStats(statsData);
    } catch (error: any) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setIsDeleting(true);

    try {
      await userManagementService.deleteUser(id);
      loadUsers();
      loadStats();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const openDetailsModal = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
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
              <div className="rounded-2xl bg-gradient-to-br from-saveful-green to-saveful-purple p-4 shadow-lg">
                <FontAwesomeIcon icon={faUsers} className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="mb-1 font-saveful-bold text-4xl text-saveful-green">
                  User Management
                </h1>
                <p className="font-saveful text-saveful-gray">
                  Monitor and manage your app users
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4"
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
                  <p className="mb-1 font-saveful text-sm text-gray-500">Total Users</p>
                  <p className="font-saveful-bold text-3xl text-saveful-green">
                    {stats.totalUsers}
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
                  <p className="mb-1 font-saveful text-sm text-gray-500">Onboarding Complete</p>
                  <p className="font-saveful-bold text-3xl text-saveful-purple">
                    {stats.usersWithOnboarding}
                  </p>
                  <p className="mt-1 font-saveful text-xs text-gray-400">
                    {stats.onboardingCompletionRate}
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
                  <p className="mb-1 font-saveful text-sm text-gray-500">Dietary Profiles</p>
                  <p className="font-saveful-bold text-3xl text-saveful-orange">
                    {stats.usersWithDietaryProfile}
                  </p>
                  <p className="mt-1 font-saveful text-xs text-gray-400">
                    {stats.dietaryProfileCompletionRate}
                  </p>
                </div>
              </div>
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
                  <p className="font-saveful-bold text-3xl text-saveful-pink">
                    {stats.totalChefs}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* User Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/80 p-6 shadow-2xl backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-saveful-bold text-2xl text-saveful-green">
                User Directory
              </h2>
              <div className="flex items-center gap-2 rounded-lg bg-saveful-green/10 px-4 py-2">
                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-saveful-green" />
                <span className="font-saveful-semibold text-saveful-green">
                  {users.length} Active Users
                </span>
              </div>
            </div>

            {/* Users List */}
            {loadingUsers ? (
              <div className="py-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-saveful-green border-t-transparent"></div>
                <p className="mt-4 font-saveful text-saveful-gray">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
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
                  <div className="mb-4 inline-flex rounded-full bg-saveful-green/10 p-6">
                    <FontAwesomeIcon icon={faUsers} className="h-16 w-16 text-saveful-green" />
                  </div>
                  <p className="mb-2 font-saveful-bold text-2xl text-saveful-green">
                    No users yet
                  </p>
                  <p className="font-saveful text-saveful-gray">
                    Users will appear here once they sign up
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
                            <FontAwesomeIcon icon={faUsers} className="h-4 w-4" />
                            User
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left font-saveful-bold text-sm uppercase tracking-wide text-saveful-green">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                            Contact
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center font-saveful-bold text-sm uppercase tracking-wide text-saveful-green">
                          <div className="flex items-center justify-center gap-2">
                            <FontAwesomeIcon icon={faUtensils} className="h-4 w-4" />
                            Diet Profile
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center font-saveful-bold text-sm uppercase tracking-wide text-saveful-green">
                          <div className="flex items-center justify-center gap-2">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4" />
                            Onboarding
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
                      {users.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group border-b border-gray-100 transition-all hover:bg-saveful-cream/30"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-saveful-green to-saveful-purple shadow-md">
                                <span className="font-saveful-bold text-lg text-white">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span className="font-saveful-semibold text-saveful-black">
                                  {user.name}
                                </span>
                                {user._count && (
                                  <p className="font-saveful text-xs text-gray-400">
                                    {user._count.cookedRecipes} recipes cooked
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-saveful text-sm text-saveful-gray">
                              <p>{user.email}</p>
                              {user.country && (
                                <p className="text-xs text-gray-400">{user.country}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {user.dietaryProfile ? (
                              <div className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1">
                                <FontAwesomeIcon icon={faCheck} className="h-3 w-3 text-green-600" />
                                <span className="font-saveful-semibold text-xs text-green-600">
                                  {user.dietaryProfile.vegType}
                                </span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                                <FontAwesomeIcon icon={faTimes} className="h-3 w-3 text-gray-400" />
                                <span className="font-saveful text-xs text-gray-400">
                                  Not set
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {user.onboarding ? (
                              <div className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1">
                                <FontAwesomeIcon icon={faCheck} className="h-3 w-3 text-blue-600" />
                                <span className="font-saveful-semibold text-xs text-blue-600">
                                  Complete
                                </span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="h-3 w-3 text-yellow-600" />
                                <span className="font-saveful text-xs text-yellow-600">
                                  Pending
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-saveful text-sm text-saveful-gray">
                            {new Date(user.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openDetailsModal(user)}
                                className="rounded-lg bg-gradient-to-r from-saveful-green to-saveful-green/80 px-4 py-2 font-saveful-semibold text-sm text-white shadow-md transition-all hover:shadow-lg"
                              >
                                View
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => openDeleteModal(user)}
                                className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 font-saveful-semibold text-sm text-white shadow-md transition-all hover:shadow-lg"
                              >
                                Remove
                              </motion.button>
                            </div>
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

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-saveful-green/20 bg-white p-8 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-saveful-green to-saveful-purple shadow-lg">
                  <span className="font-saveful-bold text-2xl text-white">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-saveful-bold text-2xl text-saveful-green">
                    {selectedUser.name}
                  </h3>
                  <p className="font-saveful text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <div className="rounded-xl bg-gray-50 p-6">
                <h4 className="mb-4 font-saveful-bold text-lg text-saveful-green">
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="font-saveful text-xs text-gray-500">Email</p>
                    <p className="font-saveful-semibold text-saveful-black">{selectedUser.email}</p>
                  </div>
                  {selectedUser.country && (
                    <div>
                      <p className="font-saveful text-xs text-gray-500">Country</p>
                      <p className="font-saveful-semibold text-saveful-black">{selectedUser.country}</p>
                    </div>
                  )}
                  {selectedUser.stateCode && (
                    <div>
                      <p className="font-saveful text-xs text-gray-500">State Code</p>
                      <p className="font-saveful-semibold text-saveful-black">{selectedUser.stateCode}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-saveful text-xs text-gray-500">Joined</p>
                    <p className="font-saveful-semibold text-saveful-black">
                      {new Date(selectedUser.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              {selectedUser._count && (
                <div className="rounded-xl bg-gradient-to-br from-saveful-green/10 to-saveful-purple/10 p-6">
                  <h4 className="mb-4 font-saveful-bold text-lg text-saveful-green">
                    Activity Stats
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-saveful text-sm text-gray-600">Cooked Recipes</p>
                      <p className="font-saveful-bold text-xl text-saveful-orange">
                        {selectedUser._count.cookedRecipes}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-saveful text-sm text-gray-600">Bookmarked Recipes</p>
                      <p className="font-saveful-bold text-xl text-saveful-purple">
                        {selectedUser._count.bookmarkedRecipes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dietary Profile */}
              <div className="rounded-xl bg-orange-50 p-6">
                <h4 className="mb-4 font-saveful-bold text-lg text-saveful-orange">
                  Dietary Profile
                </h4>
                {selectedUser.dietaryProfile ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-saveful text-xs text-gray-500">Vegetarian Type</p>
                      <p className="font-saveful-semibold text-saveful-black">
                        {selectedUser.dietaryProfile.vegType}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={selectedUser.dietaryProfile.dairyFree ? faCheck : faTimes}
                          className={`h-4 w-4 ${selectedUser.dietaryProfile.dairyFree ? "text-green-600" : "text-gray-400"}`}
                        />
                        <span className="font-saveful text-sm">Dairy Free</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={selectedUser.dietaryProfile.nutFree ? faCheck : faTimes}
                          className={`h-4 w-4 ${selectedUser.dietaryProfile.nutFree ? "text-green-600" : "text-gray-400"}`}
                        />
                        <span className="font-saveful text-sm">Nut Free</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={selectedUser.dietaryProfile.glutenFree ? faCheck : faTimes}
                          className={`h-4 w-4 ${selectedUser.dietaryProfile.glutenFree ? "text-green-600" : "text-gray-400"}`}
                        />
                        <span className="font-saveful text-sm">Gluten Free</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={selectedUser.dietaryProfile.hasDiabetes ? faCheck : faTimes}
                          className={`h-4 w-4 ${selectedUser.dietaryProfile.hasDiabetes ? "text-green-600" : "text-gray-400"}`}
                        />
                        <span className="font-saveful text-sm">Has Diabetes</span>
                      </div>
                    </div>
                    {selectedUser.dietaryProfile.otherAllergies.length > 0 && (
                      <div>
                        <p className="font-saveful text-xs text-gray-500">Other Allergies</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {selectedUser.dietaryProfile.otherAllergies.map((allergy, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-orange-200 px-3 py-1 font-saveful text-xs text-orange-800"
                            >
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="font-saveful text-sm italic text-gray-400">Not configured yet</p>
                )}
              </div>

              {/* Onboarding Details */}
              <div className="rounded-xl bg-blue-50 p-6">
                <h4 className="mb-4 font-saveful-bold text-lg text-saveful-purple">
                  Onboarding Details
                </h4>
                {selectedUser.onboarding ? (
                  <div className="space-y-3">
                    {selectedUser.onboarding.country && (
                      <div>
                        <p className="font-saveful text-xs text-gray-500">Country</p>
                        <p className="font-saveful-semibold text-saveful-black">
                          {selectedUser.onboarding.country}
                        </p>
                      </div>
                    )}
                    {selectedUser.onboarding.stateCode && (
                      <div>
                        <p className="font-saveful text-xs text-gray-500">State Code</p>
                        <p className="font-saveful-semibold text-saveful-black">
                          {selectedUser.onboarding.stateCode}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="font-saveful text-xs text-gray-500">Adults</p>
                        <p className="font-saveful-semibold text-saveful-black">
                          {selectedUser.onboarding.noOfAdults}
                        </p>
                      </div>
                      <div>
                        <p className="font-saveful text-xs text-gray-500">Children</p>
                        <p className="font-saveful-semibold text-saveful-black">
                          {selectedUser.onboarding.noOfChildren}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="font-saveful text-sm italic text-gray-400">Not completed yet</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
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
                  Remove User
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
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-saveful-green to-saveful-purple shadow-md">
                  <span className="font-saveful-bold text-lg text-white">
                    {userToDelete.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-saveful-semibold text-saveful-black">
                    {userToDelete.name}
                  </p>
                  <p className="font-saveful text-sm text-gray-500">
                    {userToDelete.email}
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
                onClick={() => handleDeleteUser(userToDelete.id)}
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
                  "Yes, Remove User"
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
