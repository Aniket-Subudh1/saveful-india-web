"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  sponsorManagementService,
  Sponsor,
  CreateSponsorDto,
} from "@/services/sponsorManagementService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTimes,
  faSave,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

export default function SponsorsPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [sponsorForm, setSponsorForm] = useState({
    title: "",
    broughtToYouBy: "",
    tagline: "",
  });
  const [sponsorImages, setSponsorImages] = useState({
    logo: null as File | null,
    logoBlackAndWhite: null as File | null,
  });
  const [imagePreviews, setImagePreviews] = useState({
    logo: null as string | null,
    logoBlackAndWhite: null as string | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      fetchSponsors();
    }
  }, [isLoading, user]);

  const fetchSponsors = async () => {
    try {
      const data = await sponsorManagementService.getAllSponsors();
      setSponsors(data);
    } catch (error) {
      console.error("Failed to fetch sponsors:", error);
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "logoBlackAndWhite"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setSponsorImages((prev) => ({ ...prev, [type]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => ({
          ...prev,
          [type]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSponsor = async () => {
    try {
      if (!sponsorForm.title) {
        alert("Please fill in the title field");
        return;
      }

      if (!sponsorImages.logo || !sponsorImages.logoBlackAndWhite) {
        alert("Please upload both logo and black & white logo");
        return;
      }

      setIsSubmitting(true);

      console.log("Preparing to create sponsor:", {
        title: sponsorForm.title,
        broughtToYouBy: sponsorForm.broughtToYouBy,
        tagline: sponsorForm.tagline,
        hasLogo: !!sponsorImages.logo,
        hasLogoBlackAndWhite: !!sponsorImages.logoBlackAndWhite,
      });

      const createDto: CreateSponsorDto = {
        title: sponsorForm.title,
        broughtToYouBy: sponsorForm.broughtToYouBy || undefined,
        tagline: sponsorForm.tagline || undefined,
        logo: sponsorImages.logo,
        logoBlackAndWhite: sponsorImages.logoBlackAndWhite,
      };

      const result = await sponsorManagementService.createSponsor(createDto);
      console.log("Sponsor created result:", result);

      // Reset form
      setSponsorForm({
        title: "",
        broughtToYouBy: "",
        tagline: "",
      });
      setSponsorImages({ logo: null, logoBlackAndWhite: null });
      setImagePreviews({ logo: null, logoBlackAndWhite: null });
      setShowModal(false);

      // Refresh sponsors list
      await fetchSponsors();

      alert("Sponsor created successfully!");
    } catch (error: any) {
      console.error("Failed to create sponsor:", {
        error,
        message: error?.message,
        response: error?.response,
        data: error?.response?.data,
        status: error?.response?.status,
      });
      
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        (error?.response?.status === 401 ? "Session expired. Please login again." : "Failed to create sponsor. Please check the console for details.");
      
      alert(errorMessage);
      
      // If session expired, redirect to login
      if (error?.response?.status === 401 || error?.message?.includes("token")) {
        router.push("/admin/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
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
                Sponsors Management
              </h1>
              <p className="mt-2 font-saveful text-sm text-gray-600">
                Manage sponsors that can be linked to hacks
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg bg-saveful-orange px-4 py-2.5 font-saveful-semibold text-white shadow-lg transition hover:bg-orange-600 hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faPlus} />
              New Sponsor
            </button>
          </div>

          {/* Sponsors Grid */}
          {sponsors.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <FontAwesomeIcon icon={faPlus} className="h-8 w-8 text-saveful-orange" />
              </div>
              <h3 className="mb-2 font-saveful-semibold text-lg text-gray-800">No sponsors yet</h3>
              <p className="mb-4 font-saveful text-sm text-gray-600">
                Get started by creating your first sponsor
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="font-saveful-semibold text-saveful-orange hover:underline"
              >
                Create your first sponsor
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {sponsors.map((sponsor) => (
                  <motion.div
                    key={sponsor._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ y: -4 }}
                    className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-md transition-shadow hover:shadow-xl"
                  >
                    <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y-[-16px] transform opacity-10">
                      <svg viewBox="0 0 100 100" className="text-saveful-orange">
                        <circle cx="50" cy="50" r="40" fill="currentColor" />
                      </svg>
                    </div>

                    <div className="relative space-y-4">
                      {/* Logos */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative h-20 overflow-hidden rounded-lg border border-gray-100 bg-white p-2">
                          <Image
                            src={sponsor.logo}
                            alt={sponsor.title}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-20 overflow-hidden rounded-lg border border-gray-800 bg-gray-900 p-2">
                          <Image
                            src={sponsor.logoBlackAndWhite}
                            alt={`${sponsor.title} B&W`}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="font-saveful-bold text-lg text-gray-900">
                          {sponsor.title}
                        </h3>
                        <p className="font-saveful text-sm text-gray-600">
                          {sponsor.broughtToYouBy}
                        </p>
                        <p className="font-saveful text-sm italic text-gray-500">
                          "{sponsor.tagline}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Create Sponsor Modal */}
      <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-8 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-saveful-bold text-2xl text-gray-900">
                    Create Sponsor
                  </h2>
                  <button
                    onClick={() => !isSubmitting && setShowModal(false)}
                    disabled={isSubmitting}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sponsorForm.title}
                      onChange={(e) =>
                        setSponsorForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Sponsor name"
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 font-saveful transition-colors focus:border-saveful-orange focus:outline-none focus:ring-2 focus:ring-saveful-orange/20"
                    />
                  </div>

                  {/* Brought To You By */}
                  <div>
                    <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                      Brought To You By
                    </label>
                    <input
                      type="text"
                      value={sponsorForm.broughtToYouBy}
                      onChange={(e) =>
                        setSponsorForm((prev) => ({
                          ...prev,
                          broughtToYouBy: e.target.value,
                        }))
                      }
                      placeholder="e.g., Brought to you by..."
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 font-saveful transition-colors focus:border-saveful-orange focus:outline-none focus:ring-2 focus:ring-saveful-orange/20"
                    />
                  </div>

                  {/* Tagline */}
                  <div>
                    <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={sponsorForm.tagline}
                      onChange={(e) =>
                        setSponsorForm((prev) => ({
                          ...prev,
                          tagline: e.target.value,
                        }))
                      }
                      placeholder="Sponsor tagline"
                      className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 font-saveful transition-colors focus:border-saveful-orange focus:outline-none focus:ring-2 focus:ring-saveful-orange/20"
                    />
                  </div>

                  {/* Images */}
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                        Logo <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, "logo")}
                          className="w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 font-saveful text-sm transition-colors file:mr-4 file:cursor-pointer file:rounded file:border-0 file:bg-saveful-orange file:px-4 file:py-1.5 file:font-saveful-semibold file:text-white hover:border-saveful-orange focus:border-saveful-orange focus:outline-none"
                        />
                      </div>
                      {imagePreviews.logo && (
                        <div className="relative mt-3 h-28 overflow-hidden rounded-lg border-2 border-gray-100 bg-white p-2">
                          <Image
                            src={imagePreviews.logo}
                            alt="Logo Preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                        Logo (B&W) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageChange(e, "logoBlackAndWhite")
                          }
                          className="w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 font-saveful text-sm transition-colors file:mr-4 file:cursor-pointer file:rounded file:border-0 file:bg-gray-800 file:px-4 file:py-1.5 file:font-saveful-semibold file:text-white hover:border-gray-800 focus:border-gray-800 focus:outline-none"
                        />
                      </div>
                      {imagePreviews.logoBlackAndWhite && (
                        <div className="relative mt-3 h-28 overflow-hidden rounded-lg border-2 border-gray-800 bg-gray-900 p-2">
                          <Image
                            src={imagePreviews.logoBlackAndWhite}
                            alt="B&W Logo Preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6">
                    <button
                      onClick={() => !isSubmitting && setShowModal(false)}
                      disabled={isSubmitting}
                      className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 font-saveful-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateSponsor}
                      disabled={isSubmitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-saveful-green px-4 py-2.5 font-saveful-semibold text-white shadow-lg transition-all hover:bg-green-600 hover:shadow-xl disabled:opacity-50 disabled:shadow-none"
                    >
                      <FontAwesomeIcon icon={faSave} />
                      {isSubmitting ? "Creating..." : "Create Sponsor"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
