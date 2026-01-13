"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  recipeRatingManagementService,
  RecipeRating,
} from "@/services/recipeRatingManagementService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion, AnimatePresence } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faTimes,
  faStar,
  faUser,
  faCalendar,
  faEye,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";

export default function RecipeRatingsPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  // State management
  const [ratings, setRatings] = useState<RecipeRating[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState<RecipeRating | null>(
    null
  );

  useEffect(() => {
    if (!isLoading && user) {
      loadData();
    }
  }, [isLoading, user]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const ratingsData =
        await recipeRatingManagementService.getAllRecipeRatings();
      setRatings(ratingsData);
    } catch (error) {
      console.error("Error loading recipe ratings:", error);
      alert("Failed to load recipe ratings");
    } finally {
      setLoadingData(false);
    }
  };

  const handleViewRating = (rating: RecipeRating) => {
    setSelectedRating(rating);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowViewModal(false);
    setSelectedRating(null);
  };

  const filteredRatings = ratings.filter(
    (rating) =>
      rating.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rating.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rating.ratingTagId?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      rating.review?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const getRatingColor = (order: number) => {
    if (order >= 8) return "bg-green-100 text-green-800";
    if (order >= 5) return "bg-blue-100 text-blue-800";
    if (order >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saveful-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout config={sidebarConfig}>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recipe Ratings
          </h1>
          <p className="text-gray-600">
            View and manage all recipe ratings submitted by users
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ratings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {ratings.length}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FontAwesomeIcon
                  icon={faStar}
                  className="text-2xl text-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Reviews</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {ratings.filter((r) => r.review && r.review.trim()).length}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <FontAwesomeIcon
                  icon={faUtensils}
                  className="text-2xl text-green-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {new Set(ratings.map((r) => r.userId?._id)).size}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-2xl text-purple-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by user, rating tag, or review..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent"
            />
          </div>
        </div>

        {/* Ratings List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-saveful-green mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading ratings...</p>
            </div>
          ) : filteredRatings.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon
                icon={faStar}
                className="text-6xl text-gray-300 mb-4"
              />
              <p className="text-gray-600 text-lg">
                {searchQuery ? "No ratings found" : "No ratings yet"}
              </p>
              <p className="text-gray-500 mt-2">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Ratings will appear here when users rate recipes"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipe ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRatings.map((rating) => (
                    <motion.tr
                      key={rating._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="bg-saveful-purple text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                            {rating.userId?.name?.charAt(0).toUpperCase() ||
                              "?"}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {rating.userId?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {rating.userId?.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 font-mono">
                          {rating.recipeId?.substring(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRatingColor(
                            rating.ratingTagId?.order || 0
                          )}`}
                        >
                          <FontAwesomeIcon
                            icon={faStar}
                            className="mr-1.5"
                          />
                          {rating.ratingTagId?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {rating.review ? (
                          <p className="text-sm text-gray-600 truncate">
                            {rating.review}
                          </p>
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            No review
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FontAwesomeIcon
                            icon={faCalendar}
                            className="text-gray-400"
                          />
                          {formatDate(rating.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewRating(rating)}
                          className="text-saveful-green hover:text-saveful-green/80 p-2 rounded-lg hover:bg-green-50 transition-colors"
                          title="View Details"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Rating Modal */}
      <AnimatePresence>
        {showViewModal && selectedRating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Rating Details
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    User Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-saveful-purple text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-medium">
                        {selectedRating.userId?.name
                          ?.charAt(0)
                          .toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedRating.userId?.name || "Unknown User"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedRating.userId?.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipe Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Recipe
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Recipe ID:</p>
                    <p className="font-mono text-gray-900">
                      {selectedRating.recipeId}
                    </p>
                  </div>
                </div>

                {/* Rating Tag */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Rating
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getRatingColor(
                          selectedRating.ratingTagId?.order || 0
                        )}`}
                      >
                        <FontAwesomeIcon icon={faStar} className="mr-2" />
                        {selectedRating.ratingTagId?.name || "Unknown"}
                      </span>
                      <span className="text-sm text-gray-600">
                        Order: {selectedRating.ratingTagId?.order || 0}
                      </span>
                    </div>
                    {selectedRating.ratingTagId?.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedRating.ratingTagId.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Review */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Review
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedRating.review ? (
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {selectedRating.review}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">
                        No review provided
                      </p>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Timestamps
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(selectedRating.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Updated:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(selectedRating.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={handleCloseModal}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
