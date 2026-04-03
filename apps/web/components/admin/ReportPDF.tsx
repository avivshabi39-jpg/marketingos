import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Helvetica",
  fonts: [],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    fontSize: 10,
    color: "#1f2937",
    direction: "rtl",
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottom: "1.5pt solid #e5e7eb",
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  headerRight: {
    textAlign: "right",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
  },
  statsGrid: {
    flexDirection: "row-reverse",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    marginBottom: 10,
    textAlign: "right",
  },
  infoRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottom: "0.5pt solid #f3f4f6",
  },
  infoLabel: {
    color: "#6b7280",
    textAlign: "right",
  },
  infoValue: {
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    textAlign: "left",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    borderTop: "0.5pt solid #e5e7eb",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
  accentBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4f46e5",
    marginBottom: 28,
  },
  conversionBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
    marginTop: 8,
    overflow: "hidden",
  },
  conversionFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4f46e5",
  },
});

interface ReportPDFProps {
  report: {
    id: string;
    type: string;
    period: string;
    totalLeads: number;
    wonLeads: number;
    lostLeads: number;
    conversionRate: number;
    topSource: string | null;
    revenue: number | null;
    createdAt: Date | string;
    client: { name: string; primaryColor: string };
  };
}

const TYPE_HE: Record<string, string> = { WEEKLY: "שבועי", MONTHLY: "חודשי" };
const SOURCE_HE: Record<string, string> = {
  facebook: "פייסבוק", google: "גוגל", organic: "אורגני", manual: "ידני", other: "אחר",
};

export function ReportPDF({ report }: ReportPDFProps) {
  const generatedDate = new Date(report.createdAt).toLocaleDateString("he-IL", {
    day: "numeric", month: "long", year: "numeric",
  });
  const fillWidth = `${Math.min(100, report.conversionRate)}%`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top accent bar */}
        <View style={styles.accentBar} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRight}>
            <Text style={styles.title}>
              דוח {TYPE_HE[report.type] ?? report.type}
            </Text>
            <Text style={styles.subtitle}>
              {report.client.name} · תקופה: {report.period}
            </Text>
          </View>
          <View style={styles.logo}>
            <Text style={styles.logoText}>
              {report.client.name.slice(0, 1)}
            </Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{report.totalLeads}</Text>
            <Text style={styles.statLabel}>סה"כ לידים</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{report.wonLeads}</Text>
            <Text style={styles.statLabel}>עסקאות שנסגרו</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{report.lostLeads}</Text>
            <Text style={styles.statLabel}>עסקאות שאבדו</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {report.revenue ? `₪${Math.round(report.revenue / 1000)}K` : "—"}
            </Text>
            <Text style={styles.statLabel}>הכנסה</Text>
          </View>
        </View>

        {/* Conversion rate section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>אחוז המרה</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{report.conversionRate.toFixed(1)}%</Text>
            <Text style={styles.infoLabel}>מתוך {report.totalLeads} לידים</Text>
          </View>
          <View style={styles.conversionBar}>
            <View style={[styles.conversionFill, { width: fillWidth }]} />
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטים נוספים</Text>
          {report.topSource && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>
                {SOURCE_HE[report.topSource] ?? report.topSource}
              </Text>
              <Text style={styles.infoLabel}>מקור מוביל</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{TYPE_HE[report.type] ?? report.type}</Text>
            <Text style={styles.infoLabel}>סוג דוח</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{report.period}</Text>
            <Text style={styles.infoLabel}>תקופה</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{generatedDate}</Text>
            <Text style={styles.infoLabel}>תאריך הפקה</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{report.client.name}</Text>
          <Text style={styles.footerText}>MarketingOS · הופק אוטומטית</Text>
        </View>
      </Page>
    </Document>
  );
}
