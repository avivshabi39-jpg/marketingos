"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import type { CollisionDetection } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowRight,
  Save,
  Eye,
  Trash2,
  GripVertical,
  Sparkles,
  ChevronDown,
  Smartphone,
  Monitor,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

import { Block, BlockType, BLOCK_DEFINITIONS, PADDING_MAP } from "@/types/builder";
import { INDUSTRY_TEMPLATES } from "@/components/builder/templates";
import HeroBlock from "@/components/builder/blocks/HeroBlock";
import TextBlock from "@/components/builder/blocks/TextBlock";
import ImageBlock from "@/components/builder/blocks/ImageBlock";
import FormBlock from "@/components/builder/blocks/FormBlock";
import FeaturesBlock from "@/components/builder/blocks/FeaturesBlock";
import WhatsAppBlock from "@/components/builder/blocks/WhatsAppBlock";
import CtaBlock from "@/components/builder/blocks/CtaBlock";
import TestimonialBlock from "@/components/builder/blocks/TestimonialBlock";
import GalleryBlock from "@/components/builder/blocks/GalleryBlock";

// ─── Block component map ─────────────────────────────────────────────────
const BLOCK_MAP: Record<string, React.ComponentType<{
  block: Block;
  editable?: boolean;
  onUpdate?: (content: Record<string, string>) => void;
}>> = {
  hero: HeroBlock,
  text: TextBlock,
  image: ImageBlock,
  form: FormBlock,
  features: FeaturesBlock,
  whatsapp: WhatsAppBlock,
  cta: CtaBlock,
  testimonial: TestimonialBlock,
  gallery: GalleryBlock,
};

