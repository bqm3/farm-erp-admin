// src/app/dashboard/receipts/change-requests/page.tsx
import { useAuthContext } from 'src/auth/hooks';
import ChangeRequestAdminView from 'src/sections/receipts/view/change-request-admin-view';

export default function Page() {
  const { user } = useAuthContext();
  return <ChangeRequestAdminView roles={user?.roles ?? []} />;
}
