/* eslint-disable no-nested-ternary */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unneeded-ternary */
// src/sections/receipts/view/receipt-list-view.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Card,
  Stack,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Pagination,
  Typography,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Collapse,
  Box,
  Divider,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import {
  listReceipts,
  createReceipt,
  approveReceipt,
  createReceiptChangeRequest,
  type ReceiptCreatePayload,
} from 'src/api/receipts';

import { fDate } from 'src/utils/format-time';
import ReceiptCreateDialog from '../receipt-create-dialog';
import ReceiptDetailDialog from '../receipt-detail-dialog';
import ReceiptChangeRequestDialog from '../receipt-change-request-dialog';

// ===== Helpers =====
function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function money(v: any) {
  const n = toNumber(v, 0);
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n);
}

function qty(v: any) {
  const n = toNumber(v, 0);
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(n);
}

function hasText(v: any) {
  return typeof v === 'string' ? v.trim().length > 0 : !!v;
}

function joinParts(parts: Array<string | null | undefined>, sep = ' • ') {
  return parts.filter((x) => typeof x === 'string' && x.trim().length > 0).join(sep);
}

type Props = {
  roles?: string[];
};

export default function ReceiptListView({ roles = [] }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const isAdmin = roles.includes('ADMIN');

  const [loading, setLoading] = useState(false);

  // filters
  const [qCode, setQCode] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [workCycleId, setWorkCycleId] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  // paging
  const [page, setPage] = useState(1);
  const limit = 20;

  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  // row expand
  const [openRowIds, setOpenRowIds] = useState<Record<number, boolean>>({});

  // dialogs
  const [openCreate, setOpenCreate] = useState(false);

  const [openDetail, setOpenDetail] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const [openCR, setOpenCR] = useState(false);
  const [crReceiptId, setCrReceiptId] = useState<number | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listReceipts({
        page,
        limit,
        code: qCode?.trim() ? qCode.trim() : undefined,
        type: type ? (type as any) : undefined,
        status: status ? (status as any) : undefined,
        work_cycle_id: workCycleId ? workCycleId : undefined,
        from: from || undefined,
        to: to || undefined,
      });

      setRows(res.data || []);
      setTotal(toInt(res.total, 0));
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Không tải được danh sách phiếu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleOpenDetail = (id: number) => {
    setDetailId(id);
    setOpenDetail(true);
  };

  const handleSubmitCreate = async (payload: ReceiptCreatePayload) => {
    try {
      await createReceipt(payload);
      enqueueSnackbar('Tạo phiếu thành công', { variant: 'success' });
      await fetchData();
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Có lỗi xảy ra', { variant: 'error' });
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm('Duyệt phiếu và áp vào kho / số lượng?')) return;

    try {
      await approveReceipt(id);
      enqueueSnackbar('Duyệt phiếu thành công', { variant: 'success' });
      await fetchData();
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Có lỗi xảy ra', { variant: 'error' });
    }
  };

  const handleOpenCR = async (receiptId: number) => {
    setCrReceiptId(receiptId);
    setOpenCR(true);
  };

  const handleSubmitCR = async (payload: {
    request_type: any;
    reason: string;
    proposed_payload?: any;
  }) => {
    if (!crReceiptId) return;
    try {
      await createReceiptChangeRequest(crReceiptId, payload);
      enqueueSnackbar('Gửi yêu cầu thành công', { variant: 'success' });
      setOpenCR(false);
      await fetchData();
    } catch (err: any) {
      enqueueSnackbar(err?.message || 'Không tạo được yêu cầu', { variant: 'error' });
    }
  };

  const renderStatus = (s: string) => {
    if (s === 'CHO_DUYET') return <Chip size="small" label="Chờ duyệt" color="warning" />;
    if (s === 'DA_DUYET') return <Chip size="small" label="Đã duyệt" color="success" />;
    if (s === 'TU_CHOI') return <Chip size="small" label="Từ chối" color="error" />;
    if (s === 'DANG_KY') return <Chip size="small" label="Đăng ký" color="info" />;
    return <Chip size="small" label={s || '-'} color="default" />;
  };

  const getTypeLabel = (t?: string | null) => {
    if (t === 'THU') return <Chip size="small" label="THU" color="success" />;
    if (t === 'CHI') return <Chip size="small" label="CHI" color="warning" />;
    return <Chip size="small" label={t || '-'} color="default" />;
  };

  const getSubtypeLabel = (t?: string | null) => {
    const map: Record<string, { label: string; color: any }> = {
      THU_HOACH: { label: 'Thu hoạch', color: 'info' },
      SOLD: { label: 'Bán', color: 'info' },
      XUAT: { label: 'Xuất', color: 'secondary' },
      NHAP: { label: 'Nhập', color: 'secondary' },
      THEM: { label: 'Thêm', color: 'secondary' },
      TANG: { label: 'Tăng', color: 'secondary' },
      GIAM: { label: 'Giảm', color: 'secondary' },
      CHET: { label: 'Chết', color: 'secondary' },
      BAN: { label: 'Bán', color: 'info' },
    };
    const k = String(t || '');
    if (map[k]) return <Chip size="small" label={map[k].label} color={map[k].color} />;
    return <Chip size="small" label={t || '-'} color="default" />;
  };

  const getSourceLabel = (s?: string | null) => {
    if (s === 'KHO') return <Chip size="small" label="Kho" color="secondary" />;
    if (s === 'BEN_NGOAI') return <Chip size="small" label="Bên ngoài" color="primary" />;
    return <Chip size="small" label={s || '-'} color="default" />;
  };

  const toggleRow = (id: number) => {
    setOpenRowIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetFilters = () => {
    setQCode('');
    setType('');
    setStatus('');
    setWorkCycleId('');
    setFrom('');
    setTo('');
    setPage(1);
    setOpenRowIds({});
    setTimeout(fetchData, 0);
  };

  return (
    <Container maxWidth="xl">
      <Stack spacing={2}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={1}
        >
          <Stack spacing={0.5}>
            <Typography variant="h4">Danh sách phiếu</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Tổng: <b>{total}</b> phiếu • Trang <b>{page}</b>/<b>{totalPages}</b>
              {loading ? ' • Đang tải...' : ''}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpenCreate(true)}
            >
              Tạo phiếu
            </Button>
          </Stack>
        </Stack>

        {/* Filters */}
        <Card sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', md: 'center' }}
              justifyContent="space-between"
              flexWrap="wrap"
              useFlexGap
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
                alignItems={{ xs: 'stretch', md: 'center' }}
                flexWrap="wrap"
                useFlexGap
              >
                <TextField
                  label="Tìm theo mã (code)"
                  value={qCode}
                  onChange={(e) => setQCode(e.target.value)}
                  sx={{ width: { xs: '100%', md: 240 } }}
                />

                <TextField
                  select
                  label="Loại"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  sx={{ width: { xs: '100%', md: 180 } }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="THU">THU</MenuItem>
                  <MenuItem value="CHI">CHI</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Trạng thái"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  sx={{ width: { xs: '100%', md: 200 } }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="DANG_KY">Đăng ký</MenuItem>
                  <MenuItem value="CHO_DUYET">Chờ duyệt</MenuItem>
                  <MenuItem value="DA_DUYET">Đã duyệt</MenuItem>
                  <MenuItem value="TU_CHOI">Từ chối</MenuItem>
                </TextField>

                <TextField
                  label="Work cycle ID"
                  value={workCycleId}
                  onChange={(e) => setWorkCycleId(e.target.value)}
                  sx={{ width: { xs: '100%', md: 170 } }}
                  placeholder="vd: 1"
                />

                <TextField
                  type="date"
                  label="Từ ngày"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  sx={{ width: { xs: '100%', md: 170 } }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="date"
                  label="Đến ngày"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  sx={{ width: { xs: '100%', md: 170 } }}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" color="inherit" onClick={resetFilters}>
                  Reset
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Iconify icon="eva:search-fill" />}
                  onClick={() => {
                    setPage(1);
                    fetchData();
                  }}
                  disabled={loading}
                >
                  Tìm kiếm
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        {/* Table */}
        <Card>
          <TableContainer sx={{ maxHeight: 640 }}>
            <Table
              size="small"
              stickyHeader
              sx={{
                // minWidth: 1420,
                tableLayout: 'fixed',
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 20 }} />
                  <TableCell sx={{ width: 100 }}>Ngày</TableCell>
                  <TableCell sx={{ width: 260 }}>Mã phiếu</TableCell>
                  <TableCell sx={{ width: 80 }}>Loại</TableCell>
                  <TableCell sx={{ width: 120 }}>Hành động</TableCell>
                  <TableCell sx={{ width: 300 }}>Liên quan</TableCell>
                  <TableCell sx={{ width: 160 }} align="right">
                    Tổng tiền
                  </TableCell>
                  <TableCell sx={{ width: 170 }}>Người tạo</TableCell>
                  <TableCell sx={{ width: 130 }}>Trạng thái</TableCell>
                  <TableCell sx={{ width: 100 }} align="right">
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((r, idx) => {
                  const isOpen = !!openRowIds[r.id];

                  const typeLabel = getTypeLabel(r?.type);
                  const subtypeLabel = getSubtypeLabel(r?.subtype ?? null);
                  const sourceLabel = getSourceLabel(r?.source);

                  const employeeName = r?.employee?.full_name || r?.creator?.full_name || '-';

                  // liên quan: cycle / warehouse / fund / partner (chỉ hiển thị cái có)
                  // liên quan: chỉ hiển thị khi object đầy đủ (KHÔNG hiển thị id)
                  const cycleText = hasText(r?.cycle?.name) ? `Chu kỳ: ${r.cycle.name}` : null;
                  const warehouseText = hasText(r?.warehouse?.name)
                    ? `Kho: ${r.warehouse.name}`
                    : null;

                  const fundText = hasText(r?.fund?.name) ? `Quỹ: ${r.fund.name}` : null;
                  const partnerText = hasText(r?.partner?.shop_name)
                    ? `Đối tác: ${r.partner.shop_name}`
                    : null;

                  const relatedLine1 = joinParts([cycleText, warehouseText], ' • ');
                  const relatedLine2 = joinParts([fundText, partnerText], ' • ');

                  const rowBg = idx % 2 === 0 ? 'background.paper' : 'action.hover';

                  return (
                    <React.Fragment key={r.id}>
                      <TableRow hover sx={{ bgcolor: rowBg }}>
                        <TableCell>
                          <Tooltip title={isOpen ? 'Thu gọn' : 'Xem dòng chi tiết'}>
                            <IconButton size="small" onClick={() => toggleRow(r.id)}>
                              <Iconify
                                icon={
                                  isOpen
                                    ? 'eva:arrow-ios-upward-fill'
                                    : 'eva:arrow-ios-downward-fill'
                                }
                              />
                            </IconButton>
                          </Tooltip>
                        </TableCell>

                        <TableCell>{r?.receipt_date ? fDate(r.receipt_date) : '-'}</TableCell>

                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                              noWrap
                              title={r?.code || ''}
                            >
                              {r?.code || '-'}
                            </Typography>

                            {/* chỉ show nếu có note / rejected_reason */}
                            {hasText(r?.note) ? (
                              <Typography
                                variant="caption"
                                sx={{ color: 'text.secondary' }}
                                noWrap
                                title={String(r.note)}
                              >
                                Ghi chú: {String(r.note)}
                              </Typography>
                            ) : null}

                            {r?.status === 'TU_CHOI' && hasText(r?.rejected_reason) ? (
                              <Typography
                                variant="caption"
                                sx={{ color: 'error.main' }}
                                noWrap
                                title={String(r.rejected_reason)}
                              >
                                Lý do: {String(r.rejected_reason)}
                              </Typography>
                            ) : null}
                          </Stack>
                        </TableCell>

                        <TableCell>{typeLabel}</TableCell>
                        <TableCell>{subtypeLabel}</TableCell>
                        {/* <TableCell>{sourceLabel}</TableCell> */}

                        <TableCell>
                          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                            {hasText(relatedLine1) ? (
                              <Typography variant="body2" noWrap title={relatedLine1}>
                                {relatedLine1}
                              </Typography>
                            ) : (
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                -
                              </Typography>
                            )}

                            {hasText(relatedLine2) ? (
                              <Typography
                                variant="caption"
                                sx={{ color: 'text.secondary' }}
                                noWrap
                                title={relatedLine2}
                              >
                                {relatedLine2}
                              </Typography>
                            ) : null}
                          </Stack>
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                            {money(r.total_amount)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" noWrap title={employeeName}>
                            {employeeName}
                          </Typography>
                        </TableCell>

                        <TableCell>{renderStatus(r.status)}</TableCell>

                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end">
                            <Tooltip title="Xem chi tiết">
                              <IconButton onClick={() => handleOpenDetail(r.id)}>
                                <Iconify icon="eva:eye-outline" />
                              </IconButton>
                            </Tooltip>

                            {isAdmin && r.status !== 'DA_DUYET' && (
                              <Tooltip title="Duyệt (áp vào kho)">
                                <IconButton color="success" onClick={() => handleApprove(r.id)}>
                                  <Iconify icon="eva:checkmark-circle-2-outline" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>

                      {/* Expand */}
                      <TableRow sx={{ bgcolor: rowBg }}>
                        <TableCell colSpan={11} sx={{ p: 0, borderBottom: 0 }}>
                          <Collapse in={isOpen} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2 }}>
                              <Stack spacing={1.5}>
                                <Stack
                                  direction={{ xs: 'column', md: 'row' }}
                                  spacing={2}
                                  alignItems={{ xs: 'flex-start', md: 'center' }}
                                  justifyContent="space-between"
                                >
                                  <Stack spacing={0.5}>
                                    <Typography variant="subtitle2">Thông tin chi tiết</Typography>

                                    {/* chỉ render field nào có */}
                                    {r?.created_at ? (
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Tạo lúc: {fDate(r.created_at)}
                                      </Typography>
                                    ) : null}

                                    {r?.updated_at ? (
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Cập nhật: {fDate(r.updated_at)}
                                      </Typography>
                                    ) : null}

                                    {hasText(r?.source) ? (
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Nguồn: {String(r.source)}
                                      </Typography>
                                    ) : null}

                                    {/* chỉ hiển thị khi object tồn tại, không hiển thị id */}
                                    {hasText(r?.cycle?.name) ? (
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Chu kỳ: {String(r.cycle.name)}
                                      </Typography>
                                    ) : null}

                                    {hasText(r?.warehouse?.name) ? (
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Kho: {String(r.warehouse.name)}
                                      </Typography>
                                    ) : null}

                                    {hasText(r?.fund?.name) ? (
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Quỹ: {String(r.fund.name)}
                                      </Typography>
                                    ) : null}

                                    {hasText(r?.partner?.shop_name) ? (
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Đối tác: {String(r.partner.shop_name)}
                                      </Typography>
                                    ) : null}
                                  </Stack>

                                  <Stack
                                    spacing={0.5}
                                    alignItems={{ xs: 'flex-start', md: 'flex-end' }}
                                  >
                                    {r?.locked !== undefined ? (
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Khóa: {r.locked ? 'Có' : 'Không'}
                                      </Typography>
                                    ) : null}

                                    {hasText(r?.status) ? (
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Trạng thái: {String(r.status)}
                                      </Typography>
                                    ) : null}
                                  </Stack>
                                </Stack>

                                <Divider />

                                <Typography variant="subtitle2">Chi tiết</Typography>

                                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ width: 60 }}>#</TableCell>
                                      <TableCell>Mô tả</TableCell>
                                      <TableCell sx={{ width: 110 }} align="right">
                                        SL
                                      </TableCell>
                                      <TableCell sx={{ width: 140 }} align="right">
                                        Đơn giá
                                      </TableCell>
                                      <TableCell sx={{ width: 90 }} align="right">
                                        VAT%
                                      </TableCell>
                                      <TableCell sx={{ width: 140 }} align="right">
                                        Trước thuế
                                      </TableCell>
                                      <TableCell sx={{ width: 120 }} align="right">
                                        VAT
                                      </TableCell>
                                      <TableCell sx={{ width: 140 }} align="right">
                                        Tổng
                                      </TableCell>
                                      <TableCell sx={{ width: 200 }}>Vật tư</TableCell>
                                    </TableRow>
                                  </TableHead>

                                  <TableBody>
                                    {(r?.lines || []).map((ln: any) => {
                                      const itemText = ln?.item
                                        ? joinParts(
                                            [ln.item.code, ln.item.name ? `- ${ln.item.name}` : ''],
                                            ' '
                                          )
                                        : '';

                                      return (
                                        <TableRow key={ln.id} hover>
                                          <TableCell>{ln?.line_no ?? '-'}</TableCell>
                                          <TableCell>
                                            <Stack spacing={0.25}>
                                              {hasText(ln?.description) ? (
                                                <Typography
                                                  variant="body2"
                                                  sx={{ fontWeight: 600 }}
                                                  noWrap
                                                  title={String(ln.description)}
                                                >
                                                  {String(ln.description)}
                                                </Typography>
                                              ) : (
                                                <Typography
                                                  variant="body2"
                                                  sx={{ color: 'text.secondary' }}
                                                >
                                                  -
                                                </Typography>
                                              )}

                                              {hasText(ln?.line_kind) ? (
                                                <Typography
                                                  variant="caption"
                                                  sx={{ color: 'text.secondary' }}
                                                  noWrap
                                                >
                                                  Kind: {String(ln.line_kind)}
                                                </Typography>
                                              ) : null}
                                            </Stack>
                                          </TableCell>

                                          <TableCell align="right">{qty(ln?.qty)}</TableCell>
                                          <TableCell align="right">
                                            {money(ln?.unit_price)}
                                          </TableCell>
                                          <TableCell align="right">
                                            {qty(ln?.vat_percent)}
                                          </TableCell>
                                          <TableCell align="right">
                                            {money(ln?.amount_before_tax)}
                                          </TableCell>
                                          <TableCell align="right">
                                            {money(ln?.vat_amount)}
                                          </TableCell>
                                          <TableCell align="right">
                                            <Typography
                                              variant="body2"
                                              sx={{ fontWeight: 700 }}
                                              noWrap
                                            >
                                              {money(ln?.amount_total)}
                                            </Typography>
                                          </TableCell>

                                          <TableCell>
                                            {hasText(itemText) ? (
                                              <Typography variant="body2" noWrap title={itemText}>
                                                {itemText}
                                              </Typography>
                                            ) : (
                                              <Typography
                                                variant="body2"
                                                sx={{ color: 'text.secondary' }}
                                              >
                                                -
                                              </Typography>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}

                                    {(!r?.lines || r.lines.length === 0) && (
                                      <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 2 }}>
                                          <Typography
                                            variant="body2"
                                            sx={{ color: 'text.secondary' }}
                                          >
                                            Không có dòng chi tiết
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </Stack>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}

                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ color: 'text.secondary' }}>
                        {loading ? 'Đang tải...' : 'Không có dữ liệu'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Hiển thị {rows.length} / {total} bản ghi
            </Typography>

            <Pagination
              page={page}
              count={totalPages}
              onChange={(_, p) => setPage(p)}
              color="primary"
              siblingCount={1}
              boundaryCount={1}
            />
          </Stack>
        </Card>
      </Stack>

      {/* Create */}
      <ReceiptCreateDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSubmit={handleSubmitCreate}
      />

      {/* Detail */}
      <ReceiptDetailDialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        receiptId={detailId}
        canApprove={isAdmin}
        onApprove={handleApprove}
        canCreateChangeRequest
        onCreateChangeRequest={handleOpenCR}
      />

      {/* Change Request */}
      <ReceiptChangeRequestDialog
        open={openCR}
        onClose={() => setOpenCR(false)}
        onSubmit={handleSubmitCR}
      />
    </Container>
  );
}
