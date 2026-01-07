// src/app/dashboard/receipts/page.tsx
import { useAuthContext } from 'src/auth/hooks';
import ReceiptListView from 'src/sections/receipts/view/receipt-list-view';

export default function Page() {
  // TODO: lấy roles từ auth context của bạn
  const { user } = useAuthContext();
  return <ReceiptListView roles={user?.roles ?? []} />;
}
