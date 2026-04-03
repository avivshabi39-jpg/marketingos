import { Loader2 } from "lucide-react";

export default function EmailSequencesLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-gray-300" />
    </div>
  );
}
