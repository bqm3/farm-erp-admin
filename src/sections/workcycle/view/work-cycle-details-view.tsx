/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable consistent-return */
/* eslint-disable no-nested-ternary */
// src/sections/work-cycle/view/work-cycle-details-view.tsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Card,
  Stack,
  Typography,
  Button,
  Divider,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Box,
  Tabs,
  Tab,
  Pagination,
  Chip,
  Tooltip,
} from '@mui/material';
import { useAuthContext } from 'src/auth/hooks';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useParams } from 'src/routes/hooks';
import { useSnackbar } from 'src/components/snackbar';

import {
  getWorkCycle,
  updateQuantity,
  attachStaff,
  getQuantityLogs,
  getQuantityStats,
  type WorkCycle,
  type QuantityLog,
  QuantityChangeType,
} from 'src/api/workcycle';
import { fetchDepartmentById } from 'src/api/department';
import { fDate, fDateTime } from 'src/utils/format-time';
import {
  listTasks,
  type TaskRow,
  createTask,
  approveTask,
  rejectTask,
  closeTask,
} from 'src/api/task';

import TaskCreateDialog from '../task-create-dialog';
import WorkCycleQuantityDialog from '../work-cycle-quantity-dialog';
import WorkCycleStaffDialog from '../work-cycle-staff-dialog';
import WorkCycleReceiptListView from '../work-cycle-receipt-list-view';
import WorkCycleFinanceDialog from '../workcycle-finance-dialog';
import WorkCycleCloseDialog from '../workcycle-close-dialog';

function TabPanel({
  value,
  index,
  children,
}: {
  value: number;
  index: number;
  children: React.ReactNode;
}) {
  if (value !== index) return null;
  return <Box sx={{ mt: 2 }}>{children}</Box>;
}

const CHANGE_TYPE_LABEL: Record<any, string> = {
  TANG: 'Tăng',
  THEM: 'Thêm',
  GIAM: 'Giảm',
  SINH: 'Sinh',
  CHET: 'Chết',
  THU_HOACH: 'Xuất chuồng / Thu hoạch',
  BAN: 'Bán',
  OTHER: 'Khác',
};

function normalizeDailyStats(raw: any[]) {
  const map = new Map<string, any>();

  raw.forEach((item) => {
    const dateKey = item.date.slice(0, 10); // YYYY-MM-DD

    if (!map.has(dateKey)) {
      map.set(dateKey, {
        date: dateKey,
        quantity_start: item.quantity_start,
        quantity_end: item.quantity_end,
        changes: [...item.changes],
      });
    } else {
      const cur = map.get(dateKey);
      cur.changes.push(...item.changes);
      cur.quantity_end = item.quantity_end;
    }
  });

  return Array.from(map.values());
}

const TASK_STATUS_VI: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  OPEN: 'Đang mở',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
  REJECTED: 'Từ chối',
  CLOSED: 'Đã đóng',
};

const TASK_TYPE_VI: Record<string, string> = {
  GENERAL: 'Chung',
  QUANTITY_UPDATE: 'Cập nhật số lượng',
  EXPENSE: 'Chi phí',
  INCOME: 'Thu',
  RECEIPT: 'Phiếu',
  OTHER: 'Khác',
};

function taskTypeLabel(taskType?: string) {
  const t = String(taskType || '').toUpperCase();
  return TASK_TYPE_VI[t] || taskType || '-';
}

function taskStatusLabel(status?: string) {
  const s = String(status || '').toUpperCase();
  return TASK_STATUS_VI[s] || status || '-';
}

function normalizeStatus(status?: string) {
  return String(status || '').toUpperCase();
}

// Rule ẩn/hiện thao tác
function canShowApprove(status?: string) {
  const s = normalizeStatus(status);
  return s === 'PENDING';
}

function canShowReject(status?: string) {
  const s = normalizeStatus(status);
  return s === 'PENDING';
}

function canShowClose(status?: string) {
  const s = normalizeStatus(status);
  // chỉ cho đóng khi còn đang làm / đang mở / chờ duyệt
  return ['IN_PROGRESS'].includes(s);
}

function taskStatusColor(status?: string) {
  const s = String(status || '').toUpperCase();
  if (s === 'DONE') return 'success';
  if (s === 'REJECTED') return 'error';
  if (s === 'PENDING') return 'warning';
  if (s === 'IN_PROGRESS') return 'info';
  if (s === 'CLOSED') return 'default';
  if (s === 'GENERAL') return 'default';
  if (s === 'QUANTITY_UPDATE') return 'info';
  if (s === 'EXPENSE') return 'warning';
  if (s === 'INCOME') return 'success';
  if (s === 'RECEIPT') return 'primary';
  return 'primary'; // OPEN
}

