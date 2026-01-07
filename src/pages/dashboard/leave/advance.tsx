// src/pages/dashboard/leave/balances.tsx (ví dụ)
import AdvanceListView from 'src/sections/leave/view/advance-list-view';
import { useAuthContext } from 'src/auth/hooks';

export default function AdvancePage() {
  const { user } = useAuthContext();
  const roles: string[] = user?.roles || [];
  const canEdit = roles.includes('ADMIN') || roles.includes('ACCOUNTANT');

  return <AdvanceListView canApprove={canEdit} />;
}
