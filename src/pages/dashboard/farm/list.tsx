// src/pages/dashboard/leave/balances.tsx (ví dụ)
import FarmListView from 'src/sections/farms/farm-list-view';
import { useAuthContext } from 'src/auth/hooks';

export default function FarmListPage() {
  const { user } = useAuthContext();
  const roles: string[] = user?.roles || [];
  const canEdit = roles.includes('ADMIN') || roles.includes('ACCOUNTANT');

  return <FarmListView canEdit={canEdit}/>;
}
