export interface SetupTask {
  id: string;
  label: string;
  description: string;
  icon: string;
  completed: boolean;
  actionLabel: string;
  actionHref: string;
}

export interface SetupProgress {
  tasks: SetupTask[];
  completedCount: number;
  totalCount: number;
  percentage: number;
}

interface ClientSetupData {
  slug: string;
  name?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  greenApiInstanceId?: string | null;
  greenApiToken?: string | null;
  facebookPageId?: string | null;
  pagePublished?: boolean;
  onboardingDone?: boolean;
}

export function getSetupProgress(client: ClientSetupData): SetupProgress {
  const s = client.slug;
  const tasks: SetupTask[] = [
    {
      id: "profile",
      label: "פרופיל עסקי",
      description: "הוסף שם וטלפון לעסק",
      icon: "🏢",
      completed: !!(client.name && client.phone),
      actionLabel: "השלם פרופיל",
      actionHref: `/client/${s}/settings`,
    },
    {
      id: "whatsapp",
      label: "WhatsApp מחובר",
      description: "חבר Green API לשליחת הודעות",
      icon: "💬",
      completed: !!(client.greenApiInstanceId && client.greenApiToken),
      actionLabel: "חבר WhatsApp",
      actionHref: `/client/${s}/settings`,
    },
    {
      id: "facebook",
      label: "Facebook מחובר",
      description: "קבל לידים ישירות ממודעות",
      icon: "📘",
      completed: !!client.facebookPageId,
      actionLabel: "חבר Facebook",
      actionHref: `/client/${s}/settings`,
    },
    {
      id: "page",
      label: "דף נחיתה פורסם",
      description: "בנה ופרסם את הדף שלך",
      icon: "🌐",
      completed: !!client.pagePublished,
      actionLabel: "בנה דף",
      actionHref: `/client/${s}/build-page`,
    },
    {
      id: "onboarding",
      label: "הגדרה ראשונית",
      description: "השלם את אשף ההגדרה",
      icon: "✅",
      completed: !!client.onboardingDone,
      actionLabel: "השלם הגדרה",
      actionHref: `/client/${s}`,
    },
  ];

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return { tasks, completedCount, totalCount, percentage };
}
