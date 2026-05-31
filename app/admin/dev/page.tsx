import { DevReportDashboard } from "../../components/dev-report-dashboard";
import { loadDevReport } from "../../lib/dev-report";

export default function AdminDevPage() {
  const data = loadDevReport();
  return <DevReportDashboard data={data} />;
}
