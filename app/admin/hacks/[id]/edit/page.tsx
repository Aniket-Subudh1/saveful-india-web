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
  HackOrTipBlock,
  ImageDetailsBlock,
} from "@/services/hackManagementService";
import { sponsorManagementService, Sponsor } from "@/services/sponsorManagementService";
import { hackOrTipManagementService, HackOrTip } from "@/services/hackOrTipManagementService";
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
  faLightbulb,
  faFileImage,
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
  const [hackOrTips, setHackOrTips] = useState<HackOrTip[]>([]);
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
  const [blockImages, setBlockImages] = useState<Record<string, File>>({});
  const [blockImagePreviews, setBlockImagePreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && user && hackId) {
      fetchData();
    }
  }, [isLoading, user, hackId]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [categoriesData, sponsorsData, hackOrTipsData] = await Promise.all([
        hackManagementService.getAllCategories(),
        sponsorManagementService.getAllSponsors(),
        hackOrTipManagementService.getAll(),
      ]);
      
      console.log('Categories loaded:', categoriesData?.length || 0);
      console.log('Sponsors loaded:', sponsorsData?.length || 0, sponsorsData);
      
      setCategories(categoriesData);
      setSponsors(sponsorsData);
      setHackOrTips(hackOrTipsData);

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

      setImagePreviews({
        thumbnail: hack.thumbnailImageUrl || null,
        hero: hack.heroImageUrl || null,
      });

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
      case ArticleBlockType.HACK_OR_TIP:
        (newBlock as HackOrTipBlock).hackOrTipIds = [];
        break;
      case ArticleBlockType.IMAGE_DETAILS:
        (newBlock as ImageDetailsBlock).blockImageUrl = "";
        (newBlock as ImageDetailsBlock).blockTitle = "";
        (newBlock as ImageDetailsBlock).blockDescription = "";
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
        videoThumbnails,
        blockImages
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
                  <button
                    type="button"
                    onClick={() => addBlock(ArticleBlockType.HACK_OR_TIP)}
                    className="rounded-lg bg-amber-100 px-3 py-1.5 font-saveful-semibold text-xs text-amber-700 transition hover:bg-amber-200"
                    title="Add Hack or Tip Block"
                  >
                    <FontAwesomeIcon icon={faLightbulb} className="mr-1" />
                    Hack or Tip
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock(ArticleBlockType.IMAGE_DETAILS)}
                    className="rounded-lg bg-indigo-100 px-3 py-1.5 font-saveful-semibold text-xs text-indigo-700 transition hover:bg-indigo-200"
                    title="Add Image Details Block"
                  >
                    <FontAwesomeIcon icon={faFileImage} className="mr-1" />
                    Image Details
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
                      blockImages={blockImages}
                      setBlockImages={setBlockImages}
                      blockImagePreviews={blockImagePreviews}
                      setBlockImagePreviews={setBlockImagePreviews}
                      hackOrTips={hackOrTips}
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
  blockImages,
  setBlockImages,
  blockImagePreviews,
  setBlockImagePreviews,
  hackOrTips,
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
      case ArticleBlockType.HACK_OR_TIP:
        return faLightbulb;
      case ArticleBlockType.IMAGE_DETAILS:
        return faFileImage;
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
            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-saveful-semibold text-xs text-gray-700">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBlockImages((prev: Record<string, File>) => ({
                        ...prev,
                        [block.id]: file,
                      }));
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setBlockImagePreviews(
                          (prev: Record<string, string>) => ({
                            ...prev,
                            [block.id]: reader.result as string,
                          })
                        );
                      };
                      reader.readAsDataURL(file);
                      updateBlock(index, { imageUrl: "" });
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-saveful-green file:px-4 file:py-1 file:text-sm file:text-white hover:file:bg-green-600"
                />
                {(blockImagePreviews[block.id] || (block as any).imageUrl) && (
                  <div className="relative mt-2 h-40 w-full overflow-hidden rounded-lg">
                    <Image
                      src={blockImagePreviews[block.id] || (block as any).imageUrl}
                      alt="Image Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="text-center text-xs text-gray-500">OR</div>
              <input
                type="url"
                value={(block as ImageBlock).imageUrl || ""}
                onChange={(e) => {
                  updateBlock(index, { imageUrl: e.target.value });
                  if (e.target.value) {
                    setBlockImages((prev: Record<string, File>) => {
                      const updated = { ...prev };
                      delete updated[block.id];
                      return updated;
                    });
                    setBlockImagePreviews((prev: Record<string, string>) => {
                      const updated = { ...prev };
                      delete updated[block.id];
                      return updated;
                    });
                  }
                }}
                placeholder="Or enter image URL"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              />
              <input
                type="text"
                value={(block as ImageBlock).caption || ""}
                onChange={(e) => updateBlock(index, { caption: e.target.value })}
                placeholder="Image Caption (optional)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
              />
            </div>
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

          {block.type === ArticleBlockType.HACK_OR_TIP && (
            <HackOrTipBlockEditor
              block={block as HackOrTipBlock}
              index={index}
              updateBlock={updateBlock}
              hackOrTips={hackOrTips}
            />
          )}

          {block.type === ArticleBlockType.IMAGE_DETAILS && (
            <ImageDetailsBlockEditor
              block={block as ImageDetailsBlock}
              index={index}
              updateBlock={updateBlock}
              blockImages={blockImages}
              setBlockImages={setBlockImages}
              blockImagePreviews={blockImagePreviews}
              setBlockImagePreviews={setBlockImagePreviews}
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

function HackOrTipBlockEditor({ block, index, updateBlock, hackOrTips }: any) {
  const [selectedHackOrTipId, setSelectedHackOrTipId] = useState<string>("");

  const addHackOrTip = () => {
    if (!selectedHackOrTipId) return;
    
    const newIds = [...block.hackOrTipIds, selectedHackOrTipId];
    updateBlock(index, { hackOrTipIds: newIds });
    setSelectedHackOrTipId("");
  };

  const removeHackOrTip = (idToRemove: string) => {
    updateBlock(index, {
      hackOrTipIds: block.hackOrTipIds.filter((id: string) => id !== idToRemove),
    });
  };

  const getHackOrTipName = (id: string) => {
    const item = hackOrTips?.find((h: HackOrTip) => h._id === id);
    return item ? `${item.title} (${item.type})` : "Unknown";
  };

  const availableHackOrTips = hackOrTips?.filter(
    (h: HackOrTip) => !block.hackOrTipIds.includes(h._id)
  ) || [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={selectedHackOrTipId}
          onChange={(e) => setSelectedHackOrTipId(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
        >
          <option value="">Select a Hack or Tip...</option>
          {availableHackOrTips.map((item: HackOrTip) => (
            <option key={item._id} value={item._id}>
              {item.title} ({item.type})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addHackOrTip}
          disabled={!selectedHackOrTipId}
          className="rounded-lg bg-saveful-green px-4 py-2 font-saveful-semibold text-xs text-white transition hover:bg-green-600 disabled:bg-gray-300"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1" />
          Add
        </button>
      </div>

      {block.hackOrTipIds.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <FontAwesomeIcon
            icon={faLightbulb}
            className="mx-auto mb-2 h-8 w-8 text-gray-400"
          />
          <p className="font-saveful text-xs text-gray-500">
            No Hack or Tips added yet. Select from the dropdown above.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {block.hackOrTipIds.map((id: string, idx: number) => (
            <div
              key={id}
              className="flex items-center justify-between rounded-lg border border-gray-300 bg-white p-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 font-saveful-semibold text-xs text-amber-700">
                  {idx + 1}
                </span>
                <span className="font-saveful text-sm text-gray-700">
                  {getHackOrTipName(id)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeHackOrTip(id)}
                className="rounded px-2 py-1 text-red-500 transition hover:bg-red-50"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageDetailsBlockEditor({ block, index, updateBlock, blockImages, setBlockImages, blockImagePreviews, setBlockImagePreviews }: any) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block font-saveful-semibold text-xs text-gray-700">
          Block Image <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setBlockImages((prev: Record<string, File>) => ({
                ...prev,
                [block.id]: file,
              }));
              const reader = new FileReader();
              reader.onloadend = () => {
                setBlockImagePreviews(
                  (prev: Record<string, string>) => ({
                    ...prev,
                    [block.id]: reader.result as string,
                  })
                );
              };
              reader.readAsDataURL(file);
              updateBlock(index, { blockImageUrl: "" });
            }
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-saveful-green file:px-4 file:py-1 file:text-sm file:text-white hover:file:bg-green-600"
        />
        {(blockImagePreviews[block.id] || (block as any).blockImageUrl) && (
          <div className="relative mt-2 h-40 w-full overflow-hidden rounded-lg">
            <Image
              src={blockImagePreviews[block.id] || (block as any).blockImageUrl}
              alt="Block Image Preview"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>
      <div className="text-center text-xs text-gray-500">OR</div>
      <input
        type="url"
        value={(block as ImageDetailsBlock).blockImageUrl || ""}
        onChange={(e) => {
          updateBlock(index, { blockImageUrl: e.target.value });
          if (e.target.value) {
            setBlockImages((prev: Record<string, File>) => {
              const updated = { ...prev };
              delete updated[block.id];
              return updated;
            });
            setBlockImagePreviews((prev: Record<string, string>) => {
              const updated = { ...prev };
              delete updated[block.id];
              return updated;
            });
          }
        }}
        placeholder="Or enter image URL"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
      />
      <input
        type="text"
        value={(block as ImageDetailsBlock).blockTitle || ""}
        onChange={(e) => updateBlock(index, { blockTitle: e.target.value })}
        placeholder="Block Title *"
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful-semibold text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
      />
      <textarea
        value={(block as ImageDetailsBlock).blockDescription || ""}
        onChange={(e) => updateBlock(index, { blockDescription: e.target.value })}
        placeholder="Block Description *"
        required
        rows={4}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-saveful text-sm focus:border-saveful-green focus:outline-none focus:ring-2 focus:ring-saveful-green/20"
      />
    </div>
  );
}