export default function WorkCycleDetailsView() {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const params = useParams();
  const id = Number((params as any)?.id);

  const [tab, setTab] = useState(0);

  const [openCreateTask, setOpenCreateTask] = useState(false);
  const [openFinance, setOpenFinance] = useState(false);
  const [openClose, setOpenClose] = useState(false);

  const roles: string[] = user?.roles || [];
  const canApprove = roles.includes('ADMIN') || roles.includes('MANAGER');

  const [cycle, setCycle] = useState<WorkCycle | null>(null);

  const [openQty, setOpenQty] = useState(false);
  const [openStaff, setOpenStaff] = useState(false);

  // ===== TAB 0: logs + stats + (moved table from old Tab 1) =====
  const [logs, setLogs] = useState<QuantityLog[]>([]);
  const [logsSummary, setLogsSummary] = useState<any>(null);

  // applied (date thực sự dùng để query)
  const [appliedStartDate] = useState('2025-01-30');
  const [appliedEndDate] = useState('2026-12-30');

  const [dailyStats, setDailyStats] = useState<any[]>([]);

  // ===== STAFF (tab 3) =====
  const [department, setDepartment] = useState<any>(null);
  const [staffPage, setStaffPage] = useState(1);
  const staffLimit = 10;

  // ===== TASKS (tab 1) =====
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [taskPage, setTaskPage] = useState(1);
  const [taskLimit, setTaskLimit] = useState(10);
  const [taskTotal, setTaskTotal] = useState(0);
  const [closingTaskId, setClosingTaskId] = useState<number | null>(null);

  // ===== API fetchers =====
  const fetchCycle = useCallback(async () => {
    if (!id) return;
    const res = await getWorkCycle(id);
    setCycle(res.data);
  }, [id]);

  const fetchDepartment = useCallback(async () => {
    if (!cycle?.department_id) return;
    const res = await fetchDepartmentById(cycle.department_id);
    setDepartment(res);
  }, [cycle?.department_id]);

  const fetchLogs = useCallback(async () => {
    if (!id) return;
    const res = await getQuantityLogs(id, { page: 1, limit: 50 });
    setLogs(res.data || []);
    setLogsSummary(res.summary || null);
  }, [id]);

  const fetchStats = useCallback(async () => {
    if (!id) return;

    const res = await getQuantityStats(id, {
      start_date: appliedStartDate,
      end_date: appliedEndDate,
    });

    const raw = res.data.daily_stats || [];
    const normalized = normalizeDailyStats(raw);
    setDailyStats(normalized);
  }, [id, appliedStartDate, appliedEndDate]);

  // Tab 1: danh sách task (OPEN/PENDING/IN_PROGRESS/...) — dịch status sang tiếng Việt
  const fetchTodoTasks = useCallback(async () => {
    if (!id) return;

    const res = await listTasks({
      cycle_id: id,
      // nếu backend support: status: 'PENDING,OPEN,IN_PROGRESS'
      page: taskPage,
      limit: taskLimit,
    });

    setTasks(res.data ?? []);
    setTaskTotal(res.count ?? 0);
  }, [id, taskPage, taskLimit]);

  // ===== effects =====
  useEffect(() => {
    fetchCycle();
  }, [fetchCycle]);

  useEffect(() => {
    fetchDepartment();
  }, [fetchDepartment]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // chỉ fetch tasks khi vào tab 1 hoặc đổi page/limit
  useEffect(() => {
    if (tab === 1) fetchTodoTasks();
  }, [tab, fetchTodoTasks]);

  // ===== handlers =====
  const handleCreateTask = async (p: any) => {
    try {
      await createTask({ cycle_id: id, ...p });
      enqueueSnackbar('Đã tạo công việc', { variant: 'success' });
      setOpenCreateTask(false);
      setTaskPage(1);
      await fetchTodoTasks();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Tạo công việc thất bại', { variant: 'error' });
    }
  };

  const handleApprove = async (taskId: number) => {
    try {
      await approveTask(taskId);
      enqueueSnackbar('Đã duyệt công việc', { variant: 'success' });
      await fetchTodoTasks();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Duyệt thất bại', { variant: 'error' });
    }
  };

  const handleReject = async (taskId: number) => {
    const reason = window.prompt('Lý do từ chối (không bắt buộc):') || '';
    try {
      await rejectTask(taskId, reason);
      enqueueSnackbar('Đã từ chối công việc', { variant: 'success' });
      await fetchTodoTasks();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Từ chối thất bại', { variant: 'error' });
    }
  };

  const handleCloseTask = async (taskId: number) => {
    const ok = window.confirm('Bạn chắc chắn muốn đóng công việc này?');
    if (!ok) return;

    try {
      setClosingTaskId(taskId);
      await closeTask(taskId);
      enqueueSnackbar('Đã đóng công việc', { variant: 'success' });
      await fetchTodoTasks();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Đóng công việc thất bại', { variant: 'error' });
    } finally {
      setClosingTaskId(null);
    }
  };

  const handleUpdateQty = async (payload: any) => {
    try {
      await updateQuantity(id, payload);
      setOpenQty(false);
      await fetchCycle();
      await fetchLogs();
      await fetchStats();
      enqueueSnackbar('Đã cập nhật số lượng', { variant: 'success' });
    } catch (e: any) {
      enqueueSnackbar((e as any)?.message || 'Cập nhật số lượng thất bại', { variant: 'error' });
    }
  };

  const handleAttachStaff = async (payload: any) => {
    try {
      await attachStaff(id, payload);
      setOpenStaff(false);
      await fetchCycle();
      enqueueSnackbar('Đã gắn nhân viên', { variant: 'success' });
    } catch (e: any) {
      enqueueSnackbar((e as any)?.message || 'Gắn nhân viên thất bại', { variant: 'error' });
    }
  };

  const reloadDetail = async () => {
    await fetchCycle();
    await fetchLogs();
    await fetchStats();
  };

  // ===== memo/header =====
  const header = useMemo(() => {
    if (!cycle) return null;
    return (
      <Stack spacing={0.5}>
        <Typography variant="h5">{cycle.name}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Mã: {cycle.code} • Ngày bắt đầu: {fDate(cycle.start_date)}
        </Typography>
      </Stack>
    );
  }, [cycle]);

  // ===== STAFF pagination (client-side trên cycle.staffs) =====
  const staffs = cycle?.staffs || [];
  const staffTotalPages = Math.max(1, Math.ceil(staffs.length / staffLimit));
  const staffsPaged = staffs.slice((staffPage - 1) * staffLimit, staffPage * staffLimit);

  // ===== TASK pagination (server-side) =====
  const taskTotalPages = Math.max(1, Math.ceil(taskTotal / taskLimit));

  return (
    <Container maxWidth="xl">
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        {header}
        <Stack direction="row" spacing={1}>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setOpenFinance(true)}>
              Tổng kết thu - chi
            </Button>

            {canApprove && cycle?.status === 'OPEN' && (
              <Button variant="contained" color="error" onClick={() => setOpenClose(true)}>
                Đóng công việc
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>

      {/* Info chung */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Thông tin</Typography>
        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={0.5}>
          <Typography variant="body2">
            Khu vực:{' '}
            {cycle?.department
              ? `${cycle.department.code} - ${cycle.department.name}`
              : cycle?.department_id}
          </Typography>
          <Typography variant="body2">
            Giống/loài: {cycle?.species ? cycle.species.name : cycle?.species_id}
          </Typography>
          <Typography variant="body2">Vị trí: {cycle?.location || '-'}</Typography>
          <Typography variant="body2">
            Số lượng ban đầu: {Number(cycle?.initial_quantity)}
          </Typography>
          <Typography variant="body2">
            Số lượng hiện tại: {Number(cycle?.current_quantity)}
          </Typography>
          <Box>
            Trạng thái:{' '}
            <Label variant="soft" color={(cycle?.status === 'OPEN' && 'info') || 'default'}>
              {cycle?.status}
            </Label>
          </Box>
          <Typography variant="body2">Ghi chú: {cycle?.note || '-'}</Typography>
        </Stack>
      </Card>

      {/* Tabs */}
      <Card sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab label="Lịch sử & Thống kê" />
          <Tab label="Danh sách công việc phải làm" />
          <Tab label="Phiếu thu/ chi" />
          <Tab label={`Nhân sự (${staffs.length})`} />
        </Tabs>

        {/* TAB 0: logs + dailyStats summary + moved detail table from old tab 1 */}
        <TabPanel value={tab} index={0}>
          {/* Summary theo ngày */}
          <Card sx={{ p: 2, mb: 2 }} variant="outlined">
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack>
                <Typography variant="subtitle1">Tổng hợp theo ngày</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {logsSummary
                    ? `+${logsSummary.total_increase || 0} / -${logsSummary.total_decrease || 0}`
                    : ''}
                </Typography>
              </Stack>

              <Button
                variant="contained"
                startIcon={<Iconify icon="mdi:plus-box-outline" />}
                onClick={() => setOpenQty(true)}
              >
                Cập nhật số lượng
              </Button>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ngày</TableCell>
                    <TableCell align="right">Tăng</TableCell>
                    <TableCell align="right">Giảm</TableCell>
                    <TableCell align="right">Thực tế</TableCell>
                    <TableCell align="right">SL cuối ngày</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {dailyStats.map((d) => {
                    const increase = d.changes
                      .filter((c: any) => c.change > 0)
                      .reduce((s: number, c: any) => s + c.change, 0);

                    const decrease = d.changes
                      .filter((c: any) => c.change < 0)
                      .reduce((s: number, c: any) => s + Math.abs(c.change), 0);

                    const net = increase - decrease;

                    return (
                      <TableRow key={d.date} hover>
                        <TableCell>{fDate(d.date)}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          {increase}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>
                          {decrease}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: net >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {net}
                        </TableCell>
                        <TableCell align="right">{d.quantity_end}</TableCell>
                      </TableRow>
                    );
                  })}

                  {dailyStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* BẢNG CHI TIẾT thay đổi (chuyển từ tab 1 cũ sang tab 0) */}
          <Card sx={{ p: 2 }} variant="outlined">
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Chi tiết tăng/giảm</Typography>
              <Button
                variant="outlined"
                onClick={fetchStats}
                startIcon={<Iconify icon="mdi:refresh" />}
              >
                Tải lại
              </Button>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Thời gian</TableCell>
                    <TableCell align="right">SL đầu</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell align="right">Thay đổi</TableCell>
                    <TableCell>Lý do</TableCell>
                    <TableCell align="right">SL cuối</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {dailyStats.map((d) => {
                    const hasChanges = d.changes && d.changes.length > 0;

                    if (!hasChanges) {
                      return (
                        <TableRow key={d.date}>
                          <TableCell>{fDate(d.date)}</TableCell>
                          <TableCell align="right">{d.quantity_start}</TableCell>
                          <TableCell colSpan={3} align="center">
                            -
                          </TableCell>
                          <TableCell align="right">{d.quantity_end}</TableCell>
                        </TableRow>
                      );
                    }

                    return d.changes.map((c: any, idx: number) => (
                      <TableRow key={`${d.date}-${idx}`} hover>
                        {idx === 0 ? (
                          <>
                            <TableCell rowSpan={d.changes.length}>{fDate(d.date)}</TableCell>
                            <TableCell align="right" rowSpan={d.changes.length}>
                              {d.quantity_start}
                            </TableCell>
                          </>
                        ) : null}

                        <TableCell>{CHANGE_TYPE_LABEL[c.type] || c.type}</TableCell>

                        <TableCell
                          align="right"
                          sx={{ color: c.change > 0 ? 'success.main' : 'error.main' }}
                        >
                          {c.change > 0 ? `+${c.change}` : c.change}
                        </TableCell>

                        <TableCell>{c.reason || '-'}</TableCell>

                        {idx === d.changes.length - 1 ? (
                          <TableCell align="right">{d.quantity_end}</TableCell>
                        ) : null}
                      </TableRow>
                    ));
                  })}

                  {dailyStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </TabPanel>

        {/* TAB 1: TASK LIST */}
        <TabPanel value={tab} index={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack>
              <Typography variant="subtitle1">Danh sách công việc phải làm</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Tổng: {taskTotal}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                startIcon={<Iconify icon="mdi:plus" />}
                onClick={() => setOpenCreateTask(true)}
              >
                Tạo công việc
              </Button>

              <TextField
                label="Limit"
                size="small"
                value={taskLimit}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(50, Number(e.target.value) || 10));
                  setTaskLimit(v);
                  setTaskPage(1);
                }}
                sx={{ width: 120 }}
              />
            </Stack>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hạn</TableCell>
                  <TableCell>Tiêu đề</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Người được giao</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {tasks.map((t: any) => {
                  const assignedUser =
                    (department?.data?.members || []).find((m: any) => m.id === t.assigned_to) ||
                    null;

                  const status = normalizeStatus(t.status);

                  const showApprove = canApprove && canShowApprove(status);
                  const showReject = canApprove && canShowReject(status);
                  const showClose = canShowClose(status);

                  // nếu không có thao tác nào thì ẩn cột thao tác luôn (hiện dấu "-")
                  const hasActions = showApprove || showReject || showClose;

                  return (
                    <TableRow key={t.id} hover>
                      <TableCell>{t.created_at ? fDate(t.created_at) : '-'}</TableCell>

                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {t.title || '-'}
                          </Typography>
                          {t.description ? (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {t.description}
                            </Typography>
                          ) : null}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip size="small" label={taskTypeLabel(t.task_type)} color={taskStatusColor(t.task_type)}/>
                      </TableCell>

                      <TableCell>
                        {assignedUser
                          ? `${assignedUser.full_name} (${assignedUser.username})`
                          : t.assigned_to || '-'}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={taskStatusLabel(status)}
                          color={taskStatusColor(status) as any}
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell align="right">
                        {hasActions ? (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {showApprove && (
                              <Tooltip title="Duyệt">
                                <span>
                                  <Button
                                    size="small"
                                    color='success'
                                    variant="contained"
                                    onClick={() => handleApprove(t.id)}
                                    disabled={closingTaskId === t.id}
                                  >
                                    Duyệt
                                  </Button>
                                </span>
                              </Tooltip>
                            )}

                            {showReject && (
                              <Tooltip title="Từ chối">
                                <span>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleReject(t.id)}
                                    disabled={closingTaskId === t.id}
                                  >
                                    Từ chối
                                  </Button>
                                </span>
                              </Tooltip>
                            )}

                            {showClose && (
                              <Tooltip title="Đóng công việc">
                                <span>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleCloseTask(t.id)}
                                    disabled={closingTaskId === t.id}
                                  >
                                    Đóng
                                  </Button>
                                </span>
                              </Tooltip>
                            )}
                          </Stack>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      Không có công việc
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {taskTotal > 0 && (
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
              <Pagination
                page={taskPage}
                count={taskTotalPages}
                onChange={(_, p) => setTaskPage(p)}
              />
            </Stack>
          )}
        </TabPanel>

        {/* TAB 2: receipts */}
        <TabPanel value={tab} index={2}>
          <WorkCycleReceiptListView workCycleId={id} canApprove={canApprove} />
        </TabPanel>

        {/* TAB 3: staffs */}
        <TabPanel value={tab} index={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Stack>
              <Typography variant="subtitle1">Nhân sự trong kỳ làm việc</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Số lượng: {department?.data?.members?.length || 0}
              </Typography>
            </Stack>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mdi:account-multiple-plus-outline" />}
              onClick={() => setOpenStaff(true)}
            >
              Gắn nhân viên
            </Button>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nhân viên</TableCell>
                  <TableCell>SĐT</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Thời gian giao</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Ghi chú</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffsPaged.map((s: any) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      {s.full_name} ({s.username})
                    </TableCell>
                    <TableCell>{s.phone || '-'}</TableCell>
                    <TableCell>{s.email || '-'}</TableCell>
                    <TableCell>{fDate(s.work_cycle_staff?.assigned_at)}</TableCell>
                    <TableCell>{s.work_cycle_staff?.status || '-'}</TableCell>
                    <TableCell>{s.work_cycle_staff?.note || '-'}</TableCell>
                  </TableRow>
                ))}
                {staffs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      Chưa có nhân sự được gắn
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {staffs.length > 0 && (
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
              <Pagination
                page={staffPage}
                count={staffTotalPages}
                onChange={(_, p) => setStaffPage(p)}
              />
            </Stack>
          )}
        </TabPanel>
      </Card>

      {/* dialogs */}
      <WorkCycleQuantityDialog
        open={openQty}
        onClose={() => setOpenQty(false)}
        onSubmit={handleUpdateQty}
        cycleId={id}
      />

      <WorkCycleStaffDialog
        open={openStaff}
        onClose={() => setOpenStaff(false)}
        employees={department?.data?.members || []}
        onSubmit={handleAttachStaff}
      />

      <TaskCreateDialog
        open={openCreateTask}
        onClose={() => setOpenCreateTask(false)}
        employees={department?.data?.members || []}
        onSubmit={handleCreateTask}
      />

      <WorkCycleFinanceDialog
        open={openFinance}
        onClose={() => setOpenFinance(false)}
        workCycleId={cycle?.id}
      />

      <WorkCycleCloseDialog
        open={openClose}
        onClose={() => setOpenClose(false)}
        workCycleId={cycle?.id}
        onClosed={reloadDetail}
      />
    </Container>
  );
}
