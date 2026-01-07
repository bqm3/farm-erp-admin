// src/pages/dashboard/leave/balances.tsx (ví dụ)
import LeaveBalanceListView from 'src/sections/leave/view/leave-balance-list-view';
import { useAuthContext } from 'src/auth/hooks';

export default function LeaveBalancePage() {
  const { user } = useAuthContext();
  const roles: string[] = user?.roles || [];
  const canEdit = roles.includes('ADMIN') || roles.includes('ACCOUNTANT');

  return <LeaveBalanceListView canEdit={canEdit} />;
}
