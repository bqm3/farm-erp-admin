import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Card,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  Tooltip,
  IconButton,
  Divider,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import { closeAttendance, getMonthUsers, type MonthUserRow } from 'src/api/attendance';
import AttendanceDetailDialog from '../attendance-detail-dialog';

function nowMonthYear() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

const MONTHS = Array.from({ length: 12 }).map((_, i) => i + 1);

export default function AttendanceMonthView() {
  const { enqueueSnackbar } = useSnackbar();

  const init = useMemo(() => nowMonthYear(), []);
  const [month, setMonth] = useState<number>(init.month);
  const [year, setYear] = useState<number>(init.year);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MonthUserRow[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<{ id: number; name: string } | null>(null);

  const yearOptions = useMemo(() => {
    const y = init.year;
    return [y - 1, y, y + 1, y + 2];
  }, [init.year]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMonthUsers(month, year);
      setRows(res.data.users || []);
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Lỗi tải dữ liệu chấm công', { variant: 'error' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onOpenDetail = useCallback((r: MonthUserRow) => {
    setSelected({ id: r.employee_id, name: r.full_name || r.username });
    setDetailOpen(true);
  }, []);

  const onCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setSelected(null);
  }, []);

  const onCloseMonth = useCallback(async () => {
    try {
      const res = await closeAttendance(month, year);
      if (res?.ok) {
        enqueueSnackbar(res?.message || 'Đã chốt chấm công', { variant: 'success' });
      } else {
        enqueueSnackbar(res?.message || 'Chốt chấm công thất bại', { variant: 'error' });
      }
      // reload list (nếu backend cập nhật trạng thái)
      fetchData();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Lỗi chốt chấm công', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchData, month, year]);

  return (
    <Container maxWidth="xl">
      <Stack spacing={2}>
        <Typography variant="h4">Chấm công theo tháng</Typography>

        <Card sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <TextField
              select
              label="Tháng"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              sx={{ width: 160 }}
            >
              {MONTHS.map((m) => (
                <MenuItem key={m} value={m}>
                  Tháng {m}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Năm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              sx={{ width: 160 }}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:refresh-bold" />}
              onClick={fetchData}
              disabled={loading}
            >
              Tải lại
            </Button>

            <Stack flexGrow={1} />

            <Tooltip title="Chốt chấm công tháng này">
              <Button
                color="warning"
                variant="contained"
                startIcon={<Iconify icon="solar:lock-bold" />}
                onClick={onCloseMonth}
              >
                Chốt chấm công
              </Button>
            </Tooltip>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <TableContainer>
            {loading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nhân viên</TableCell>
                    <TableCell width={140}>Tài khoản</TableCell>
                    <TableCell width={140} align="right">
                      Ngày check-in
                    </TableCell>
                    <TableCell width={120} align="right">
                      Có mặt
                    </TableCell>
                    <TableCell width={120} align="right">
                      Đi trễ
                    </TableCell>
                    <TableCell width={140} align="right">
                      Tăng ca (giờ)
                    </TableCell>
                    <TableCell width={160} align="right">
                      Tăng ca (tiền)
                    </TableCell>
                    <TableCell width={90} align="center">
                      Chi tiết
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.employee_id} hover>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2">{r.full_name || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {r.username}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{r?.department?.name} | {r?.department?.code}</TableCell>
                      <TableCell align="right">{r.total_checkin_days}</TableCell>
                      <TableCell align="right">{r.present_days}</TableCell>
                      <TableCell align="right">{r.late_days}</TableCell>
                      <TableCell align="right">{Number(r.total_overtime_hours || 0)}</TableCell>
                      <TableCell align="right">
                        {Number(r.total_overtime_amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Xem chi tiết theo ngày">
                          <IconButton onClick={() => onOpenDetail(r)}>
                            <Iconify icon="solar:eye-bold" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Card>
      </Stack>

      <AttendanceDetailDialog
        open={detailOpen}
        onClose={onCloseDetail}
        employeeId={selected?.id || null}
        // employeeName={selected?.name}
        month={month}
        year={year}
      />
    </Container>
  );
}
