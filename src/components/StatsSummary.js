import { Text, View } from "react-native";
import { styles } from "../styles/styles";

const StatCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function StatsSummary({ stats }) {
  return (
    <View style={styles.statsRow}>
      <StatCard label="Activos" value={stats.active} />
      <StatCard label="Cerrados" value={stats.completed} />
      <StatCard label="Total" value={stats.total} />
    </View>
  );
}
