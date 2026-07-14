import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, marginBottom: 16, color: "#475569" },
  summaryRow: { flexDirection: "row", marginBottom: 20, gap: 12 },
  summaryBox: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },
  summaryLabel: { fontSize: 7, color: "#64748b", marginBottom: 4 },
  summaryValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
  },
  cellDate: { width: "18%" },
  cellUnit: { width: "17%" },
  cellStudents: { width: "37%" },
  cellStatus: { width: "14%" },
  cellHours: { width: "14%", textAlign: "right" },
  headerCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#475569" },
  emptyMessage: { marginTop: 12, color: "#64748b" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

export type ProfessorReportSession = {
  scheduledAt: Date;
  unitName: string;
  studentNames: string[];
  status: "COMPLETED" | "CANCELED";
  durationMinutes: number;
};

export function ProfessorReportDocument({
  professorName,
  fromLabel,
  toLabel,
  sessions,
}: {
  professorName: string;
  fromLabel: string;
  toLabel: string;
  sessions: ProfessorReportSession[];
}) {
  const completed = sessions.filter((session) => session.status === "COMPLETED");
  const canceled = sessions.filter((session) => session.status === "CANCELED");
  const totalHours = completed.reduce(
    (sum, session) => sum + session.durationMinutes / 60,
    0
  );

  return (
    <Document title={`Relatorio de horas - ${professorName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório de horas e atendimentos</Text>
        <Text style={styles.subtitle}>
          {professorName} · Período: {fromLabel} a {toLabel}
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>ATENDIMENTOS CONCLUÍDOS</Text>
            <Text style={styles.summaryValue}>{completed.length}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>ATENDIMENTOS CANCELADOS</Text>
            <Text style={styles.summaryValue}>{canceled.length}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>HORAS TRABALHADAS</Text>
            <Text style={styles.summaryValue}>{totalHours.toLocaleString("pt-BR")}</Text>
          </View>
        </View>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.headerCell, styles.cellDate]}>Data/Hora</Text>
          <Text style={[styles.headerCell, styles.cellUnit]}>Unidade</Text>
          <Text style={[styles.headerCell, styles.cellStudents]}>Alunos</Text>
          <Text style={[styles.headerCell, styles.cellStatus]}>Status</Text>
          <Text style={[styles.headerCell, styles.cellHours]}>Horas</Text>
        </View>
        {sessions.map((session, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={styles.cellDate}>
              {format(session.scheduledAt, "dd/MM/yyyy HH:mm")}
            </Text>
            <Text style={styles.cellUnit}>{session.unitName}</Text>
            <Text style={styles.cellStudents}>{session.studentNames.join(", ")}</Text>
            <Text style={styles.cellStatus}>
              {session.status === "COMPLETED" ? "Concluída" : "Cancelada"}
            </Text>
            <Text style={styles.cellHours}>
              {(session.durationMinutes / 60).toLocaleString("pt-BR")}
            </Text>
          </View>
        ))}
        {sessions.length === 0 && (
          <Text style={styles.emptyMessage}>
            Nenhum atendimento no período selecionado.
          </Text>
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
