"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { badgeManagementService, BadgeCategory, MilestoneType, MetricType, Badge } from "@/services/badgeManagementService";
import { authService } from "@/services/authService";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSave,
  faUpload,
  faInfoCircle,
  faAward,
  faUserGraduate,
  faMobileAlt,
  faUtensils,
  faPiggyBank,
  faLeaf,
  faClipboardList,
  faGift,
  faHandshake,
  faTrophy,
  faStar,
  faGlobe,
  faCalendar,
  faTag,
  faLink,
  faFileAlt,
  faPalette,
  faCheckCircle,
  faBullseye,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";

const BADGE_CATEGORIES = [
  { value: BadgeCategory.ONBOARDING, label: "Onboarding", description: "First-time achievements", icon: faUserGraduate, color: "#4CAF50" },
  { value: BadgeCategory.USAGE, label: "Usage", description: "App session milestones", icon: faMobileAlt, color: "#2196F3" },
  { value: BadgeCategory.COOKING, label: "Cooking", description: "Recipe cooking achievements", icon: faUtensils, color: "#FF9800" },
  { value: BadgeCategory.MONEY_SAVED, label: "Money Saved", description: "Cumulative savings", icon: faPiggyBank, color: "#4CAF50" },
  { value: BadgeCategory.FOOD_SAVED, label: "Food Saved", description: "Waste reduction achievements", icon: faLeaf, color: "#8BC34A" },
  { value: BadgeCategory.PLANNING, label: "Planning", description: "Shopping list creation", icon: faClipboardList, color: "#9C27B0" },
  { value: BadgeCategory.BONUS, label: "Bonus", description: "Special achievements", icon: faGift, color: "#FF5722" },
  { value: BadgeCategory.SPONSOR, label: "Sponsor", description: "Partner badges", icon: faHandshake, color: "#E91E63" },
  { value: BadgeCategory.CHALLENGE_WINNER, label: "Challenge Winner", description: "Competition winners", icon: faTrophy, color: "#FFC107" },
  { value: BadgeCategory.SPECIAL, label: "Special", description: "Unique events", icon: faStar, color: "#00BCD4" },
];

const MILESTONE_TYPES = [
  { value: MilestoneType.FIRST_RECIPE_COOKED, label: "First Recipe Cooked", category: BadgeCategory.ONBOARDING, threshold: 1 },
  
  { value: MilestoneType.TOTAL_APP_SESSIONS_3, label: "3 App Sessions", category: BadgeCategory.USAGE, threshold: 3 },
  { value: MilestoneType.TOTAL_APP_SESSIONS_7, label: "7 App Sessions", category: BadgeCategory.USAGE, threshold: 7 },
  { value: MilestoneType.TOTAL_APP_SESSIONS_20, label: "20 App Sessions", category: BadgeCategory.USAGE, threshold: 20 },
  { value: MilestoneType.TOTAL_APP_SESSIONS_50, label: "50 App Sessions", category: BadgeCategory.USAGE, threshold: 50 },
  
  { value: MilestoneType.RECIPES_COOKED_5, label: "5 Recipes Cooked", category: BadgeCategory.COOKING, threshold: 5 },
  { value: MilestoneType.RECIPES_COOKED_10, label: "10 Recipes Cooked", category: BadgeCategory.COOKING, threshold: 10 },
  { value: MilestoneType.RECIPES_COOKED_25, label: "25 Recipes Cooked", category: BadgeCategory.COOKING, threshold: 25 },
  { value: MilestoneType.RECIPES_COOKED_50, label: "50 Recipes Cooked", category: BadgeCategory.COOKING, threshold: 50 },
  
  { value: MilestoneType.MONEY_SAVED_25, label: "$25 Saved", category: BadgeCategory.MONEY_SAVED, threshold: 25 },
  { value: MilestoneType.MONEY_SAVED_50, label: "$50 Saved", category: BadgeCategory.MONEY_SAVED, threshold: 50 },
  { value: MilestoneType.MONEY_SAVED_100, label: "$100 Saved", category: BadgeCategory.MONEY_SAVED, threshold: 100 },
  { value: MilestoneType.MONEY_SAVED_250, label: "$250 Saved", category: BadgeCategory.MONEY_SAVED, threshold: 250 },
  { value: MilestoneType.MONEY_SAVED_500, label: "$500 Saved", category: BadgeCategory.MONEY_SAVED, threshold: 500 },
  
  // Food Saved
  { value: MilestoneType.FIRST_FOOD_SAVED, label: "First Food Saved", category: BadgeCategory.FOOD_SAVED, threshold: 1 },
  { value: MilestoneType.FOOD_SAVED_5KG, label: "5kg Food Saved", category: BadgeCategory.FOOD_SAVED, threshold: 5 },
  { value: MilestoneType.FOOD_SAVED_10KG, label: "10kg Food Saved", category: BadgeCategory.FOOD_SAVED, threshold: 10 },
  { value: MilestoneType.FOOD_SAVED_15KG, label: "15kg Food Saved", category: BadgeCategory.FOOD_SAVED, threshold: 15 },
  { value: MilestoneType.FOOD_SAVED_20KG, label: "20kg Food Saved", category: BadgeCategory.FOOD_SAVED, threshold: 20 },
  
  // Planning
  { value: MilestoneType.SHOPPING_LIST_1, label: "1 Shopping List", category: BadgeCategory.PLANNING, threshold: 1 },
  { value: MilestoneType.SHOPPING_LIST_5, label: "5 Shopping Lists", category: BadgeCategory.PLANNING, threshold: 5 },
  { value: MilestoneType.SHOPPING_LIST_10, label: "10 Shopping Lists", category: BadgeCategory.PLANNING, threshold: 10 },
  { value: MilestoneType.SHOPPING_LIST_25, label: "25 Shopping Lists", category: BadgeCategory.PLANNING, threshold: 25 },
  
  // Bonus
  { value: MilestoneType.WEEKDAY_MEALS_5, label: "5 Weekday Meals", category: BadgeCategory.BONUS, threshold: 5 },
];

