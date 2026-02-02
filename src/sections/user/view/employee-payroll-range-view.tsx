/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-plusplus */
// src/sections/payroll/employee-payroll-range-view.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Stack,
  TextField,
  MenuItem,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Divider,
} from '@mui/material';
import { enqueueSnackbar } from 'src/components/snackbar';
import { getEmployeePayrollRange } from 'src/api/payroll';
import { formatNumber } from 'src/utils/format-number'; // hoặc formatMoney của bạn

function monthOptions() {
  return Array.from({ length: 12 }, (_, i) => i + 1);
}
function yearOptions(centerYear = new Date().getFullYear()) {
  const ys = [];
  for (let y = centerYear - 3; y <= centerYear + 1; y++) ys.push(y);
  return ys;
}

export default function EmployeePayrollRangeView({ employeeId }: { employeeId: number }) {
  const now = new Date();
  const [fromMonth, setFromMonth] = useState(now.getMonth() + 1);
  const [fromYear, setFromYear] = useState(now.getFullYear());
  const [toMonth, setToMonth] = useState(now.getMonth() + 1);
  const [toYear, setToYear] = useState(now.getFullYear());

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const years = useMemo(() => yearOptions(now.getFullYear()), [now]);

  const handleFetch = async () => {
    try {
      setLoading(true);
      const res = await getEmployeePayrollRange(employeeId, {
        fromMonth,
        fromYear,
        toMonth,
        toYear,
      });
      setData(res);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Không lấy được dữ liệu lương', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // default load
    handleFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack spacing={2}>
      <Card sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Lương theo tháng
          </Typography>

          <TextField
            select
            label="Từ tháng"
            value={fromMonth}
            onChange={(e) => setFromMonth(Number(e.target.value))}
            size="small"
          >
            {monthOptions().map((m) => (
              <MenuItem key={m} value={m}>
                Tháng {m}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Năm"
            value={fromYear}
            onChange={(e) => setFromYear(Number(e.target.value))}
            size="small"
          >
            {years.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Đến tháng"
            value={toMonth}
            onChange={(e) => setToMonth(Number(e.target.value))}
            size="small"
          >
            {monthOptions().map((m) => (
              <MenuItem key={m} value={m}>
                Tháng {m}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Năm"
            value={toYear}
            onChange={(e) => setToYear(Number(e.target.value))}
            size="small"
          >
            {years.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>

          <Button variant="contained" disabled={loading} onClick={handleFetch}>
            {loading ? 'Đang tải...' : 'Xem'}
          </Button>
        </Stack>

        {data?.employee && (
          <Typography sx={{ mt: 1 }} variant="body2" color="text.secondary">
            Nhân viên: <b>{data.employee.full_name}</b> ({data.employee.username})
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Card variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="overline" color="text.secondary">
              Tổng NET
            </Typography>
            <Typography variant="h6">{formatNumber(data?.total_net_amount || 0)}</Typography>
          </Card>

          <Card variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="overline" color="text.secondary">
              Tổng GROSS
            </Typography>
            <Typography variant="h6">{formatNumber(data?.total_gross_amount || 0)}</Typography>
          </Card>
        </Stack>
      </Card>

      <Card sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tháng</TableCell>
              <TableCell align="right">Công</TableCell>

              <TableCell align="right">OT (giờ)</TableCell>
              <TableCell align="right">OT (tiền)</TableCell>

              <TableCell align="right">Thưởng</TableCell>
              <TableCell align="right">Phụ cấp</TableCell>
              <TableCell align="right">Phạt</TableCell>
              <TableCell align="right">Tạm ứng</TableCell>

              <TableCell align="right">Lương nhận</TableCell>

              <TableCell>Chốt</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {(data?.months || []).map((r: any) => (
              <TableRow key={`${r.year}-${r.month}`}>
                <TableCell>
                  {String(r.month).padStart(2, '0')}/{r.year}
                </TableCell>

                <TableCell align="right">{r.payroll.effective_work_days}</TableCell>

                <TableCell align="right">{r.payroll.overtime_hours}</TableCell>
                <TableCell align="right">{formatNumber(r.payroll.overtime_amount)}</TableCell>

                <TableCell align="right">{formatNumber(r.payroll.bonus_amount || 0)}</TableCell>
                <TableCell align="right">{formatNumber(r.payroll.allowance_amount || 0)}</TableCell>
                <TableCell align="right">{formatNumber(r.payroll.penalty_amount || 0)}</TableCell>
                <TableCell align="right">
                  {formatNumber(r.payroll.advance_approved_amount || 0)}
                </TableCell>

                <TableCell align="right">
                  <b>{formatNumber(r.payroll.net_amount)}</b>
                </TableCell>

                <TableCell>
                  {r.is_closed ? (
                    <Chip size="small" color="success" label="Đã chốt" />
                  ) : (
                    <Chip size="small" label="Tạm tính" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Stack>
  );
}
