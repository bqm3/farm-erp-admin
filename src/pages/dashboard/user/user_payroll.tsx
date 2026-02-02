import { useEffect, useMemo } from 'react';
import { useAuthContext } from 'src/auth/hooks';
import { enqueueSnackbar } from 'src/components/snackbar';
import { useParams, useRouter } from 'src/routes/hooks';
// sections
import { EmployeePayrollRangeView } from 'src/sections/user/view';

// ----------------------------------------------------------------------

export default function EmployeePayrollRangePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = Number(params?.id);

  const { user } = useAuthContext();
  const canViewPayroll = user?.roles.includes('ADMIN') || user?.roles.includes('ACCOUNTANT');

  useEffect(() => {
    if (!canViewPayroll) {
      enqueueSnackbar('Bạn không có quyền xem lương', { variant: 'error' });
      router.replace('/dashboard/user/list'); // hoặc quay về list nhân viên
    }
  }, [canViewPayroll, router]);

  if (!canViewPayroll) return null;

  return <EmployeePayrollRangeView employeeId={employeeId} />;
}