// ─── Sortable wrapper ─────────────────────────────────────────────────────
function SortableBlock({
  block,
  isSelected,
  onSelect,
  onDelete,
  onUpdateContent,
}: {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateContent: (content: Record<string, string>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const Component = BLOCK_MAP[block.type];
  if (!Component) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-xl border-2 transition-colors ${
        isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-slate-300"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Drag handle + delete */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded bg-white shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={14} className="text-slate-400" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded bg-white shadow-sm border border-slate-200 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Block type badge */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
          {BLOCK_DEFINITIONS.find((d) => d.type === block.type)?.label || block.type}
        </span>
      </div>

      <Component block={block} editable onUpdate={onUpdateContent} />
    </div>
  );
}

// ─── Draggable library item ───────────────────────────────────────────────
function DraggableLibraryItem({
  def,
  onAdd,
}: {
  def: { type: BlockType; label: string; icon: string };
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new:${def.type}`,
    data: { type: def.type, isLibraryItem: true },
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onAdd}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg border transition text-right cursor-grab active:cursor-grabbing ${
        isDragging
          ? "opacity-40 border-blue-300 bg-blue-50"
          : "border-slate-100 hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      <span className="text-lg">{def.icon}</span>
      <span>{def.label}</span>
    </button>
  );
}

// ─── Droppable canvas zone ────────────────────────────────────────────────
function DroppableCanvas({
  children,
  isOver,
}: {
  children: React.ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: "canvas" });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] transition-colors rounded-xl ${isOver ? "ring-2 ring-blue-400 ring-offset-2 bg-blue-50/30" : ""}`}
    >
      {children}
    </div>
  );
}

// ─── Main builder page ────────────────────────────────────────────────────
export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blocksB, setBlocksB] = useState<Block[]>([]);
  const [activeVersion, setActiveVersion] = useState<"A" | "B">("A");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clientData, setClientData] = useState<{
    name: string;
    slug: string;
    industry: string | null;
    whatsappNumber: string | null;
    primaryColor: string;
    pagePublished: boolean;
    abTestEnabled: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [activeLibraryBlock, setActiveLibraryBlock] = useState<BlockType | null>(null);
  const [isOverCanvas, setIsOverCanvas] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Custom collision: library items use pointerWithin+rectIntersection for broad canvas detection;
  // sortable reorder keeps closestCenter.
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      if (dragActiveId?.startsWith("new:")) {
        const pointer = pointerWithin(args);
        if (pointer.length > 0) return pointer;
        return rectIntersection(args);
      }
      return closestCenter(args);
    },
    [dragActiveId]
  );

  // Load data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/clients/${clientId}/builder`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setClientData({
          name: data.client.name,
          slug: data.client.slug,
          industry: data.client.industry,
          whatsappNumber: data.client.whatsappNumber,
          primaryColor: data.client.primaryColor,
          pagePublished: data.client.pagePublished,
          abTestEnabled: data.client.abTestEnabled ?? false,
        });
        if (data.client.pageBlocks && Array.isArray(data.client.pageBlocks)) {
          setBlocks(data.client.pageBlocks as Block[]);
        }
        if (data.client.pageBlocksB && Array.isArray(data.client.pageBlocksB)) {
          setBlocksB(data.client.pageBlocksB as Block[]);
        }
      } catch {
        toast.error("שגיאה בטעינת הנתונים");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clientId]);

  // Auto-save every 30s — only version A, only when there are unsaved changes
  const hasUnsavedRef = useRef(hasUnsavedChanges);
  hasUnsavedRef.current = hasUnsavedChanges;

  useEffect(() => {
    autoSaveRef.current = setInterval(async () => {
      if (blocksRef.current.length > 0 && hasUnsavedRef.current) {
        try {
          await fetch(`/api/clients/${clientId}/builder`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pageBlocks: blocksRef.current }),
          });
          setHasUnsavedChanges(false);
        } catch {
          // silent — user can manually save
        }
      }
    }, 30_000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const saveBlocks = useCallback(
    async (blocksToSave: Block[], showToast = true) => {
      setSaving(true);
      try {
        const isB = activeVersion === "B";
        const body = isB
          ? { pageBlocksB: blocksToSave }
          : { pageBlocks: blocksToSave };
        const res = await fetch(`/api/clients/${clientId}/builder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        setHasUnsavedChanges(false);
        if (showToast) toast.success(`גרסה ${activeVersion} נשמרה`);
      } catch {
        if (showToast) toast.error("שגיאה בשמירה");
      } finally {
        setSaving(false);
      }
    },
    [clientId, activeVersion]
  );

  const togglePublish = async () => {
    const newState = !clientData?.pagePublished;
    try {
      const res = await fetch(`/api/clients/${clientId}/builder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageBlocks: blocks, pagePublished: newState }),
      });
      if (!res.ok) throw new Error();
      setClientData((d) => (d ? { ...d, pagePublished: newState } : d));
      toast.success(newState ? "הדף פורסם" : "הדף בוטל פרסום");
    } catch {
      toast.error("שגיאה");
    }
  };

  const addBlock = (type: BlockType) => {
    const def = BLOCK_DEFINITIONS.find((d) => d.type === type);
    if (!def) return;
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      content: { ...def.defaultContent },
      settings: { ...def.defaultSettings },
    };
    setActiveBlocks((prev) => [...prev, newBlock]);
    setSelectedId(newBlock.id);
    setHasUnsavedChanges(true);
  };

  const deleteBlock = (id: string) => {
    setActiveBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
    setHasUnsavedChanges(true);
  };

  const updateBlockContent = (id: string, content: Record<string, string>) => {
    setActiveBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
    setHasUnsavedChanges(true);
  };

  const updateBlockSettings = (id: string, settings: Partial<Block["settings"]>) => {
    setActiveBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, settings: { ...b.settings, ...settings } } : b))
    );
    setHasUnsavedChanges(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setDragActiveId(id);
    if (event.active.data.current?.isLibraryItem) {
      setActiveLibraryBlock(event.active.data.current.type as BlockType);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    setIsOverCanvas(String(event.over?.id ?? "") === "canvas" || event.over !== null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragActiveId(null);
    setActiveLibraryBlock(null);
    setIsOverCanvas(false);
    const { active, over } = event;
    const activeId = active.id as string;

    // Drag from library → add new block
    // Check BEFORE the !over guard so drops on the canvas body still register
    if (activeId.startsWith("new:") || active.data.current?.isLibraryItem) {
      const blockType = (activeId.startsWith("new:")
        ? activeId.replace("new:", "")
        : active.data.current?.type) as BlockType;
      if (over) {
        addBlock(blockType);
      }
      return;
    }

    // Reorder existing blocks
    if (!over || activeId === over.id) return;
    setActiveBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === activeId);
      const newIndex = prev.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const arr = [...prev];
      const [moved] = arr.splice(oldIndex, 1);
      arr.splice(newIndex, 0, moved);
      return arr;
    });
    setHasUnsavedChanges(true);
  };

  const loadTemplate = (templateId: string) => {
    const template = INDUSTRY_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const newBlocks = template.blocks.map((b) => ({
      ...b,
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }));
    setActiveBlocks(newBlocks);
    setShowTemplates(false);
    toast.success("התבנית נטענה");
  };

  const generateFullPage = async () => {
    if (!clientData) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/full-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: clientData.industry || "OTHER",
          businessName: clientData.name,
          whatsappNumber: clientData.whatsappNumber,
        }),
      });
      if (!res.ok) throw new Error();
      const { blocks: aiBlocks } = await res.json();
      if (Array.isArray(aiBlocks)) {
        setActiveBlocks(aiBlocks as Block[]);
        toast.success("הדף נוצר בהצלחה ע\"י AI");
      }
    } catch {
      toast.error("שגיאה ביצירת דף AI");
    } finally {
      setAiLoading(false);
    }
  };

  // Active blocks: switch between A and B based on version
  const activeBlocks = activeVersion === "B" ? blocksB : blocks;
  const setActiveBlocks = activeVersion === "B" ? setBlocksB : setBlocks;

  const selectedBlock = activeBlocks.find((b) => b.id === selectedId);
  const dragActiveBlock = activeBlocks.find((b) => b.id === dragActiveId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const categories = [
    { key: "basic", label: "בסיסי", types: BLOCK_DEFINITIONS.filter((d) => d.category === "basic") },
    { key: "conversion", label: "המרה", types: BLOCK_DEFINITIONS.filter((d) => d.category === "conversion") },
    { key: "content", label: "תוכן", types: BLOCK_DEFINITIONS.filter((d) => d.category === "content") },
  ];

  return (
    <div dir="rtl" className="h-screen flex flex-col bg-slate-50">
      {/* ─── Header bar ──────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/clients/${clientId}`}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowRight size={16} />
            חזור
          </Link>
          <span className="text-sm font-semibold text-slate-800">{clientData?.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile / Desktop toggle */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={() => setMobilePreview(false)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-xl transition ${!mobilePreview ? "bg-white shadow-sm text-slate-800 font-medium" : "text-slate-400 hover:text-slate-600"}`}
            >
              <Monitor size={13} /> דסקטופ
            </button>
            <button
              onClick={() => setMobilePreview(true)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-xl transition ${mobilePreview ? "bg-white shadow-sm text-slate-800 font-medium" : "text-slate-400 hover:text-slate-600"}`}
            >
              <Smartphone size={13} /> מובייל
            </button>
          </div>

          {/* A/B Testing toggle */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={async () => {
                const newEnabled = !clientData?.abTestEnabled;
                try {
                  await fetch(`/api/clients/${clientId}/builder`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ abTestEnabled: newEnabled }),
                  });
                  setClientData((d) => d ? { ...d, abTestEnabled: newEnabled } : d);
                  toast.success(newEnabled ? "A/B Testing הופעל" : "A/B Testing כובה");
                } catch { toast.error("שגיאה"); }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-xl transition ${
                clientData?.abTestEnabled
                  ? "bg-purple-600 text-white shadow-sm font-medium"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FlaskConical size={12} />
              A/B
            </button>
          </div>

          {/* Version A/B tabs — only when A/B enabled */}
          {clientData?.abTestEnabled && (
            <div className="flex items-center gap-1 border border-purple-200 rounded-lg p-0.5 bg-purple-50">
              <button
                onClick={() => { setActiveVersion("A"); setSelectedId(null); }}
                className={`px-3 py-1 text-xs rounded-xl font-medium transition ${activeVersion === "A" ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
              >
                גרסה A
              </button>
              <button
                onClick={() => { setActiveVersion("B"); setSelectedId(null); }}
                className={`px-3 py-1 text-xs rounded-xl font-medium transition ${activeVersion === "B" ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
              >
                גרסה B
              </button>
            </div>
          )}

          {/* Templates dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              תבניות מוכנות
              <ChevronDown size={14} />
            </button>
            {showTemplates && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-48 z-50">
                {INDUSTRY_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => loadTemplate(t.id)}
                    className="w-full text-right px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI full page */}
          <button
            onClick={generateFullPage}
            disabled={aiLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {aiLoading ? "יוצר..." : "✨ צור עמוד שלם"}
          </button>

          {/* Save status indicator */}
          {saving ? (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
              שומר...
            </span>
          ) : hasUnsavedChanges ? (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              יש שינויים לא שמורים
            </span>
          ) : null}

          {/* Save */}
          <button
            onClick={() => saveBlocks(activeBlocks)}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={14} />
            {clientData?.abTestEnabled ? `שמור ${activeVersion}` : "שמור"}
          </button>

          {/* Publish toggle */}
          <button
            onClick={togglePublish}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium ${
              clientData?.pagePublished
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {clientData?.pagePublished ? "בטל פרסום" : "פרסם A"}
          </button>

          {/* QR Code */}
          {clientData?.slug && (
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
              title="QR Code"
            >
              📲
            </button>
          )}

          {/* View page */}
          {clientData?.slug && (
            <Link
              href={`/${clientData.slug}`}
              target="_blank"
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <Eye size={14} />
              צפה בדף
            </Link>
          )}

          {/* QR Modal */}
          {showQR && clientData?.slug && (() => {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
            const pageUrl = `${appUrl}/${clientData.slug}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pageUrl)}&bgcolor=ffffff&color=1e1b4b&margin=10`;
            return (
              <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
                onClick={() => setShowQR(false)}
              >
                <div
                  className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-xs w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">QR Code לדף</h3>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="QR" className="w-48 h-48 mx-auto rounded-xl border border-slate-200" />
                  <p className="text-xs text-slate-500 mt-3 mb-4 break-all">{pageUrl}</p>
                  <div className="flex gap-2 justify-center">
                    <a
                      href={qrUrl}
                      download="qr.png"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      ⬇️ הורד
                    </a>
                    <button
                      onClick={() => setShowQR(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      סגור
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </header>

      {/* ─── 3-column layout wrapped in ONE DndContext ────────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Block library */}
        <aside className="w-[260px] bg-white border-l border-slate-200 overflow-y-auto p-4 shrink-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">סוגי בלוקים</h3>
          <p className="text-[10px] text-slate-400 mb-3">לחץ או גרור לקנבס</p>
          {categories.map((cat) => (
            <div key={cat.key} className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">{cat.label}</p>
              <div className="space-y-1.5">
                {cat.types.map((def) => (
                  <DraggableLibraryItem
                    key={def.type}
                    def={def}
                    onAdd={() => addBlock(def.type)}
                  />
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* CENTER — Canvas */}
        <main
          className="flex-1 overflow-y-auto p-6"
          onClick={() => setSelectedId(null)}
        >
          <div className={`mx-auto transition-all duration-300 ${mobilePreview ? "max-w-[390px] shadow-2xl rounded-2xl overflow-hidden border-2 border-slate-300" : "max-w-3xl"}`}>
            <DroppableCanvas isOver={isOverCanvas && activeLibraryBlock !== null}>
              {activeBlocks.length === 0 ? (
                <div className={`border-2 border-dashed rounded-2xl transition-colors ${isOverCanvas && activeLibraryBlock ? "border-blue-400 bg-blue-50/50" : "border-slate-200"}`}>
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="text-6xl mb-4">🎨</div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">הקנבס שלך ריק</h3>
                    <p className="text-slate-400 mb-6">גרור בלוק מהצד שמאל, או לחץ על אחד מהכפתורים</p>
                    <button
                      onClick={() => addBlock("hero")}
                      className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      ✨ בנה דף אוטומטי עם AI
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {clientData?.abTestEnabled && (
                    <div className={`text-center text-xs font-medium py-1.5 px-3 rounded-lg mb-3 ${activeVersion === "A" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                      עורך גרסה {activeVersion}
                    </div>
                  )}
                  <SortableContext
                    items={activeBlocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {activeBlocks.map((block) => (
                        <SortableBlock
                          key={block.id}
                          block={block}
                          isSelected={selectedId === block.id}
                          onSelect={() => setSelectedId(block.id)}
                          onDelete={() => deleteBlock(block.id)}
                          onUpdateContent={(content) => updateBlockContent(block.id, content)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  {/* Drop zone at the end — shown while dragging from library */}
                  {activeLibraryBlock && (
                    <div className="h-12 mt-3 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 flex items-center justify-center text-xs text-blue-500">
                      שחרר כאן להוסיף
                    </div>
                  )}
                </>
              )}
            </DroppableCanvas>
          </div>
        </main>

        {/* DragOverlay — ghost while dragging */}
        <DragOverlay>
          {activeLibraryBlock ? (
            (() => {
              const def = BLOCK_DEFINITIONS.find((d) => d.type === activeLibraryBlock);
              return def ? (
                <div className="px-4 py-3 bg-blue-600 text-white rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 opacity-90" style={{ cursor: "grabbing" }}>
                  <span className="text-xl">{def.icon}</span>
                  {def.label}
                </div>
              ) : null;
            })()
          ) : dragActiveId ? (
            (() => {
              const block = activeBlocks.find((b) => b.id === dragActiveId);
              if (!block) return null;
              const Comp = BLOCK_MAP[block.type];
              return Comp ? (
                <div className="opacity-80 shadow-2xl rounded-xl bg-white">
                  <Comp block={block} editable />
                </div>
              ) : null;
            })()
          ) : null}
        </DragOverlay>

        {/* RIGHT — Properties panel */}
        <aside className="w-[300px] bg-white border-r border-slate-200 overflow-y-auto p-4 shrink-0">
          {selectedBlock ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">
                  {BLOCK_DEFINITIONS.find((d) => d.type === selectedBlock.type)?.icon}{" "}
                  {BLOCK_DEFINITIONS.find((d) => d.type === selectedBlock.type)?.label}
                </h3>
                <button
                  onClick={() => deleteBlock(selectedBlock.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  מחק
                </button>
              </div>

              {/* Content fields */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">תוכן</p>
                {Object.entries(selectedBlock.content).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-500">{key}</label>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/ai/landing-page", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                clientId,
                                field: key,
                                currentValue: value,
                                blockType: selectedBlock.type,
                              }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              if (data.text) {
                                updateBlockContent(selectedBlock.id, {
                                  ...selectedBlock.content,
                                  [key]: data.text,
                                });
                                toast.success("נוצר ע\"י AI");
                              }
                            }
                          } catch {
                            /* ignore */
                          }
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 hover:bg-purple-100"
                        title="צור טקסט עם AI"
                      >
                        ✨ AI
                      </button>
                    </div>
                    {value.length > 50 ? (
                      <textarea
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-300 resize-y"
                        rows={3}
                        value={value}
                        onChange={(e) =>
                          updateBlockContent(selectedBlock.id, {
                            ...selectedBlock.content,
                            [key]: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <input
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-300"
                        value={value}
                        onChange={(e) =>
                          updateBlockContent(selectedBlock.id, {
                            ...selectedBlock.content,
                            [key]: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Settings */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase">עיצוב</p>

                {/* Background color */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">צבע רקע</label>
                  <input
                    type="color"
                    value={selectedBlock.settings.backgroundColor || "#ffffff"}
                    onChange={(e) =>
                      updateBlockSettings(selectedBlock.id, { backgroundColor: e.target.value })
                    }
                    className="w-full h-8 rounded border border-slate-200 cursor-pointer"
                  />
                </div>

                {/* Text color */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">צבע טקסט</label>
                  <input
                    type="color"
                    value={selectedBlock.settings.textColor || "#000000"}
                    onChange={(e) =>
                      updateBlockSettings(selectedBlock.id, { textColor: e.target.value })
                    }
                    className="w-full h-8 rounded border border-slate-200 cursor-pointer"
                  />
                </div>

                {/* Padding */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">ריפוד</label>
                  <select
                    value={selectedBlock.settings.padding || "md"}
                    onChange={(e) =>
                      updateBlockSettings(selectedBlock.id, {
                        padding: e.target.value as "sm" | "md" | "lg",
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="sm">קטן</option>
                    <option value="md">בינוני</option>
                    <option value="lg">גדול</option>
                  </select>
                </div>

                {/* Alignment */}
                <div>
                  <label className="text-xs text-slate-500 block mb-1">יישור</label>
                  <div className="flex gap-1">
                    {(["right", "center", "left"] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => updateBlockSettings(selectedBlock.id, { alignment: a })}
                        className={`flex-1 py-1.5 text-xs rounded border ${
                          selectedBlock.settings.alignment === a
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {a === "right" ? "ימין" : a === "center" ? "מרכז" : "שמאל"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <p className="text-sm">בחר בלוק לעריכה</p>
            </div>
          )}
        </aside>
      </div>
      </DndContext>
    </div>
  );
}
