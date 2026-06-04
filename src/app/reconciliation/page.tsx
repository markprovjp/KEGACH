import { Card } from "antd";
import { ReconciliationTable } from "@/features/reconciliation/components/ReconciliationTable";

export default function ReconciliationPage() {
  return (
    <main>
      <h1 className="page-title">Đối soát Kiot</h1>
      <p className="page-subtitle">Nhập/xuất danh sách hóa đơn Kiot thủ công, gắn với order app, ghi lý do mỗi khi xử lý lệch.</p>
      <Card>
        <ReconciliationTable />
      </Card>
    </main>
  );
}
