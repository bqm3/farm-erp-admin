/* eslint-disable no-nested-ternary */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Card,
  Stack,
  Button,
  TextField,
  Typography,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Box,
  MenuItem,
  CircularProgress,
  Pagination,
} from '@mui/material';
import Iconify from 'src/components/iconify';
import Label from 'src/components/label';

import { useAuthContext } from 'src/auth/hooks';
import { useSnackbar } from 'src/components/snackbar';

import {
  listAttendances,
  checkInAttendance,
  listAttendanceUsers,
  type AttendanceRow,
  type UserOption,
} from 'src/api/attendance';
import AttendanceCheckInDialog from '../attendance-checkin-dialog';
import AttendanceCancelHelpDialog from '../attendance-cancel-help-dialog';

function normalizeStatus(s?: string) {
  return String(s || '')
    .trim()
    .toUpperCase();
}

function getStatusMeta(status?: string) {
  const st = normalizeStatus(status);

  switch (st) {
    case 'PRESENT':
      return { text: 'Có mặt', color: 'success' as const };
    case 'LATE':
      return { text: 'Đi trễ', color: 'warning' as const };
    case 'ABSENT':
      return { text: 'Vắng', color: 'error' as const };
    case 'HELP':
      return { text: 'Chấm công hộ', color: 'info' as const };
    default:
      return { text: status || 'N/A', color: 'default' as const };
  }
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <Stack direction="row" spacing={1} sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
        {label}:
      </Typography>
      <Typography
        variant="body2"
        sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {value ?? '-'}
      </Typography>
    </Stack>
  );
}

