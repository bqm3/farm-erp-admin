/* eslint-disable no-nested-ternary */
// src/sections/receipts/receipt-detail-dialog.tsx

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { Receipt } from 'src/api/receipts';
import { getReceiptDetail } from 'src/api/receipts';
import { fDate } from 'src/utils/format-time';
import { enqueueSnackbar } from 'src/components/snackbar';

type Props = {
  open: boolean;
  onClose: VoidFunction;
  receiptId?: number | null;

  canApprove?: boolean;
  onApprove?: (id: number) => Promise<void>;

  // ✅ Hoàn tác = mở dialog huỷ phiếu (ReceiptCancelDialog) ở list view
  canCancel?: boolean;
  onCancel?: (id: number, code?: string) => void;
};

// ===== Utils =====
function n(v: any, fb = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fb;
}

function money(nv: any) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n(nv, 0));
}

function hasText(v: any) {
  return typeof v === 'string' ? v.trim().length > 0 : !!v;
}

function joinParts(parts: Array<string | null | undefined>, sep = ' • ') {
  return parts.filter((x) => typeof x === 'string' && x.trim().length > 0).join(sep);
}

function statusToChip(status?: string | null): { label: string; color: any } {
  const s = String(status || '');
  if (s === 'CHO_DUYET') return { label: 'Chờ duyệt', color: 'warning' };
  if (s === 'DA_DUYET') return { label: 'Đã duyệt', color: 'success' };
  if (s === 'TU_CHOI') return { label: 'Từ chối', color: 'error' };
  if (s === 'DANG_KY') return { label: 'Đăng ký', color: 'info' };
  if (s === 'HUY') return { label: 'Huỷ', color: 'default' };
  return { label: s || '-', color: 'default' };
}

function typeToText(type?: string | null) {
  if (type === 'THU') return 'THU';
  if (type === 'CHI') return 'CHI';
  return type || '-';
}

function subtypeToText(subtype?: string | null) {
  const map: Record<string, string> = {
    THU_HOACH: 'Thu hoạch',
    SOLD: 'Bán',
    BAN: 'Bán',
    XUAT: 'Xuất',
    NHAP: 'Nhập',
    NHAP_LAI: 'Nhập lại',
    THEM: 'Thêm',
    TANG: 'Tăng',
    GIAM: 'Giảm',
    CHET: 'Chết',
  };
  const k = String(subtype || '');
  return map[k] || (subtype || '-');
}

function sourceToText(source?: string | null) {
  if (source === 'KHO') return 'Kho';
  if (source === 'BEN_NGOAI') return 'Bên ngoài';
  return source || '-';
}

function renderObjectLine(code?: string | null, name?: string | null) {
  const c = hasText(code) ? String(code) : '';
  const n2 = hasText(name) ? String(name) : '';
  const text = joinParts([c, n2 ? (c ? `- ${n2}` : n2) : ''], ' ');
  return hasText(text) ? text : '-';
}

