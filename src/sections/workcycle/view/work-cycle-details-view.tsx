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
} from '@mui/material';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useParams } from 'src/routes/hooks';

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

import WorkCycleQuantityDialog from '../work-cycle-quantity-dialog';
import WorkCycleStaffDialog from '../work-cycle-staff-dialog';

export default function WorkCycleDetailsView() {
    const params = useParams();
    const id = Number((params as any)?.id);

    const [cycle, setCycle] = useState<WorkCycle | null>(null);

    const [openQty, setOpenQty] = useState(false);
    const [openStaff, setOpenStaff] = useState(false);

    const [logs, setLogs] = useState<QuantityLog[]>([]);
    const [logsSummary, setLogsSummary] = useState<any>(null);
    
    const [department, setDepartment] = useState<any>(null);

    const [startDate, setStartDate] = useState('2025-12-01');
    const [endDate, setEndDate] = useState('2026-12-01');
    const [dailyStats, setDailyStats] = useState<any[]>([]);

    const fetchCycle = useCallback(async () => {
        if (!id) return;
        const res = await getWorkCycle(id);
        setCycle(res.data);
    }, [id]);

    const fetchDepartment = useCallback(async () => {
        if (!cycle?.department_id) return null;
        const reasons = await fetchDepartmentById(cycle.department_id);
        
        setDepartment(reasons);
    }, [cycle?.department_id]);

    console.log('department', department)


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

    useEffect(() => {
        fetchCycle();
        fetchLogs();
        fetchStats();
        fetchDepartment()
    }, [fetchCycle, fetchLogs, fetchStats, fetchDepartment]);

    const header = useMemo(() => {
        if (!cycle) return null;
        return (
            <Stack spacing={0.5}>
                <Typography variant="h5">{cycle.name}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Code: {cycle.code} • Ngày bắt đầu: {cycle.start_date}
                </Typography>
            </Stack>
        );
    }, [cycle]);

    const handleUpdateQty = async (payload: any) => {
        await updateQuantity(id, payload);
        setOpenQty(false);
        await fetchCycle();
        await fetchLogs();
        await fetchStats();
    };

    const handleAttachStaff = async (payload: any) => {
        await attachStaff(id, payload);
        setOpenStaff(false);
        await fetchCycle();
    };

    console.log('department', department)

    return (
        <Container maxWidth="xl">
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                {header}
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        startIcon={<Iconify icon="mdi:plus-box-outline" />}
                        onClick={() => setOpenQty(true)}
                    >
                        Cập nhật số lượng
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Iconify icon="mdi:account-multiple-plus-outline" />}
                        onClick={() => setOpenStaff(true)}
                    >
                        Gắn staff
                    </Button>
                </Stack>
            </Stack>

            {/* Info */}
            <Card sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">Thông tin</Typography>
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={0.5}>
                    <Typography variant="body2">
                        Khu vực: {cycle?.department ? `${cycle.department.code} - ${cycle.department.name}` : cycle?.department_id}
                    </Typography>
                    <Typography variant="body2">Giống/loài: {cycle?.species ? cycle.species.name : cycle?.species_id}</Typography>
                    <Typography variant="body2">Vị trí: {cycle?.location || '-'}</Typography>
                    <Typography variant="body2">Số lượng ban đầu: {cycle?.initial_quantity}</Typography>
                    <Typography variant="body2">Số lượng hiện tại: {cycle?.current_quantity}</Typography>
                    <Box>
                        Trạng thái:
                        <Label variant="soft" color={(cycle?.status === 'OPEN' && 'info') || 'default'}>
                            {cycle?.status}
                        </Label>
                    </Box>
                    <Box>
                        <Typography variant="body2">Note: {cycle?.note || '-'}</Typography>
                    </Box>
                </Stack>
            </Card>

            {/* Logs */}
            <Card sx={{ p: 2, mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1">Lịch sử tăng/giảm (Quantity Logs)</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {logsSummary ? `+${logsSummary.total_increase || 0} / -${logsSummary.total_decrease || 0}` : ''}
                    </Typography>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Ngày</TableCell>
                                <TableCell>Loại</TableCell>
                                <TableCell align="right">Trước</TableCell>
                                <TableCell align="right">Thay đổi</TableCell>
                                <TableCell align="right">Sau</TableCell>
                                <TableCell>Lý do</TableCell>
                                <TableCell>Người tạo</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs.map((l) => (
                                <TableRow key={l.id} hover>
                                    <TableCell>{l.log_date}</TableCell>
                                    <TableCell>{l.change_type === 'INCREASE' ? 'Tăng' : l.change_type === 'DECREASE' ? 'Giảm' : '-'}</TableCell>
                                    <TableCell align="right">{l.quantity_before}</TableCell>
                                    <TableCell align="right">{l.quantity_change}</TableCell>
                                    <TableCell align="right">{l.quantity_after}</TableCell>
                                    <TableCell>{l.reason || '-'}</TableCell>
                                    <TableCell>{l.creator ? l.creator.full_name : l.created_by}</TableCell>
                                </TableRow>
                            ))}

                            {logs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        Chưa có log
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Stats */}
            <Card sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                        Thống kê theo ngày (Quantity Stats)
                    </Typography>

                    <TextField
                        label="Start (yyyy-MM-dd)"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        size="small"
                    />
                    <TextField
                        label="End (yyyy-MM-dd)"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        size="small"
                    />
                    <Button variant="outlined" onClick={fetchStats}>
                        Xem
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
                                <TableCell align="right">Net</TableCell>
                                <TableCell align="right">Số lượng cuối ngày</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {dailyStats.map((d) => (
                                <TableRow key={d.date} hover>
                                    <TableCell>{d.date}</TableCell>
                                    <TableCell align="right">{d.increase}</TableCell>
                                    <TableCell align="right">{d.decrease}</TableCell>
                                    <TableCell align="right">{d.net}</TableCell>
                                    <TableCell align="right">{d.quantity_end}</TableCell>
                                </TableRow>
                            ))}

                            {dailyStats.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        Không có dữ liệu trong khoảng ngày
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            <WorkCycleQuantityDialog open={openQty} onClose={() => setOpenQty(false)} onSubmit={handleUpdateQty} />
            <WorkCycleStaffDialog open={openStaff} onClose={() => setOpenStaff(false)} employees={department?.data?.employees || []} onSubmit={handleAttachStaff} />
        </Container>
    );
}
