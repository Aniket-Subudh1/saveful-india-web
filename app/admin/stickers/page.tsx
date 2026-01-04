"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import {
  stickerManagementService,
  Sticker,
  CreateStickerDto,
} from "@/services/stickerManagementService";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faTimes,
  faUpload,
  faImage,
  faSave,
} from "@fortawesome/free-solid-svg-icons";

export default function StickersPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSticker, setEditingSticker] = useState<Sticker | null>(null);
  const [stickerToDelete, setStickerToDelete] = useState<Sticker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const descriptionRef = useRef<HTMLDivElement>(null);

  const [stickerForm, setStickerForm] = useState<CreateStickerDto>({
    title: "",
    description: "",
  });

  useEffect(() => {
    if (!isLoading && user) {
      loadData();
    }
  }, [isLoading, user]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const data = await stickerManagementService.getAll();
      setStickers(data);
    } catch (error: any) {
      console.error("Failed to load stickers:", error);
      alert(error?.message || "Failed to load stickers. Please refresh the page.");
    } finally {
      setLoadingData(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const description = descriptionRef.current?.innerHTML || "";
      
      const submissionData: CreateStickerDto = {
        title: stickerForm.title,
        description: description,
        image: stickerForm.image,
      };

      if (editingSticker) {
        await stickerManagementService.update(editingSticker.id, submissionData);
      } else {
        await stickerManagementService.create(submissionData);
      }

      resetForm();
      setShowModal(false);
      await loadData();
    } catch (error: any) {
      console.error("Failed to save sticker:", error);
      alert(error?.message || "Failed to save sticker");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (sticker: Sticker) => {
    setEditingSticker(sticker);
    setStickerForm({
      title: sticker.title,
      description: sticker.description || "",
    });
    setImagePreview(sticker.imageUrl);
    setShowModal(true);
    
    // Set description HTML after modal opens
    setTimeout(() => {
      if (descriptionRef.current) {
        descriptionRef.current.innerHTML = sticker.description || "";
      }
    }, 100);
  };

  const handleDelete = async () => {
    if (!stickerToDelete) return;

    setIsSubmitting(true);
    try {
      await stickerManagementService.delete(stickerToDelete.id);
      setShowDeleteModal(false);
      setStickerToDelete(null);
      await loadData();
    } catch (error: any) {
      console.error("Failed to delete sticker:", error);
      alert(error?.message || "Failed to delete sticker");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingSticker(null);
    setStickerForm({
      title: "",
      description: "",
    });
    setImagePreview(null);
    if (descriptionRef.current) {
      descriptionRef.current.innerHTML = "";
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStickerForm({ ...stickerForm, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    descriptionRef.current?.focus();
  };

  const filteredStickers = stickers.filter((sticker) =>
    sticker.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <svg className="h-96 w-96" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EC4899" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,72.8,41.7C64.2,54.2,52.6,64.6,39.1,71.8C25.6,79,10.2,83,-5.6,83.3C-21.4,83.6,-42.8,80.2,-58.3,71.2C-73.8,62.2,-83.4,47.6,-87.7,31.8C-92,16,-91,-1,-84.9,-16.2C-78.8,-31.4,-67.6,-44.8,-54.2,-52.4C-40.8,-60,-25.2,-61.8,-10.4,-64.8C4.4,-67.8,8.8,-72,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-saveful-bold text-3xl text-gray-900 md:text-4xl">
                Stickers Management
              </h1>
              <p className="mt-2 font-saveful text-sm text-gray-600">
                Create and manage stickers for the app
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-2.5 font-saveful-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              <FontAwesomeIcon icon={faPlus} />
              New Sticker
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search stickers by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 font-saveful shadow-sm transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
          </div>

          {/* Stickers Grid */}
          <div className="space-y-4">
            {loadingData ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
                <p className="mt-4 font-saveful text-gray-500">Loading stickers...</p>
              </div>
            ) : filteredStickers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-16">
                <div className="mb-4 rounded-full bg-pink-100 p-6">
                  <FontAwesomeIcon icon={faImage} className="h-12 w-12 text-pink-500" />
                </div>
                <h3 className="font-saveful-bold text-lg text-gray-700">
                  {searchQuery ? "No stickers match your search" : "No stickers yet"}
                </h3>
                <p className="mt-2 font-saveful text-sm text-gray-500">
                  {searchQuery ? "Try a different search term" : "Click 'New Sticker' to create your first sticker"}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredStickers.map((sticker, index) => (
                  <motion.div
                    key={sticker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-xl"
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-pink-100 to-pink-50">
                      {sticker.imageUrl ? (
                        <Image
                          src={sticker.imageUrl}
                          alt={sticker.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FontAwesomeIcon icon={faImage} className="h-16 w-16 text-pink-300" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="mb-2 font-saveful-bold text-lg text-gray-900 line-clamp-2">
                        {sticker.title}
                      </h3>
                      {sticker.description && (
                        <div
                          className="font-saveful text-sm text-gray-600 line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: sticker.description }}
                        />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 border-t border-gray-100 p-3">
                      <button
                        onClick={() => handleEdit(sticker)}
                        className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 py-2 font-saveful-semibold text-sm text-white shadow transition hover:shadow-md"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setStickerToDelete(sticker);
                          setShowDeleteModal(true);
                        }}
                        className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 py-2 font-saveful-semibold text-sm text-white shadow transition hover:shadow-md"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
              onClick={() => !isSubmitting && setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/10 p-3">
                        <FontAwesomeIcon icon={faImage} className="h-6 w-6 text-pink-500" />
                      </div>
                      <h2 className="font-saveful-bold text-2xl text-gray-900">
                        {editingSticker ? "Edit Sticker" : "Create New Sticker"}
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      disabled={isSubmitting}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
                  <div className="space-y-5">
                    {/* Title */}
                    <div>
                      <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={stickerForm.title}
                        onChange={(e) =>
                          setStickerForm({ ...stickerForm, title: e.target.value })
                        }
                        required
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 font-saveful transition-all focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                        placeholder="Enter sticker title"
                      />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                        Sticker Image
                      </label>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="sticker-image-upload"
                        />
                        <label
                          htmlFor="sticker-image-upload"
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition-all hover:border-pink-500 hover:bg-pink-50"
                        >
                          <FontAwesomeIcon icon={faUpload} className="text-pink-500" />
                          <span className="font-saveful text-sm text-gray-600">
                            {imagePreview ? "Change Image" : "Upload Image"}
                          </span>
                        </label>
                        {imagePreview && (
                          <div className="relative h-48 w-full overflow-hidden rounded-xl border-2 border-gray-200">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description with Rich Text */}
                    <div>
                      <label className="mb-2 block font-saveful-semibold text-sm text-gray-700">
                        Description
                      </label>
                      
                      {/* Text Formatting Toolbar */}
                      <div className="mb-2 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                        <button
                          type="button"
                          onClick={() => execCommand("bold")}
                          className="rounded px-3 py-1.5 font-saveful-bold text-sm hover:bg-gray-200"
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => execCommand("italic")}
                          className="rounded px-3 py-1.5 font-saveful text-sm italic hover:bg-gray-200"
                          title="Italic"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => execCommand("underline")}
                          className="rounded px-3 py-1.5 font-saveful text-sm underline hover:bg-gray-200"
                          title="Underline"
                        >
                          U
                        </button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <button
                          type="button"
                          onClick={() => execCommand("insertUnorderedList")}
                          className="rounded px-3 py-1.5 font-saveful text-sm hover:bg-gray-200"
                          title="Bullet List"
                        >
                          • List
                        </button>
                        <button
                          type="button"
                          onClick={() => execCommand("insertOrderedList")}
                          className="rounded px-3 py-1.5 font-saveful text-sm hover:bg-gray-200"
                          title="Numbered List"
                        >
                          1. List
                        </button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <button
                          type="button"
                          onClick={() => execCommand("createLink", prompt("Enter URL:") || "")}
                          className="rounded px-3 py-1.5 font-saveful text-sm hover:bg-gray-200"
                          title="Insert Link"
                        >
                          🔗 Link
                        </button>
                      </div>

                      {/* Rich Text Editor */}
                      <div
                        ref={descriptionRef}
                        contentEditable
                        className="min-h-[200px] w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-saveful text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                        onBlur={(e) => {
                          setStickerForm({ ...stickerForm, description: e.currentTarget.innerHTML });
                        }}
                        style={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "break-word",
                        }}
                      />
                      <p className="mt-1 font-saveful text-xs text-gray-500">
                        Use the toolbar above to format your description
                      </p>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          resetForm();
                        }}
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl border-2 border-gray-200 py-3 font-saveful-semibold text-gray-700 transition-all hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 py-3 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="mr-2">●</span>
                            {editingSticker ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faSave} className="mr-2" />
                            {editingSticker ? "Update Sticker" : "Create Sticker"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-red-100 p-4">
                    <FontAwesomeIcon icon={faTrash} className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h3 className="mb-2 text-center font-saveful-bold text-xl text-gray-900">
                  Delete Sticker?
                </h3>
                <p className="mb-6 text-center font-saveful text-sm text-gray-600">
                  Are you sure you want to delete "{stickerToDelete?.title}"? This action cannot be
                  undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 font-saveful-semibold text-gray-700 transition-all hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 py-2.5 font-saveful-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
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