function LineCard({ ln }: { ln: any }) {
  const itemCode =
    ln?.item?.code
      ? String(ln.item.code)
      : (ln?.species?.code ? String(ln.species.code) : '-');

  const itemName =
    ln?.item?.name
      ? String(ln.item.name)
      : (ln?.species?.name ? String(ln.species.name) : (ln?.description ? String(ln.description) : '-'));

  return (
    <Card variant="outlined">
      <CardContent sx={{ py: 1.5 }}>
        <Stack spacing={1}>
          <Stack spacing={0.25}>
            <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
              {itemCode}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {itemName}
            </Typography>
          </Stack>

          <Divider />

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Số lượng
              </Typography>
              <Typography variant="body2">
                {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(n(ln?.qty, 0))}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Đơn giá
              </Typography>
              <Typography variant="body2" textAlign="right">
                {money(ln?.unit_price)}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                VAT (%)
              </Typography>
              <Typography variant="body2">
                {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n(ln?.vat_percent, 0))}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Trước thuế
              </Typography>
              <Typography variant="body2" textAlign="right">
                {money(ln?.amount_before_tax)}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Tiền VAT
              </Typography>
              <Typography variant="body2">{money(ln?.vat_amount)}</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Thành tiền
              </Typography>
              <Typography variant="subtitle2" textAlign="right">
                {money(ln?.amount_total)}
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ReceiptDetailDialog({
  open,
  onClose,
  receiptId,
  canApprove,
  onApprove,
  canCancel,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Receipt | null>(null);
  const [err, setErr] = useState<string>('');
  const [acting, setActing] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const statusChip = useMemo(() => statusToChip((data as any)?.status), [data]);

  const typeText = useMemo(() => typeToText((data as any)?.type), [data]);
  const subtypeText = useMemo(() => subtypeToText((data as any)?.subtype), [data]);
  const sourceText = useMemo(() => sourceToText((data as any)?.source), [data]);

  const workCycleText = useMemo(() => {
    const c = (data as any)?.cycle;
    if (!c) return '-';
    return renderObjectLine(c?.code, c?.name);
  }, [data]);

  const warehouseText = useMemo(() => {
    const w = (data as any)?.warehouse;
    if (!w) return '-';
    return renderObjectLine(w?.code, w?.name);
  }, [data]);

  const fundText = useMemo(() => {
    const f = (data as any)?.fund;
    if (!f || !hasText(f?.name)) return '-';

    const parts = [
      `Quỹ: ${String(f.name)}`,
      hasText(f?.fund_type) ? `Hình thức: ${String(f.fund_type)}` : null,
      hasText(f?.bank_name) ? `Ngân hàng: ${String(f.bank_name)}` : null,
      hasText(f?.bank_account_no) ? `STK: ${String(f.bank_account_no)}` : null,
    ];

    return joinParts(parts, ' • ') || '-';
  }, [data]);

  const partnerText = useMemo(() => {
    const p = (data as any)?.partner;
    if (!p || !hasText(p?.name)) return '-';

    const parts = [
      `Đối tác: ${String(p.name)}`,
      hasText(p?.partner_type) ? `Loại: ${String(p.partner_type)}` : null,
      hasText(p?.phone) ? `SĐT: ${String(p.phone)}` : null,
      hasText(p?.address) ? `Địa chỉ: ${String(p.address)}` : null,
    ];

    return joinParts(parts, ' • ') || '-';
  }, [data]);

  const totals = useMemo(() => {
    const lines: any[] = (data as any)?.lines || [];
    return lines.reduce(
      (acc, ln) => {
        acc.before += n(ln?.amount_before_tax, 0);
        acc.vat += n(ln?.vat_amount, 0);
        acc.total += n(ln?.amount_total, 0);
        return acc;
      },
      { before: 0, vat: 0, total: 0 }
    );
  }, [data]);

  const reload = useCallback(async (id: number) => {
    const r = await getReceiptDetail(id);
    setData(r);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!open || !receiptId) return;
      try {
        setErr('');
        setLoading(true);
        await reload(receiptId);
      } catch (e: any) {
        setErr(e?.message || 'Lỗi tải chi tiết');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open, receiptId, reload]);

  const handleApprove = async () => {
    if (!(data as any)?.id || !onApprove) return;
    try {
      setActing(true);
      await onApprove((data as any).id);
      await reload((data as any).id);
      enqueueSnackbar('Đã duyệt phiếu', { variant: 'success' });
    } catch (e: any) {
      enqueueSnackbar(e?.message || 'Duyệt thất bại', { variant: 'error' });
    } finally {
      setActing(false);
    }
  };

  // ✅ Hoàn tác = mở dialog huỷ phiếu ở list view
  const handleCancelOpen = () => {
    const id = (data as any)?.id;
    if (!id || !onCancel) return;

    const code = (data as any)?.code ? String((data as any).code) : '';
    // đóng detail trước để UX mượt (tránh 2 dialog chồng nhau)
    onClose();
    onCancel(id, code);
  };

  const status = String((data as any)?.status || '');
  const t = String((data as any)?.type || '');
  const st = String((data as any)?.subtype || '');

  const canApproveNow =
    !!(data as any)?.id && !!canApprove && status !== 'DA_DUYET' && status !== 'HUY';

  // ✅ giống list-view:
  // isAdmin && status === 'DA_DUYET' && type === 'CHI' && subtype === 'THEM'
  const canCancelNow =
    !!(data as any)?.id && !!canCancel && status === 'DA_DUYET' && t === 'CHI' && st === 'THEM';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
      <DialogTitle>Chi tiết phiếu</DialogTitle>

      <DialogContent>
        {loading && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        )}

        {!loading && err && <Typography color="error">{err}</Typography>}

        {!loading && data && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Header */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
              <Stack spacing={0.5}>
                <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
                  {(data as any)?.code || '-'}
                </Typography>

                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {typeText}
                  {subtypeText ? ` • ${subtypeText}` : ''}
                  {sourceText ? ` • ${sourceText}` : ''}
                </Typography>
              </Stack>

              <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={0.5} sx={{ pt: { xs: 0.5, md: 0 } }}>
                <Chip label={statusChip.label} color={statusChip.color} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Ngày: {(data as any)?.receipt_date ? fDate((data as any).receipt_date) : '-'}
                  {((data as any)?.month && (data as any)?.year) ? ` • Tháng: ${(data as any).month}/${(data as any).year}` : ''}
                </Typography>
              </Stack>
            </Stack>

            {/* Lý do từ chối */}
            {String((data as any)?.status || '') === 'TU_CHOI' && hasText((data as any)?.rejected_reason) && (
              <Card variant="outlined">
                <CardContent sx={{ py: 1.25 }}>
                  <Typography variant="subtitle2" sx={{ color: 'error.main' }}>
                    Lý do từ chối
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {String((data as any)?.rejected_reason)}
                  </Typography>
                </CardContent>
              </Card>
            )}

            <Divider />

            {/* Info blocks */}
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2">Nhân viên</Typography>
                <Typography variant="body2">
                  {(data as any)?.employee?.full_name || '-'}
                  {hasText((data as any)?.employee?.username) ? ` (${String((data as any).employee.username)})` : ''}
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2">Người tạo</Typography>
                <Typography variant="body2">
                  {(data as any)?.creator?.full_name || '-'}
                  {hasText((data as any)?.creator?.username) ? ` (${String((data as any).creator.username)})` : ''}
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2">Chu kỳ Vụ/lứa</Typography>
                <Typography variant="body2">{workCycleText}</Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2">Kho</Typography>
                <Typography variant="body2">{warehouseText}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Quỹ</Typography>
                <Typography variant="body2">{fundText}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Đối tác</Typography>
                <Typography variant="body2">{partnerText}</Typography>
              </Grid>
            </Grid>

            {hasText((data as any)?.note) && (
              <>
                <Divider />
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">Ghi chú</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {String((data as any)?.note)}
                  </Typography>
                </Stack>
              </>
            )}

            <Divider />

            {/* Lines */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Chi tiết dòng</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {((data as any)?.lines || []).length} dòng
              </Typography>
            </Stack>

            {isMobile ? (
              <Stack spacing={1.25}>
                {((data as any)?.lines || []).map((ln: any) => (
                  <LineCard key={ln.id} ln={ln} />
                ))}

                {(!((data as any)?.lines || []).length) && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                    Không có dòng chi tiết
                  </Typography>
                )}
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={120}>Mã hàng</TableCell>
                    <TableCell>Tên / Mô tả</TableCell>
                    <TableCell align="right" width={120}>Số lượng</TableCell>
                    <TableCell align="right" width={140}>Đơn giá</TableCell>
                    <TableCell align="right" width={90}>VAT (%)</TableCell>
                    <TableCell align="right" width={140}>Trước thuế</TableCell>
                    <TableCell align="right" width={140}>Tiền VAT</TableCell>
                    <TableCell align="right" width={140}>Thành tiền</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {((data as any)?.lines || []).map((ln: any) => {
                    const itemCode =
                      ln?.item?.code
                        ? String(ln.item.code)
                        : (ln?.species?.code ? String(ln?.species?.code) : '-');

                    const itemName =
                      ln?.item?.name
                        ? String(ln.item.name)
                        : (ln?.species?.name ? String(ln?.species?.name) : '-');

                    return (
                      <TableRow key={ln.id} hover>
                        <TableCell>{itemCode}</TableCell>
                        <TableCell>{itemName}</TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(n(ln?.qty, 0))}
                        </TableCell>
                        <TableCell align="right">{money(ln?.unit_price)}</TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n(ln?.vat_percent, 0))}
                        </TableCell>
                        <TableCell align="right">{money(ln?.amount_before_tax)}</TableCell>
                        <TableCell align="right">{money(ln?.vat_amount)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" noWrap>
                            {money(ln?.amount_total)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {(!((data as any)?.lines || []).length) && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Không có dòng chi tiết
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {/* Totals */}
            <Divider />
            <Card variant="outlined">
              <CardContent sx={{ py: 1.5 }}>
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Trước thuế
                    </Typography>
                    <Typography variant="body2">{money(totals.before)}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      VAT
                    </Typography>
                    <Typography variant="body2">{money(totals.vat)}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Tổng
                    </Typography>
                    <Typography variant="subtitle2">{money(totals.total)}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Tổng tiền theo phiếu (nếu BE trả total_amount) */}
            {hasText((data as any)?.total_amount) && (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'right' }}>
                Tổng theo phiếu: <b>{money((data as any)?.total_amount)}</b>
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        {/* ✅ Hoàn tác = mở ReceiptCancelDialog */}
        {(data as any)?.id && canCancelNow && (
          <Button
            color="warning"
            variant="outlined"
            onClick={handleCancelOpen}
            disabled={acting || loading}
          >
            Hoàn tác
          </Button>
        )}

        {/* {(data as any)?.id && canApproveNow && (
          <Button variant="contained" onClick={handleApprove} disabled={acting || loading}>
            Duyệt (áp vào kho)
          </Button>
        )} */}

        <Button onClick={onClose} disabled={acting || loading}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
