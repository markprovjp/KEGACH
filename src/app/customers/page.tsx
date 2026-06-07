import { CustomerManagement } from "@/features/customers/components/CustomerManagement";

export default function CustomersPage() {
  return (
    <main>
      <h1 className="page-title">Quản lý khách hàng</h1>
      <p className="page-subtitle">Phân loại khách lấy thẳng và khách trung gian để khi lên đơn chỉ hiện thông tin người nhận cuối khi cần.</p>
      <CustomerManagement />
    </main>
  );
}
