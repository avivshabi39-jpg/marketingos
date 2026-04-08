"use client";

import { Block, PADDING_MAP } from "@/types/builder";
import HeroBlock from "./blocks/HeroBlock";
import TextBlock from "./blocks/TextBlock";
import ImageBlock from "./blocks/ImageBlock";
import FormBlock from "./blocks/FormBlock";
import FeaturesBlock from "./blocks/FeaturesBlock";
import WhatsAppBlock from "./blocks/WhatsAppBlock";
import CtaBlock from "./blocks/CtaBlock";
import TestimonialBlock from "./blocks/TestimonialBlock";
import GalleryBlock from "./blocks/GalleryBlock";

const BLOCK_MAP: Record<string, React.ComponentType<{
  block: Block;
  editable?: boolean;
  onUpdate?: (content: Record<string, string>) => void;
  clientSlug?: string;
  whatsappNumber?: string;
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

export default function BlockRenderer({
  blocks,
  clientSlug,
  whatsappNumber,
  clientName,
}: {
  blocks: Block[];
  clientSlug?: string;
  whatsappNumber?: string;
  clientName?: string;
}) {
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      {/* SEO-friendly head content from hero block */}
      {blocks.map((block) => {
        const Component = BLOCK_MAP[block.type];
        if (!Component) return null;
        const padding = PADDING_MAP[block.settings.padding || "md"] || PADDING_MAP.md;
        return (
          <div key={block.id} className={padding}>
            <Component
              block={block}
              clientSlug={clientSlug}
              whatsappNumber={whatsappNumber}
            />
          </div>
        );
      })}

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-slate-400 border-t border-slate-100">
        {clientName && <span>{clientName}</span>}
      </footer>
    </div>
  );
}