function toDateDisplay(d: string) {
  // d: YYYY-MM-DD
  const [y, m, day] = d.split('-').map((x) => Number(x));
  return `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function toTimeDisplay(iso?: string) {
  if (!iso) return '-';
  const dt = new Date(iso);
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function AttendanceListView() {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const role = user?.roles?.[0]; // "ADMIN" | "ACCOUNTANT" | "MANAGER" | "STAFF"
  const canCheckInOther = role === 'ADMIN' || role === 'ACCOUNTANT' || role === 'MANAGER';

  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AttendanceRow[]>([]);

  const [openCancel, setOpenCancel] = useState(false);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [usersLoading, setUsersLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [employeeId, setEmployeeId] = useState<number | ''>('');

  const [openCheckInOther, setOpenCheckInOther] = useState(false);

  const titleName = useMemo(() => {
    if (!user) return '';
    return user.full_name || user.username || '';
  }, [user]);

  useEffect(() => {
    setPage(1);
  }, [month, year, employeeId]);

  const fetchUsers = useCallback(async () => {
    if (!canCheckInOther) {
      setUserOptions([]);
      setEmployeeId('');
      return;
    }

    setUsersLoading(true);
    try {
      const res = await listAttendanceUsers();
      setUserOptions(res.data || []);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Load users failed!', { variant: 'error' });
    } finally {
      setUsersLoading(false);
    }
  }, [canCheckInOther, enqueueSnackbar]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAttendances({
        month,
        year,
        employee_id: canCheckInOther ? (employeeId ? Number(employeeId) : undefined) : undefined,
        page,
        page_size: pageSize,
      });

      setRows(res.data?.rows || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.total_pages || 1);
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Load failed!', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [month, year, employeeId, canCheckInOther, page, pageSize, enqueueSnackbar]);

  const onOpenHelp = useCallback(() => {
    if (!canCheckInOther) {
      enqueueSnackbar('Bạn không có quyền chấm công hộ', { variant: 'warning' });
      return;
    }
    setOpenCheckInOther(true);
  }, [canCheckInOther, enqueueSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCheckInSelf = async () => {
    try {
      await checkInAttendance({});
      enqueueSnackbar('Check-in thành công!', { variant: 'success' });
      await fetchData();
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Check-in thất bại!', { variant: 'error' });
    }
  };

  const currentMonthText = `${String(month).padStart(2, '0')}/${year}`;

  return (
    <Container maxWidth="xl">
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">
          Chấm công tháng {currentMonthText} {role === 'STAFF' ? `- ${titleName}` : ''}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={handleCheckInSelf}
            startIcon={<Iconify icon="solar:login-2-bold" />}
            disabled={loading}
          >
            Check-in hôm nay
          </Button>

          {canCheckInOther && (
            <Button
              variant="outlined"
              onClick={onOpenHelp}
              startIcon={<Iconify icon="solar:user-check-bold" />}
            >
              Chấm công hộ
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            select
            label="Tháng"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            sx={{ width: { xs: 1, sm: 200 } }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const v = i + 1;
              return (
                <MenuItem key={v} value={v}>
                  Tháng {v}
                </MenuItem>
              );
            })}
          </TextField>

          <TextField
            label="Năm"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{ width: { xs: 1, sm: 200 } }}
          />

          {canCheckInOther && (
            <TextField
              select
              fullWidth
              label="Nhân viên (tuỳ chọn)"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={usersLoading}
            >
              <MenuItem value="">Tất cả nhân viên được phép xem</MenuItem>
              {userOptions.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.full_name} {u.username ? `(${u.username})` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            select
            label="Số dòng"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            sx={{ width: { xs: 1, sm: 200 } }}
          >
            {[12, 24, 48, 96].map((n) => (
              <MenuItem key={n} value={n}>
                {n}/trang
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            onClick={() => {
              setPage(1);
              fetchData();
            }}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={18} /> : <Iconify icon="solar:filter-bold" />
            }
            sx={{ width: { xs: 1, sm: 120 } }}
          >
            Lọc
          </Button>
        </Stack>
      </Card>

      {/* List */}
      <Grid container spacing={2}>
        {rows.map((r) => {
          const st = getStatusMeta(r.status);
          const isHelp = normalizeStatus(r.status) === 'HELP';
          const helperName = r.helper?.full_name || r.helper?.username || '-';

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={r.id}>
              <Card sx={{ p: 2 }}>
                <Stack spacing={1.25}>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" noWrap>
                        {toDateDisplay(r.date)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                        Check-in: {toTimeDisplay(r.check_in_time)}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Label color={st.color}>{st.text}</Label>

                      <Tooltip title={r.note || ''}>
                        <span>
                          <IconButton size="small" disabled={!r.note}>
                            <Iconify icon="solar:chat-round-dots-bold" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {isHelp && canCheckInOther && (
                        <Tooltip title="Huỷ chấm công hộ">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setCancelId(r.id);
                                setOpenCancel(true);
                              }}
                              disabled={loading}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>

                  <Divider />

                  <Stack spacing={0.75}>
                    <InfoRow label="Nhân viên" value={r.employee?.full_name || '-'} />
                    {isHelp && <InfoRow label="Người chấm hộ" value={helperName} />}

                    <InfoRow label="Trạng thái" value={st.text} />
                    <InfoRow label="Note" value={r.note || '-'} />
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          );
        })}

        {rows.length === 0 && !loading && (
          <Grid item xs={12}>
            <Card sx={{ p: 4 }}>
              <Typography align="center">Không có dữ liệu</Typography>
            </Card>
          </Grid>
        )}
      </Grid>

      {totalPages > 1 && (
        <Card sx={{ p: 2, mt: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Tổng: <b>{total}</b> bản ghi
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Trang {page}/{totalPages}
              </Typography>

              {/* MUI Pagination */}
              <Box>
                <Pagination
                  page={page}
                  count={totalPages}
                  onChange={(_, v) => setPage(v)}
                  color="primary"
                  disabled={loading}
                />
              </Box>
            </Stack>
          </Stack>
        </Card>
      )}

      {canCheckInOther && (
        <AttendanceCheckInDialog
          open={openCheckInOther}
          onClose={() => setOpenCheckInOther(false)}
          users={userOptions}
          defaultEmployeeId={employeeId ? Number(employeeId) : null}
          onSuccess={fetchData}
        />
      )}

      {canCheckInOther && (
        <AttendanceCancelHelpDialog
          open={openCancel}
          onClose={() => {
            setOpenCancel(false);
            setCancelId(null);
          }}
          attendanceId={cancelId}
          onSuccess={fetchData}
        />
      )}
    </Container>
  );
}
