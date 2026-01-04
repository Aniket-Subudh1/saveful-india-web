"use client";
import { useAuth, useCurrentUser } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  hackManagementService,
  Hack,
  HackCategory,
  CreateHackDto,
  ArticleBlock,
  ArticleBlockType,
  TextBlock,
  ListBlock,
  ImageBlock,
  VideoBlock,
} from "@/services/hackManagementService";
import { sponsorManagementService, Sponsor } from "@/services/sponsorManagementService";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAdminSidebarLinks } from "@/config/sidebar";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSave,
  faPlus,
  faFileAlt,
  faImage,
  faVideo,
  faList,
  faChevronDown,
  faTrash,
  faArrowUp,
  faArrowDown,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

export default function EditHackPage() {
  const { isLoading } = useAuth("admin");
  const user = useCurrentUser("admin");
  const router = useRouter();
  const params = useParams();
  const hackId = params.id as string;

  const [categories, setCategories] = useState<HackCategory[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [currentHack, setCurrentHack] = useState<Hack | null>(null);

  const [hackForm, setHackForm] = useState<CreateHackDto>({
    title: "",
    shortDescription: "",
    description: "",
    leadText: "",
    categoryId: "",
    sponsorId: "",
    articleBlocks: [],
  });

  const [hackImages, setHackImages] = useState<{
    thumbnailImage: File | null;
    heroImage: File | null;
  }>({
    thumbnailImage: null,
    heroImage: null,
  });

  const [imagePreviews, setImagePreviews] = useState<{
    thumbnail: string | null;
    hero: string | null;
  }>({
    thumbnail: null,
    hero: null,
  });

  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, File>>({});
  const [videoThumbnailPreviews, setVideoThumbnailPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && user && hackId) {
      fetchData();
    }
  }, [isLoading, user, hackId]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [categoriesData, sponsorsData] = await Promise.all([
        hackManagementService.getAllCategories(),
        sponsorManagementService.getAllSponsors(),
      ]);
      
      console.log('Categories loaded:', categoriesData?.length || 0);
      console.log('Sponsors loaded:', sponsorsData?.length || 0, sponsorsData);
      
      setCategories(categoriesData);
      setSponsors(sponsorsData);

      // Fetch the hack to edit
      const hack = await hackManagementService.getHackById(hackId);
      setCurrentHack(hack);
      
      console.log('Loaded hack data:', {
        sponsorId: hack.sponsorId,
        categoryId: hack.categoryId,
        title: hack.title
      });
      console.log('Available sponsors:', sponsorsData);
      
      // Extract sponsor ID if it's a populated object
      const sponsorIdValue = typeof hack.sponsorId === 'object' && hack.sponsorId !== null 
        ? (hack.sponsorId as any)._id 
        : hack.sponsorId || "";
      
      // Populate form with hack data
      setHackForm({
        title: hack.title || "",
        shortDescription: hack.shortDescription || "",
        description: hack.description || "",
        leadText: hack.leadText || "",
        categoryId: hack.categoryId || "",
        sponsorId: sponsorIdValue,
        articleBlocks: hack.articleBlocks || [],
      });

      // Set image previews from existing URLs
      setImagePreviews({
        thumbnail: hack.thumbnailImageUrl || null,
        hero: hack.heroImageUrl || null,
      });

      // Populate video thumbnail previews from existing data
      if (hack.articleBlocks) {
        const videoThumbnailPreviewsFromServer: Record<string, string> = {};
        hack.articleBlocks.forEach((block) => {
          if (block.type === 'video' && (block as any).videoThumbnail) {
            videoThumbnailPreviewsFromServer[block.id] = (block as any).videoThumbnail;
          }
        });
        if (Object.keys(videoThumbnailPreviewsFromServer).length > 0) {
          setVideoThumbnailPreviews(videoThumbnailPreviewsFromServer);
        }
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      alert("Failed to load hack data. Please try again.");
      router.push("/admin/hacks");
    } finally {
      setLoadingData(false);
    }
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "thumbnail" | "hero"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => ({
          ...prev,
          [type]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);

      setHackImages((prev) => ({
        ...prev,
        [`${type}Image`]: file,
      }));
    }
  };

  const addBlock = (type: ArticleBlockType) => {
    const newBlock: Partial<ArticleBlock> = {
      type,
      id: `block-${Date.now()}`,
    };

    switch (type) {
      case ArticleBlockType.TEXT:
        (newBlock as TextBlock).text = "";
        break;
      case ArticleBlockType.IMAGE:
        (newBlock as ImageBlock).imageUrl = "";
        break;
      case ArticleBlockType.VIDEO:
        (newBlock as VideoBlock).videoUrl = "";
        break;
      case ArticleBlockType.LIST:
        (newBlock as ListBlock).listTitle = "";
        (newBlock as ListBlock).listItems = [];
        break;
    }

    setHackForm((prev) => ({
      ...prev,
      articleBlocks: [...prev.articleBlocks, newBlock as ArticleBlock],
    }));
  };

  const updateBlock = (index: number, updates: Partial<ArticleBlock>) => {
    setHackForm((prev) => ({
      ...prev,
      articleBlocks: prev.articleBlocks.map((block, i) =>
        i === index ? { ...block, ...updates } : block
      ) as ArticleBlock[],
    }));
  };

  const removeBlock = (index: number) => {
    setHackForm((prev) => ({
      ...prev,
      articleBlocks: prev.articleBlocks.filter((_, i) => i !== index),
    }));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= hackForm.articleBlocks.length) return;

    setHackForm((prev) => {
      const newBlocks = [...prev.articleBlocks];
      [newBlocks[index], newBlocks[newIndex]] = [
        newBlocks[newIndex],
        newBlocks[index],
      ];
      return { ...prev, articleBlocks: newBlocks };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await hackManagementService.updateHack(
        hackId,
        hackForm,
        {
          thumbnailImage: hackImages.thumbnailImage || undefined,
          heroImage: hackImages.heroImage || undefined,
        },
        videoThumbnails
      );

      alert("Hack updated successfully!");
      router.push("/admin/hacks");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating hack:", error);
      alert(error?.response?.data?.message || "Failed to update hack");
    } finally {
      setIsSubmitting(false);
    }
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

        <div className="relative z-10 mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/hacks")}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white shadow-sm transition hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div>
              <h1 className="font-saveful-bold text-3xl text-gray-900">Edit Hack</h1>
              <p className="mt-1 font-saveful text-sm text-gray-600">
                Update hack details and content blocks
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
              <h2 className="mb-4 font-saveful-bold text-xl text-gray-900">Basic Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={hackForm.title}
                    onChange={(e) =>
                      setHackForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                    placeholder="Enter hack title"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={hackForm.categoryId}
                    onChange={(e) =>
                      setHackForm((prev) => ({
                        ...prev,
                        categoryId: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                  Short Description
                </label>
                <textarea
                  value={hackForm.shortDescription}
                  onChange={(e) =>
                    setHackForm((prev) => ({
                      ...prev,
                      shortDescription: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                  placeholder="Brief description of the hack"
                />
              </div>

              <div className="mt-4">
                <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                  Lead Text
                </label>
                <RichTextEditor
                  value={hackForm.leadText || ""}
                  onChange={(html) =>
                    setHackForm((prev) => ({
                      ...prev,
                      leadText: html,
                    }))
                  }
                  rows={4}
                  placeholder="Enter lead text with formatting..."
                />
              </div>

              <div className="mt-4">
                <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                  Sponsor (Optional)
                </label>
                <select
                  value={hackForm.sponsorId || ""}
                  onChange={(e) =>
                    setHackForm((prev) => ({
                      ...prev,
                      sponsorId: e.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
                >
                  <option value="">No Sponsor</option>
                  {sponsors.map((sponsor) => (
                    <option key={sponsor._id} value={sponsor._id}>
                      {sponsor.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Images Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
              <h2 className="mb-4 font-saveful-bold text-xl text-gray-900">Images</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                    Thumbnail Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, "thumbnail")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-saveful-green file:px-4 file:py-1 file:text-sm file:text-white hover:file:bg-green-600"
                  />
                  {imagePreviews.thumbnail && (
                    <div className="relative mt-2 h-32 w-full overflow-hidden rounded-lg">
                      <Image
                        src={imagePreviews.thumbnail}
                        alt="Thumbnail Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block font-saveful-semibold text-sm text-gray-700">
                    Hero Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, "hero")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-saveful-green file:px-4 file:py-1 file:text-sm file:text-white hover:file:bg-green-600"
                  />
                  {imagePreviews.hero && (
                    <div className="relative mt-2 h-32 w-full overflow-hidden rounded-lg">
                      <Image
                        src={imagePreviews.hero}
                        alt="Hero Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Article Blocks Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-saveful-bold text-xl text-gray-900">Article Blocks</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addBlock(ArticleBlockType.TEXT)}
                    className="rounded-lg bg-blue-100 px-3 py-1.5 font-saveful-semibold text-xs text-blue-700 transition hover:bg-blue-200"
                    title="Add Text Block"
                  >
                    <FontAwesomeIcon icon={faFileAlt} className="mr-1" />
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock(ArticleBlockType.LIST)}
                    className="rounded-lg bg-green-100 px-3 py-1.5 font-saveful-semibold text-xs text-green-700 transition hover:bg-green-200"
                    title="Add List Block"
                  >
                    <FontAwesomeIcon icon={faList} className="mr-1" />
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock(ArticleBlockType.IMAGE)}
                    className="rounded-lg bg-purple-100 px-3 py-1.5 font-saveful-semibold text-xs text-purple-700 transition hover:bg-purple-200"
                    title="Add Image Block"
                  >
                    <FontAwesomeIcon icon={faImage} className="mr-1" />
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock(ArticleBlockType.VIDEO)}
                    className="rounded-lg bg-red-100 px-3 py-1.5 font-saveful-semibold text-xs text-red-700 transition hover:bg-red-200"
                    title="Add Video Block"
                  >
                    <FontAwesomeIcon icon={faVideo} className="mr-1" />
                    Video
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {hackForm.articleBlocks.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <FontAwesomeIcon
                      icon={faFileAlt}
                      className="mx-auto mb-3 h-12 w-12 text-gray-400"
                    />
                    <p className="font-saveful text-sm text-gray-500">
                      No blocks added yet. Click the buttons above to add content.
                    </p>
                  </div>
                ) : (
                  hackForm.articleBlocks.map((block, index) => (
                    <BlockEditor
                      key={block.id}
                      block={block}
                      index={index}
                      updateBlock={updateBlock}
                      removeBlock={removeBlock}
                      moveBlock={moveBlock}
                      isFirst={index === 0}
                      isLast={index === hackForm.articleBlocks.length - 1}
                      videoThumbnails={videoThumbnails}
                      setVideoThumbnails={setVideoThumbnails}
                      videoThumbnailPreviews={videoThumbnailPreviews}
                      setVideoThumbnailPreviews={setVideoThumbnailPreviews}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="sticky bottom-0 flex gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
              <button
                type="button"
                onClick={() => router.push("/admin/hacks")}
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
                {isSubmitting ? "Updating..." : "Update Hack"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Block Editor Component
function BlockEditor({
  block,
  index,
  updateBlock,
  removeBlock,
  moveBlock,
  isFirst,
  isLast,
  videoThumbnails,
  setVideoThumbnails,
  videoThumbnailPreviews,
  setVideoThumbnailPreviews,
}: any) {
  const [expanded, setExpanded] = useState(true);

  const getBlockIcon = (type: ArticleBlockType) => {
    switch (type) {
      case ArticleBlockType.TEXT:
        return faFileAlt;
      case ArticleBlockType.IMAGE:
        return faImage;
      case ArticleBlockType.VIDEO:
        return faVideo;
      case ArticleBlockType.LIST:
        return faList;
      default:
        return faFileAlt;
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 bg-gray-50 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-300 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon
            icon={getBlockIcon(block.type)}
            className="text-gray-600"
          />
          <span className="font-saveful-semibold capitalize text-gray-700">
            {block.type} Block
          </span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => moveBlock(index, "up")}
            disabled={isFirst}
            className="rounded p-2 text-sm transition hover:bg-gray-100 disabled:text-gray-300"
            title="Move Up"
          >
            <FontAwesomeIcon icon={faArrowUp} />
          </button>
          <button
            type="button"
            onClick={() => moveBlock(index, "down")}
            disabled={isLast}
            className="rounded p-2 text-sm transition hover:bg-gray-100 disabled:text-gray-300"
            title="Move Down"
          >
            <FontAwesomeIcon icon={faArrowDown} />
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded p-2 text-sm transition hover:bg-gray-100"
            title={expanded ? "Collapse" : "Expand"}
          >
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
          <button
            type="button"
            onClick={() => removeBlock(index)}
            className="rounded p-2 text-sm text-red-500 transition hover:bg-red-50"
            title="Remove Block"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          {block.type === ArticleBlockType.TEXT && (
            <RichTextEditor
              value={(block as TextBlock).text}
              onChange={(html) => updateBlock(index, { text: html })}
              placeholder="Enter formatted text..."
              rows={4}
            />
          )}

          {block.type === ArticleBlockType.IMAGE && (
            <input
              type="url"
              value={(block as ImageBlock).imageUrl}
              onChange={(e) => updateBlock(index, { imageUrl: e.target.value })}
              placeholder="Image URL"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
            />
          )}

          {block.type === ArticleBlockType.VIDEO && (
            <div className="space-y-3">
              <input
                type="url"
                value={(block as VideoBlock).videoUrl}
                onChange={(e) => updateBlock(index, { videoUrl: e.target.value })}
                placeholder="YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              />
              <input
                type="text"
                value={(block as VideoBlock).videoCaption || ""}
                onChange={(e) =>
                  updateBlock(index, { videoCaption: e.target.value })
                }
                placeholder="Video Caption (optional)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              />
              <input
                type="text"
                value={(block as VideoBlock).videoCredit || ""}
                onChange={(e) =>
                  updateBlock(index, { videoCredit: e.target.value })
                }
                placeholder="Video Credit (optional)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              />
              <div>
                <label className="mb-1 block font-saveful-semibold text-xs text-gray-700">
                  Custom Thumbnail (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setVideoThumbnails((prev: Record<string, File>) => ({
                        ...prev,
                        [block.id]: file,
                      }));
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setVideoThumbnailPreviews(
                          (prev: Record<string, string>) => ({
                            ...prev,
                            [block.id]: reader.result as string,
                          })
                        );
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs file:mr-4 file:rounded-md file:border-0 file:bg-saveful-green file:px-4 file:py-1 file:text-xs file:text-white hover:file:bg-green-600"
                />
                {(videoThumbnailPreviews[block.id] || (block as any).videoThumbnail) && (
                  <div className="relative mt-2 h-24 w-full overflow-hidden rounded-lg">
                    <Image
                      src={videoThumbnailPreviews[block.id] || (block as any).videoThumbnail}
                      alt="Thumbnail Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {block.type === ArticleBlockType.LIST && (
            <ListBlockEditor
              block={block as ListBlock}
              index={index}
              updateBlock={updateBlock}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ListBlockEditor({ block, index, updateBlock }: any) {
  const addListItem = () => {
    const newItem = { id: `item-${Date.now()}`, listText: "" };
    updateBlock(index, {
      listItems: [...block.listItems, newItem],
    });
  };

  const updateListItem = (itemIndex: number, text: string) => {
    const newItems = [...block.listItems];
    newItems[itemIndex].listText = text;
    updateBlock(index, { listItems: newItems });
  };

  const removeListItem = (itemIndex: number) => {
    updateBlock(index, {
      listItems: block.listItems.filter((_: any, i: number) => i !== itemIndex),
    });
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={block.listTitle}
        onChange={(e) => updateBlock(index, { listTitle: e.target.value })}
        placeholder="List Title"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful-semibold text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
      />
      <div className="space-y-2">
        {block.listItems.map((item: any, itemIndex: number) => (
          <div key={item.id} className="flex gap-2">
            <span className="flex h-9 w-8 shrink-0 items-center justify-center font-saveful-semibold text-sm text-gray-600">
              {itemIndex + 1}.
            </span>
            <input
              type="text"
              value={item.listText}
              onChange={(e) => updateListItem(itemIndex, e.target.value)}
              placeholder="List item text"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
            />
            <button
              type="button"
              onClick={() => removeListItem(itemIndex)}
              className="rounded px-3 text-red-500 transition hover:bg-red-50"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addListItem}
        className="w-full rounded-lg border-2 border-dashed border-gray-300 py-2 font-saveful text-sm text-gray-600 transition hover:border-saveful-green hover:bg-gray-50"
      >
        <FontAwesomeIcon icon={faPlus} className="mr-2" />
        Add List Item
      </button>
    </div>
  );
}
