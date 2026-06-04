import { Card } from "antd";
import { ReconciliationTable } from "@/features/reconciliation/components/ReconciliationTable";

export default function ReconciliationPage() {
  return (
    <main>
      <h1 className="page-title">Doi soat Kiot</h1>
      <p className="page-subtitle">Nhap/xuat danh sach hoa don Kiot thu cong, gan voi order app, ghi ly do moi khi xu ly lech.</p>
      <Card>
        <ReconciliationTable />
      </Card>
    </main>
  );
}
