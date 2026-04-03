"use client";

import { useEffect, useState } from "react";
import {
  PlusCircle,
  ArrowRight,
  FileText,
  Phone,
  Mail,
  Circle,
} from "lucide-react";

interface LeadActivity {
  id: string;
  leadId: string;
  type: string;
  content: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

interface Props {
  leadId: string;
}

function getIconConfig(type: string): {
  Icon: React.ElementType;
  bgClass: string;
  textClass: string;
} {
  switch (type) {
    case "created":
      return { Icon: PlusCircle, bgClass: "bg-green-100", textClass: "text-green-600" };
    case "status_change":
      return { Icon: ArrowRight, bgClass: "bg-blue-100", textClass: "text-blue-600" };
    case "note":
      return { Icon: FileText, bgClass: "bg-yellow-100", textClass: "text-yellow-600" };
    case "call":
      return { Icon: Phone, bgClass: "bg-purple-100", textClass: "text-purple-600" };
    case "email":
      return { Icon: Mail, bgClass: "bg-indigo-100", textClass: "text-indigo-600" };
    default:
      return { Icon: Circle, bgClass: "bg-gray-100", textClass: "text-gray-500" };
  }
}

function getTitle(activity: LeadActivity): string {
  switch (activity.type) {
    case "created":
      return "ליד נוצר";
    case "status_change": {
      const status =
        (activity.meta as { status?: string } | null)?.status ?? activity.content ?? "";
      return `סטטוס שונה ל: ${status}`;
    }
    case "note":
      return "הערה נוספה";
    case "call":
      return "שיחה בוצעה";
    case "email":
      return "מייל נשלח";
    default:
      return activity.type;
  }
}

function formatDate(createdAt: string): string {
  return new Date(createdAt).toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function LeadTimeline({ leadId }: Props) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch(`/api/leads/${leadId}/activities`);
        if (!res.ok) throw new Error("שגיאה בטעינת פעילויות");
        const data = await res.json();
        setActivities(data.activities ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [leadId]);

  if (loading) {
    return (
      <div className="space-y-3" dir="rtl">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2 pb-4">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="text-sm text-red-500 py-2">
        {error}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div dir="rtl" className="text-sm text-gray-400 py-4 text-center">
        אין פעילויות עדיין
      </div>
    );
  }

  return (
    <div className="space-y-0" dir="rtl">
      {activities.map((activity, i) => {
        const { Icon, bgClass, textClass } = getIconConfig(activity.type);
        return (
          <div key={activity.id} className="flex gap-3 relative">
            {/* Line connector (except last) */}
            {i < activities.length - 1 && (
              <div className="absolute right-[18px] top-8 bottom-0 w-0.5 bg-gray-100" />
            )}
            {/* Icon circle */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bgClass} ${textClass}`}
            >
              <Icon size={16} />
            </div>
            {/* Content */}
            <div className="flex-1 pb-4">
              <p className="text-sm font-medium text-gray-900">{getTitle(activity)}</p>
              {activity.content && (
                <p className="text-xs text-gray-500 mt-0.5">{activity.content}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{formatDate(activity.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
