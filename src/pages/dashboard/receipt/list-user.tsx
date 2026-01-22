// src/app/dashboard/receipts/page.tsx
import { useAuthContext } from 'src/auth/hooks';
import ReceiptUserListView from 'src/sections/receipts/view/user-receipt-list-view';

export default function ReceiptUserListPage() {
  // TODO: lấy roles từ auth context của bạn
  const { user } = useAuthContext();
  return <ReceiptUserListView roles={user?.roles ?? []} />;
}
