"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  feedbackManagementService,
  FeedbackWithDetails,
} from "@/services/feedbackManagementService";
import { recipeManagementService, Recipe } from "@/services/recipeManagementService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faComments,
  faStar,
  faUser,
  faClock,
  faTrash,
  faUtensils,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";

export default function FeedbacksPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<string>("all");
  const [feedbacks, setFeedbacks] = useState<FeedbackWithDetails[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<FeedbackWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterRating, setFilterRating] = useState<number | "all">("all");

  // Load recipes on mount
  useEffect(() => {
    if (!isLoading && user) {
      fetchRecipes();
    }
  }, [isLoading, user]);

  // Load feedbacks when recipe filter changes
  useEffect(() => {
    if (!isLoading && user) {
      if (selectedRecipe && selectedRecipe !== "all") {
        fetchFeedbacksByRecipe(selectedRecipe);
      } else {
        fetchAllFeedbacks();
      }
    }
  }, [selectedRecipe, isLoading, user]);

  const fetchRecipes = async () => {
    try {
      setLoadingData(true);
      const recipesData = await recipeManagementService.getAllRecipes();
      setRecipes(recipesData);
      setSelectedRecipe("all");
    } catch (error: any) {
      console.error("Error fetching recipes:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to fetch recipes.";
      alert(errorMessage);
      setRecipes([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAllFeedbacks = async () => {
    try {
      setLoadingData(true);
      const data = await feedbackManagementService.getAllFeedbacks();
      setFeedbacks(data);
    } catch (error: any) {
      console.error("Error fetching feedbacks:", error);
      setFeedbacks([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchFeedbacksByRecipe = async (recipeId: string) => {
    try {
      setLoadingData(true);
      const data = await feedbackManagementService.getFeedbacksByRecipe(recipeId);
      setFeedbacks(data);
    } catch (error: any) {
      console.error("Error fetching feedbacks:", error);
      setFeedbacks([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeleteFeedback = async () => {
    if (!feedbackToDelete) return;

    try {
      setIsSubmitting(true);
      await feedbackManagementService.deleteFeedback(feedbackToDelete._id);
      setFeedbacks(feedbacks.filter((f) => f._id !== feedbackToDelete._id));
      setShowDeleteModal(false);
      setFeedbackToDelete(null);
    } catch (error: any) {
      console.error("Error deleting feedback:", error);
      alert(error?.response?.data?.message || "Failed to delete feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (feedback: FeedbackWithDetails) => {
    setFeedbackToDelete(feedback);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setFeedbackToDelete(null);
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

  // Filter feedbacks by search query and rating
  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesSearch =
      searchQuery === "" ||
      feedback.recipe?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.data?.review?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating =
      filterRating === "all" ||
      (feedback.data?.rating && feedback.data.rating === filterRating);

    return matchesSearch && matchesRating;
  });

  // Render star rating
  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400 text-sm">No rating</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FontAwesomeIcon
            key={star}
            icon={faStar}
            className={`h-4 w-4 ${
              star <= rating ? "text-saveful-orange" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">{rating}/5</span>
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg font-saveful text-saveful-green">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout config={sidebarConfig}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 via-saveful-cream/20 to-gray-50 p-6"
      >
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-saveful-purple to-saveful-purple/80 rounded-xl shadow-lg">
              <FontAwesomeIcon icon={faComments} className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">User Feedbacks</h1>
              <p className="text-gray-600">View and manage recipe feedbacks from users</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recipe Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faUtensils} className="mr-2" />
                Filter by Recipe
              </label>
              <select
                value={selectedRecipe}
                onChange={(e) => setSelectedRecipe(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-saveful-green"
              >
                <option value="all">All Recipes</option>
                {recipes.map((recipe) => (
                  <option key={recipe._id} value={recipe._id}>
                    {recipe.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faFilter} className="mr-2" />
                Filter by Rating
              </label>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-saveful-green"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faSearch} className="mr-2" />
                Search
              </label>
              <input
                type="text"
                placeholder="Search by recipe, user, or review..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-saveful-green"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-saveful-green to-saveful-green/80 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Feedbacks</p>
                <p className="text-3xl font-bold mt-1">{feedbacks.length}</p>
              </div>
              <FontAwesomeIcon icon={faComments} className="h-10 w-10 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-saveful-orange to-saveful-orange/80 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">With Ratings</p>
                <p className="text-3xl font-bold mt-1">
                  {feedbacks.filter((f) => f.data?.rating).length}
                </p>
              </div>
              <FontAwesomeIcon icon={faStar} className="h-10 w-10 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-saveful-purple to-saveful-purple/80 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">With Reviews</p>
                <p className="text-3xl font-bold mt-1">
                  {feedbacks.filter((f) => f.data?.review).length}
                </p>
              </div>
              <FontAwesomeIcon icon={faComments} className="h-10 w-10 opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Feedbacks List */}
        {loadingData ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saveful-green"></div>
            <span className="ml-3 text-gray-600">Loading feedbacks...</span>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FontAwesomeIcon
              icon={faComments}
              className="h-16 w-16 text-gray-300 mb-4"
            />
            <p className="text-gray-500 text-lg">No feedbacks found</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredFeedbacks.map((feedback, index) => (
                <motion.div
                  key={feedback._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Left Section - Recipe & User Info */}
                      <div className="flex items-start gap-4 flex-1">
                        {/* Recipe Image */}
                        {feedback.recipe?.heroImageUrl && (
                          <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={feedback.recipe.heroImageUrl}
                              alt={feedback.recipe.title || "Recipe"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        {/* Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            {feedback.recipe?.title || "Unknown Recipe"}
                          </h3>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                              <span>{feedback.user?.name || "Anonymous"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
                              <span>{formatDate(feedback.createdAt)}</span>
                            </div>
                          </div>

                          {/* Rating */}
                          <div className="mb-3">
                            {renderStars(feedback.data?.rating)}
                          </div>

                          {/* Review */}
                          {feedback.data?.review && (
                            <div className="bg-gray-50 rounded-lg p-4 mt-3">
                              <p className="text-gray-700 text-sm leading-relaxed">
                                &ldquo;{feedback.data.review}&rdquo;
                              </p>
                            </div>
                          )}

                          {/* Additional Info */}
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            {feedback.data?.did_you_like_it !== undefined && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-600">Liked:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  feedback.data.did_you_like_it
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}>
                                  {feedback.data.did_you_like_it ? "Yes" : "No"}
                                </span>
                              </div>
                            )}
                            
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="ml-4">
                        <button
                          onClick={() => openDeleteModal(feedback)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete feedback"
                        >
                          <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={closeDeleteModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <FontAwesomeIcon
                      icon={faTrash}
                      className="h-6 w-6 text-red-600"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Delete Feedback
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to delete this feedback? This action cannot be
                    undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={closeDeleteModal}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteFeedback}
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}
