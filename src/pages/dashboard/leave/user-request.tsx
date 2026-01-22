// src/pages/dashboard/leave/requests.tsx
import LeaveRequestListView from 'src/sections/leave/view/user-leave-request-list-view';
import { useAuthContext } from 'src/auth/hooks'; 

export default function LeaveUserRequestPage() {
  const { user } = useAuthContext();

  const roles: string[] = user?.roles || [];
  const canApproveAndReject = roles.includes('ACCOUNTANT') || roles.includes('ADMIN');
//   const canReject = roles.includes('ADMIN');

  return <LeaveRequestListView canApprove={canApproveAndReject} canReject={canApproveAndReject} />;
}
