/* eslint-disable @typescript-eslint/no-shadow */
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
  Box,
  Tabs,
  Tab,
  Pagination,
  Grid,
  IconButton,
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
} from 'src/api/workcycle';
import { fetchDepartmentById } from 'src/api/department';
import { fDate, fDateTime } from 'src/utils/format-time';
import { listTasks, type TaskRow, approveTask, rejectTask, closeTask } from 'src/api/task';

import WorkCycleTaskCreateDialog from '../work-cycle-task-create-dialog';
import WorkCycleQuantityDialog from '../work-cycle-quantity-dialog';

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

function toInt(value: any) {
  return Math.trunc(Number(value || 0));
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

const TASK_TYPE_LABEL: Record<any, string> = {
  QUANTITY_UPDATE: 'Thay đổi số lượng',
  GENERAL: 'Thường ngày',
  EXPENSE: 'Chi phí',
};

function changeStatus(status: string | undefined) {
  if (status === 'PENDING') return 'Đợi duyệt';
  if (status === 'OPEN') return 'Đang làm';
  if (status === 'IN_PROGRESS') return 'Đang thực hiện';
  if (status === 'DONE') return 'Hoàn thành';
  if (status === 'REJECTED') return 'Từ chối';
  if (status === 'CLOSED') return 'Đã đóng';
  return status || null;
}


function calcDailyNumbers(changes = []) {
  let increase = 0;
  let decrease = 0;
  let net = 0;

  changes.forEach((c: any) => {
    const v = Number(c.change) || 0;
    net += v;
    if (v > 0) increase += v;
    if (v < 0) decrease += Math.abs(v);
  });

  return { increase, decrease, net };
}

export default function WorkCycleDetailsView() {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const params = useParams();
  const id = Number((params as any)?.id);
  const [closingId, setClosingId] = useState<number | null>(null);
  const [tab, setTab] = useState(0);

  const roles: string[] = user?.roles || [];
  const canApprove = roles.includes('ADMIN');
  const [openCreateTask, setOpenCreateTask] = useState(false);

  const [cycle, setCycle] = useState<WorkCycle | null>(null);

  const [openQty, setOpenQty] = useState(false);

  // ===== TAB 1: logs + stats =====
  const [logs, setLogs] = useState<QuantityLog[]>([]);
  const [logsSummary, setLogsSummary] = useState<any>(null);

  const [startDate, setStartDate] = useState('2025-12-01');
  const [endDate, setEndDate] = useState('2026-12-01');
  const [dailyStats, setDailyStats] = useState<any[]>([]);

  // ===== TAB 2: tasks DONE =====
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [taskPage, setTaskPage] = useState(1);
  const [taskLimit, setTaskLimit] = useState(10);
  const [taskTotal, setTaskTotal] = useState(0);

  const taskTotalPages = Math.max(1, Math.ceil(taskTotal / taskLimit));

  const fetchCycle = useCallback(async () => {
    if (!id) return;
    const res = await getWorkCycle(id);
    setCycle(res.data);
  }, [id]);

  const fetchDepartment = useCallback(async () => {
    if (!cycle?.department_id) return;
    await fetchDepartmentById(cycle.department_id);
  }, [cycle?.department_id]);

  const fetchLogs = useCallback(async () => {
    if (!id) return;
    const res = await getQuantityLogs(id, { page: 1, limit: 50 });
    setLogs(res.data || []);
    setLogsSummary(res.summary || null);
  }, [id]);

  const fetchStats = useCallback(async () => {
    if (!id) return;
    const res = await getQuantityStats(id, { start_date: startDate, end_date: endDate });
    setDailyStats(res.data.daily_stats || []);
  }, [id, startDate, endDate]);

  const fetchDoneTasks = useCallback(async () => {
    if (!id) return;

    const res = await listTasks({
      cycle_id: id,
      page: taskPage,
      limit: taskLimit,
    });

    const data = res?.data ?? res;
    setTasks(data ?? []);
    setTaskTotal(res?.count ?? 0);
  }, [id, taskPage, taskLimit]);

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

  useEffect(() => {
    if (tab === 1) fetchDoneTasks();
  }, [tab, fetchDoneTasks]);

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

  const handleUpdateQty = async (payload: any) => {
    try {
      await updateQuantity(id, payload);
      setOpenQty(false);
      await fetchCycle();
      await fetchLogs();
      await fetchStats();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Cập nhật số lượng thất bại', { variant: 'error' });
    }
  };

  const handleCloseTask = async (taskId: number) => {
    const ok = window.confirm('Bạn chắc chắn muốn đóng công việc này?');
    if (!ok) return;

    try {
      setClosingId(taskId);
      await closeTask(taskId);
      enqueueSnackbar('Đã đóng công việc', { variant: 'success' });
      await fetchDoneTasks();
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Đóng công việc thất bại', { variant: 'error' });
    } finally {
      setClosingId(null);
    }
  };

  const statusColor = cycle?.status === 'OPEN' ? 'success' : cycle?.status ? 'warning' : 'default';

  return (
    <Container maxWidth="xl">
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        {header}
        <Tooltip title="Cập nhật số lượng">
          <IconButton onClick={() => setOpenQty(true)}>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Info chung (card) */}
      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1">Thông tin</Typography>
        <Divider sx={{ my: 1.5 }} />

        <Stack spacing={0.75}>
          <InfoRow
            label="Khu vực"
            value={
              cycle?.department
                ? `${cycle.department.code} - ${cycle.department.name}`
                : cycle?.department_id
            }
          />
          <InfoRow
            label="Giống/loài"
            value={cycle?.species ? cycle.species.name : cycle?.species_id}
          />
          <InfoRow label="Vị trí" value={cycle?.location || '-'} />
          <InfoRow label="Số lượng ban đầu" value={Number(cycle?.initial_quantity) || 0} />
          <InfoRow label="Số lượng hiện tại" value={Number(cycle?.current_quantity) || 0} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Trạng thái:
            </Typography>
            <Label variant="soft" color={statusColor as any}>
              {cycle?.status || '-'}
            </Label>
          </Stack>
          <InfoRow label="Note" value={cycle?.note || '-'} />
        </Stack>
      </Card>

      {/* Tabs */}
      <Card sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab label="Lịch sử & Thống kê" />
          <Tab label="Công việc" />
        </Tabs>

        {/* TAB 1: logs + stats (mobile cards) */}
        <TabPanel value={tab} index={0}>
          {/* Logs */}
          <Card sx={{ p: 2, mb: 2 }} variant="outlined">
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ sm: 'center' }}
            >
              <Stack spacing={0.25}>
                <Typography variant="subtitle1">Lịch sử tăng/giảm</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {logsSummary
                    ? `+${logsSummary.total_increase || 0} / -${logsSummary.total_decrease || 0}`
                    : ''}
                </Typography>
              </Stack>

              <Button variant="contained" onClick={() => setOpenQty(true)}>
                Cập nhật số lượng
              </Button>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Grid container spacing={1.5}>
              {logs.map((l) => (
                <Grid item xs={12} key={l.id}>
                  <Card variant="outlined" sx={{ p: 1.5 }}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {CHANGE_TYPE_LABEL[l.change_type] || l.change_type}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                            {fDate(l.log_date)}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Label
                            variant="soft"
                            color={Number(l.quantity_change) >= 0 ? 'success' : 'error'}
                          >
                            {toInt(l.quantity_change) >= 0
                              ? `+${toInt(l.quantity_change)}`
                              : toInt(l.quantity_change)}
                          </Label>
                        </Stack>
                      </Stack>

                      <Divider />

                      <Stack direction="row" spacing={2} justifyContent="space-between">
                        <InfoRow label="Trước" value={toInt(l.quantity_before)} />
                        <InfoRow label="Sau" value={toInt(l.quantity_after)} />
                      </Stack>

                      <InfoRow label="Lý do" value={l.reason || '-'} />
                      <InfoRow
                        label="Người tạo"
                        value={l.creator ? l.creator.full_name : l.created_by}
                      />
                    </Stack>
                  </Card>
                </Grid>
              ))}

              {logs.length === 0 && (
                <Grid item xs={12}>
                  <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    Chưa có log
                  </Box>
                </Grid>
              )}
            </Grid>
          </Card>

          {/* Stats */}
          <Card sx={{ p: 2 }} variant="outlined">
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ sm: 'center' }}
              >
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  Thống kê theo ngày
                </Typography>

                <TextField
                  label="Ngày bắt đầu"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  size="small"
                />
                <TextField
                  label="Ngày kết thúc"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  size="small"
                />
                <Button variant="outlined" onClick={fetchStats}>
                  Xem
                </Button>
              </Stack>

              <Divider />

              <Grid container spacing={1.5}>
                {dailyStats.map((d) => {
                  const { increase, decrease, net } = calcDailyNumbers(d.changes);

                  return (
                    <Grid item xs={12} sm={6} md={4} key={d.date}>
                      <Card variant="outlined" sx={{ p: 1.5 }}>
                        <Stack spacing={1}>
                          <Typography variant="subtitle2">{fDate(d.date)}</Typography>

                          <Divider />

                          <InfoRow label="Đầu ngày" value={d.quantity_start} />
                          <InfoRow label="Tăng" value={increase} />
                          <InfoRow label="Giảm" value={decrease} />
                          <InfoRow label="Net" value={net} />
                          <InfoRow label="Cuối ngày" value={d.quantity_end} />

                          {/* Optional: hiển thị chi tiết biến động */}
                          {d.changes?.length > 0 && (
                            <>
                              <Divider />
                              <Stack spacing={0.5}>
                                {d.changes.map((c: any, i: any) => (
                                  <Typography
                                    key={i}
                                    variant="caption"
                                    color={c.change > 0 ? 'success.main' : 'error.main'}
                                  >
                                    {c.change > 0 ? '+' : ''}
                                    {c.change} — {c.type} ({c.reason})
                                  </Typography>
                                ))}
                              </Stack>
                            </>
                          )}
                        </Stack>
                      </Card>
                    </Grid>
                  );
                })}

                {dailyStats.length === 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                      Không có dữ liệu trong khoảng ngày
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Stack>
          </Card>
        </TabPanel>

        {/* TAB 2: tasks DONE (mobile cards) */}
        <TabPanel value={tab} index={1}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            spacing={1.5}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1">Danh sách phải làm</Typography>

              <Button
                variant="contained"
                size="small"
                startIcon={<Iconify icon="solar:add-circle-bold" />}
                onClick={() => setOpenCreateTask(true)}
              >
                Tạo công việc
              </Button>
            </Stack>

            <TextField
              label="Số dòng/trang"
              size="small"
              value={taskLimit}
              onChange={(e) => {
                const v = Math.max(1, Math.min(50, Number(e.target.value) || 10));
                setTaskLimit(v);
                setTaskPage(1);
              }}
              sx={{ width: { xs: '100%', sm: 140 } }}
            />
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Grid container spacing={1.5}>
            {tasks.map((t) => {
              const statusColor =
                t.status === 'PENDING'
                  ? 'warning'
                  : t.status === 'OPEN'
                  ? 'primary'
                  : t.status === 'IN_PROGRESS'
                  ? 'primary'
                  : t.status === 'REJECTED'
                  ? 'error'
                  : 'default';

              const canClose = t.status === 'OPEN' || t.status === 'IN_PROGRESS';
              const isClosing = closingId === t.id;

              return (
                <Grid item xs={12} key={t.id}>
                  <Card variant="outlined" sx={{ p: 1.5 }}>
                    <Stack spacing={1.25}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" noWrap>
                            {t.title}
                          </Typography>
                          {t.description ? (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                              {t.description}
                            </Typography>
                          ) : null}
                        </Box>

                        <Label variant="soft" color={statusColor as any}>
                          {changeStatus(t.status) || '-'}
                        </Label>
                      </Stack>

                      <Divider />

                   

                      <Stack spacing={0.75}>
                        <InfoRow label="Loại" value={TASK_TYPE_LABEL[t.task_type] || t.task_type} />
                        <InfoRow label="Thời gian" value={fDateTime(t.due_date)} />
                        <InfoRow label="Lý do từ chối" value={t.reject_reason || '-'} />
                      </Stack>

                         <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {canClose && (
                          <Button
                            size="small"
                            variant="contained"
                            color="warning"
                            onClick={() => handleCloseTask(t.id)}
                            disabled={isClosing}
                            startIcon={
                              isClosing ? (
                                <Iconify icon="eos-icons:loading" />
                              ) : (
                                <Iconify icon="solar:check-circle-bold" />
                              )
                            }
                          >
                            {isClosing ? 'Đang đóng...' : 'Đóng công việc'}
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>
              );
            })}

            {tasks.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>Chưa có task</Box>
              </Grid>
            )}
          </Grid>

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
      </Card>

      <WorkCycleQuantityDialog
        open={openQty}
        onClose={() => setOpenQty(false)}
        onSubmit={handleUpdateQty}
        cycleId={id}
      />

      <WorkCycleTaskCreateDialog
        open={openCreateTask}
        onClose={() => setOpenCreateTask(false)}
        cycleId={id}
        onCreated={() => {
          if (tab === 1) fetchDoneTasks();
        }}
        user={user}
      />
    </Container>
  );
}