const METRIC_TYPES = [
  { value: MetricType.RECIPES_COOKED, label: "Recipes Cooked", unit: "recipes" },
  { value: MetricType.APP_SESSIONS, label: "App Sessions", unit: "sessions" },
  { value: MetricType.MONEY_SAVED_CUMULATIVE, label: "Money Saved", unit: "$" },
  { value: MetricType.FOOD_WEIGHT_SAVED, label: "Food Weight Saved", unit: "kg" },
  { value: MetricType.SHOPPING_LISTS_CREATED, label: "Shopping Lists", unit: "lists" },
  { value: MetricType.WEEKDAY_MEALS_COOKED, label: "Weekday Meals", unit: "meals" },
  { value: MetricType.FIRST_EVENT, label: "First Event", unit: "event" },
];

const COUNTRIES = [
  { code: "AU", name: "Australia", icon: faGlobe },
  { code: "IN", name: "India", icon: faGlobe },
  { code: "NZ", name: "New Zealand", icon: faGlobe },
  { code: "US", name: "United States", icon: faGlobe },
  { code: "GB", name: "United Kingdom", icon: faGlobe },
  { code: "CA", name: "Canada", icon: faGlobe },
];

export default function CreateEditBadgePage() {
  const router = useRouter();
  const params = useParams();
  const badgeId = params?.id as string;
  const isEdit = !!badgeId;
  
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sponsorLogoFile, setSponsorLogoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [sponsorLogoPreview, setSponsorLogoPreview] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: BadgeCategory.ONBOARDING,
    milestoneType: "" as MilestoneType | "",
    milestoneThreshold: 0,
    metricType: "" as MetricType | "",
    rarityScore: 0,
    iconColor: "#4CAF50",
    isActive: true,
    isSponsorBadge: false,
    sponsorName: "",
    sponsorCountries: [] as string[],
    sponsorValidFrom: "",
    sponsorValidUntil: "",
    sponsorCampaignId: "",
    sponsorRedemptionCode: "",
    sponsorLink: "",
    sponsorTerms: "",
  });

  useEffect(() => {
    if (!isLoading && user && isEdit) {
      loadBadge();
    }
  }, [isLoading, user, badgeId, isEdit]);

  useEffect(() => {
    const category = formData.category;
    const categoryConfig = BADGE_CATEGORIES.find(c => c.value === category);
    
    const colors: Record<BadgeCategory, string> = {
      [BadgeCategory.ONBOARDING]: "#4CAF50",
      [BadgeCategory.USAGE]: "#2196F3",
      [BadgeCategory.COOKING]: "#FF9800",
      [BadgeCategory.MONEY_SAVED]: "#4CAF50",
      [BadgeCategory.FOOD_SAVED]: "#8BC34A",
      [BadgeCategory.PLANNING]: "#9C27B0",
      [BadgeCategory.BONUS]: "#FF5722",
      [BadgeCategory.SPONSOR]: "#E91E63",
      [BadgeCategory.CHALLENGE_WINNER]: "#FFC107",
      [BadgeCategory.SPECIAL]: "#00BCD4",
    };
    
    if (!formData.iconColor || formData.iconColor === "#4CAF50") {
      setFormData(prev => ({ ...prev, iconColor: colors[category] }));
    }
  }, [formData.category]);

  const loadBadge = async () => {
    try {
      setLoading(true);
      const badge = await badgeManagementService.getBadgeById(badgeId);
      setFormData({
        name: badge.name,
        description: badge.description,
        category: badge.category,
        milestoneType: badge.milestoneType || "",
        milestoneThreshold: badge.milestoneThreshold || 0,
        metricType: badge.metricType || "",
        rarityScore: badge.rarityScore || 0,
        iconColor: badge.iconColor || "#4CAF50",
        isActive: badge.isActive,
        isSponsorBadge: badge.isSponsorBadge || false,
        sponsorName: badge.sponsorName || "",
        sponsorCountries: badge.sponsorCountries || [],
        sponsorValidFrom: badge.sponsorValidFrom ? new Date(badge.sponsorValidFrom).toISOString().split('T')[0] : "",
        sponsorValidUntil: badge.sponsorValidUntil ? new Date(badge.sponsorValidUntil).toISOString().split('T')[0] : "",
        sponsorCampaignId: badge.sponsorMetadata?.campaignId || "",
        sponsorRedemptionCode: badge.sponsorMetadata?.redemptionCode || "",
        sponsorLink: badge.sponsorMetadata?.sponsorLink || "",
        sponsorTerms: badge.sponsorMetadata?.termsAndConditions || "",
      });
      if (badge.imageUrl) setImagePreview(badge.imageUrl);
      if (badge.sponsorLogoUrl) setSponsorLogoPreview(badge.sponsorLogoUrl);
    } catch (error) {
      console.error("Error loading badge:", error);
      alert("Failed to load badge");
      router.push("/admin/badges");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'badge' | 'sponsor') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'badge') {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        setSponsorLogoFile(file);
        setSponsorLogoPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      
      const badgeData: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        milestoneType: formData.milestoneType || undefined,
        milestoneThreshold: formData.milestoneThreshold || undefined,
        metricType: formData.metricType || undefined,
        rarityScore: formData.rarityScore,
        iconColor: formData.iconColor,
        isActive: formData.isActive,
        isSponsorBadge: formData.isSponsorBadge,
      };

      if (formData.isSponsorBadge) {
        badgeData.sponsorName = formData.sponsorName;
        badgeData.sponsorCountries = formData.sponsorCountries;
        badgeData.sponsorValidFrom = formData.sponsorValidFrom;
        badgeData.sponsorValidUntil = formData.sponsorValidUntil;
        badgeData.sponsorMetadata = {
          campaignId: formData.sponsorCampaignId,
          redemptionCode: formData.sponsorRedemptionCode,
          sponsorLink: formData.sponsorLink,
          termsAndConditions: formData.sponsorTerms,
        };
      }

      if (isEdit) {
        await badgeManagementService.updateBadge(badgeId, badgeData, imageFile || undefined, sponsorLogoFile || undefined);
      } else {
        await badgeManagementService.createBadge(badgeData, imageFile || undefined, sponsorLogoFile || undefined);
      }

      router.push("/admin/badges");
    } catch (error: any) {
      console.error("Error saving badge:", error);
      alert(error?.response?.data?.message || "Failed to save badge");
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (code: string) => {
    setFormData(prev => ({
      ...prev,
      sponsorCountries: prev.sponsorCountries.includes(code)
        ? prev.sponsorCountries.filter(c => c !== code)
        : [...prev.sponsorCountries, code]
    }));
  };

  const filteredMilestones = MILESTONE_TYPES.filter(m => m.category === formData.category);

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
      <div className="relative h-full overflow-y-auto bg-gradient-to-br from-gray-50 via-saveful-cream/20 to-gray-50 p-4 md:p-8">
        {/* Decorative Background */}
        <div className="pointer-events-none absolute right-0 top-0 opacity-5">
          <Image
            src="/Illustration@2x.png"
            alt="Decoration"
            width={500}
            height={500}
            className="object-contain"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link href="/admin/badges">
              <Button variant="outline" className="mb-4 font-saveful">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                Back to Badges
              </Button>
            </Link>
            <h1 className="text-3xl font-saveful-bold text-gray-900">
              {isEdit ? "Edit Badge" : "Create New Badge"}
            </h1>
            <p className="text-gray-600 mt-2 font-saveful">
              {isEdit ? "Update badge details and settings" : "Create a new achievement badge for users"}
            </p>
          </motion.div>

      <form onSubmit={handleSubmit}>
        <Card className="p-8">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-saveful-bold text-gray-900 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faAward} className="h-5 w-5 text-saveful-green" />
              Basic Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                  Badge Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., First Plate, Kitchen Confident"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                />
                <p className="text-sm text-gray-500 mt-1 font-saveful">User-facing name that appears in the app</p>
              </div>

              <div>
                <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., First successful Saveful cook"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                />
                <p className="text-sm text-gray-500 mt-1 font-saveful">What this badge celebrates</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as BadgeCategory, milestoneType: "", metricType: "" })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                  >
                    {BADGE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1 font-saveful">
                    {BADGE_CATEGORIES.find(c => c.value === formData.category)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faPalette} className="mr-2" />
                    Badge Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.iconColor}
                      onChange={(e) => setFormData({ ...formData, iconColor: e.target.value })}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.iconColor}
                      onChange={(e) => setFormData({ ...formData, iconColor: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-saveful">Color theme for this badge</p>
                </div>
              </div>
            </div>
          </div>

          {/* Achievement Criteria */}
          {formData.category !== BadgeCategory.SPONSOR && formData.category !== BadgeCategory.SPECIAL && (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-xl font-saveful-bold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faBullseye} className="h-5 w-5 text-saveful-green" />
                Achievement Criteria
              </h2>
              
              <div className="space-y-6">
                {filteredMilestones.length > 0 && (
                  <div>
                    <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                      Milestone Type (Optional)
                    </label>
                    <select
                      value={formData.milestoneType}
                      onChange={(e) => {
                        const selected = filteredMilestones.find(m => m.value === e.target.value);
                        setFormData({ 
                          ...formData, 
                          milestoneType: e.target.value as MilestoneType,
                          milestoneThreshold: selected?.threshold || 0
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                    >
                      <option value="">Select a milestone...</option>
                      {filteredMilestones.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                      Metric Type
                    </label>
                    <select
                      value={formData.metricType}
                      onChange={(e) => setFormData({ ...formData, metricType: e.target.value as MetricType })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                    >
                      <option value="">Select metric...</option>
                      {METRIC_TYPES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label} ({m.unit})
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1 font-saveful">What to track for auto-awarding</p>
                  </div>

                  <div>
                    <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                      Threshold Value
                    </label>
                    <input
                      type="number"
                      value={formData.milestoneThreshold}
                      onChange={(e) => setFormData({ ...formData, milestoneThreshold: parseInt(e.target.value) || 0 })}
                      min="0"
                      placeholder="e.g., 10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                    />
                    <p className="text-sm text-gray-500 mt-1 font-saveful">Target value to earn badge</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                    Rarity Score (0-100)
                  </label>
                  <input
                    type="number"
                    value={formData.rarityScore}
                    onChange={(e) => setFormData({ ...formData, rarityScore: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-saveful-green h-2 rounded-full transition-all"
                        style={{ width: `${formData.rarityScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-saveful font-medium text-gray-700">{formData.rarityScore}%</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-saveful">Higher = more rare/valuable</p>
                </div>
              </div>
            </div>
          )}

          {/* Sponsor Badge Section */}
          <div className="mb-8 pb-8 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-saveful-bold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faHandshake} className="h-5 w-5 text-pink-500" />
                Sponsor Badge
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isSponsorBadge}
                  onChange={(e) => setFormData({ ...formData, isSponsorBadge: e.target.checked })}
                  className="w-5 h-5 text-saveful-green rounded focus:ring-2 focus:ring-saveful-green"
                />
                <span className="text-sm font-saveful font-medium text-gray-700">This is a sponsor badge</span>
              </label>
            </div>

            {formData.isSponsorBadge && (
              <div className="space-y-6 bg-pink-50 p-6 rounded-lg">
                <div>
                  <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faTag} className="mr-2" />
                    Sponsor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={formData.isSponsorBadge}
                    value={formData.sponsorName}
                    onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                    placeholder="e.g., Qantas, Woolworths"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                  />
                </div>

                <div>
                  <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faGlobe} className="mr-2" />
                    Available Countries
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {COUNTRIES.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => toggleCountry(country.code)}
                        className={`p-3 rounded-lg border-2 transition-all font-saveful ${
                          formData.sponsorCountries.includes(country.code)
                            ? "border-saveful-green bg-green-50 text-green-900"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <FontAwesomeIcon icon={country.icon} className="text-2xl mb-1 block" />
                        <span className="text-sm font-medium">{country.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2 font-saveful">Select countries where this sponsor badge is available</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                      Valid From
                    </label>
                    <input
                      type="date"
                      value={formData.sponsorValidFrom}
                      onChange={(e) => setFormData({ ...formData, sponsorValidFrom: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                      Valid Until
                    </label>
                    <input
                      type="date"
                      value={formData.sponsorValidUntil}
                      onChange={(e) => setFormData({ ...formData, sponsorValidUntil: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                      Campaign ID
                    </label>
                    <input
                      type="text"
                      value={formData.sponsorCampaignId}
                      onChange={(e) => setFormData({ ...formData, sponsorCampaignId: e.target.value })}
                      placeholder="e.g., QANTAS_2026_Q1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                      Redemption Code
                    </label>
                    <input
                      type="text"
                      value={formData.sponsorRedemptionCode}
                      onChange={(e) => setFormData({ ...formData, sponsorRedemptionCode: e.target.value })}
                      placeholder="e.g., SAVEFUL2026"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faLink} className="mr-2" />
                    Sponsor Link
                  </label>
                  <input
                    type="url"
                    value={formData.sponsorLink}
                    onChange={(e) => setFormData({ ...formData, sponsorLink: e.target.value })}
                    placeholder="https://sponsor.com/saveful"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                  />
                </div>

                <div>
                  <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                    Terms and Conditions
                  </label>
                  <textarea
                    value={formData.sponsorTerms}
                    onChange={(e) => setFormData({ ...formData, sponsorTerms: e.target.value })}
                    placeholder="Enter sponsor terms and conditions..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saveful-green focus:border-transparent font-saveful"
                  />
                </div>

                <div>
                  <label className="block text-sm font-saveful font-medium text-gray-700 mb-2">
                    Sponsor Logo
                  </label>
                  <div className="flex items-center gap-4">
                    {sponsorLogoPreview && (
                      <div className="w-24 h-24 border-2 border-gray-300 rounded-lg overflow-hidden">
                        <img src={sponsorLogoPreview} alt="Sponsor logo" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'sponsor')}
                        className="hidden"
                        id="sponsorLogoUpload"
                      />
                      <label
                        htmlFor="sponsorLogoUpload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-saveful"
                      >
                        <FontAwesomeIcon icon={faUpload} className="mr-2" />
                        Upload Sponsor Logo
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Badge Image */}
          <div className="mb-8 pb-8 border-b">
            <h2 className="text-xl font-saveful-bold text-gray-900 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faUpload} className="h-5 w-5 text-saveful-green" />
              Badge Image
            </h2>
            
            <div className="flex items-start gap-6">
              {imagePreview && (
                <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={imagePreview} alt="Badge preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'badge')}
                  className="hidden"
                  id="badgeImageUpload"
                />
                <label
                  htmlFor="badgeImageUpload"
                  className="cursor-pointer inline-flex items-center px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-saveful-green hover:bg-green-50 transition-colors font-saveful"
                >
                  <FontAwesomeIcon icon={faUpload} className="mr-2 h-5 w-5" />
                  <div>
                    <p className="font-saveful-bold text-gray-900">Upload Badge Image</p>
                    <p className="text-sm text-gray-500 font-saveful">PNG, JPG up to 2MB</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mb-8">
            <h2 className="text-xl font-saveful-bold text-gray-900 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-saveful-green" />
              Status
            </h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-saveful-green rounded focus:ring-2 focus:ring-saveful-green"
              />
              <div>
                <p className="font-saveful-bold text-gray-900">Badge is active</p>
                <p className="text-sm text-gray-500 font-saveful">Active badges can be earned by users</p>
              </div>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-saveful-green hover:bg-saveful-green/90 text-white font-saveful"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faSave} className="h-4 w-4" />
                  {isEdit ? "Update Badge" : "Create Badge"}
                </span>
              )}
            </Button>
            <Link href="/admin/badges">
              <Button type="button" variant="outline" disabled={loading} className="font-saveful">
                Cancel
              </Button>
            </Link>
          </div>
        </Card>
      </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
