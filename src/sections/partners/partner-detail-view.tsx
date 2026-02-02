import { useEffect, useState, useCallback } from "react";
import {
  Container, Card, Stack, Typography, Grid, TextField, MenuItem, Button,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Pagination, Chip
} from "@mui/material";
import { getPartnerTransactions, exportPartnerTransactions } from "src/api/partners";
import { enqueueSnackbar } from "src/components/snackbar";
import { useParams } from "src/routes/hooks";

function formatTien(n: any) {
  const x = Number(n || 0);
  return x.toLocaleString("vi-VN");
}

function labelNguon(v?: string) {
  if (v === "KHO") return "Kho";
  if (v === "BEN_NGOAI") return "Bên ngoài";
  return v || "-";
}

function labelLoai(v?: string) {
  if (v === "THU") return "Thu";
  if (v === "CHI") return "Chi";
  return v || "-";
}

export default function PartnerDetailView() {
  const params = useParams();
  const partnerId = Number((params as any)?.id);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [paging, setPaging] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    type: "",
    status: "",
    from: "",
    to: "",
    q: "",
    sort: "receipt_date:DESC",
  });

  const fetchData = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const data = await getPartnerTransactions(partnerId, {
        ...filters,
        page: paging.page,
        limit: paging.limit,
      });
      setPartner(data.partner);
      setSummary(data.summary);
      setRows(data.data || []);
      setPaging((p) => ({ ...p, ...data.paging }));
    } catch (e: any) {
      enqueueSnackbar(e?.message || "Tải dữ liệu thất bại", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [partnerId, filters, paging.page, paging.limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    try {
      const res = await exportPartnerTransactions(partnerId, { ...filters });
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const cd = res.headers["content-disposition"] || "";
      const m = /filename="(.+?)"/.exec(cd);
      a.download = m?.[1] || "lich_su_giao_dich_doi_tac.xlsx";

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      enqueueSnackbar("Xuất Excel thành công", { variant: "success" });
    } catch (e: any) {
      enqueueSnackbar(e?.message || "Xuất Excel thất bại", { variant: "error" });
    }
  };

  return (
    <Container maxWidth="xl">
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack>
            <Typography variant="h4">{partner?.name || "Chi tiết đối tác"}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {partner?.partner_type && <Chip size="small" label={partner.partner_type} />}
              {partner?.phone && <Typography variant="body2">SĐT: {partner.phone}</Typography>}
              {partner?.address && <Typography variant="body2">• Đ/c: {partner.address}</Typography>}
            </Stack>
          </Stack>

          <Button variant="contained" onClick={handleExport} disabled={loading || !partnerId}>
            Xuất Excel
          </Button>
        </Stack>

        {/* Tổng hợp */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle2">Tổng phát sinh</Typography>
              <Typography variant="h5">{formatTien(summary?.totalAmount)}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle2">Phát sinh Thu (bán)</Typography>
              <Typography variant="h5">{formatTien(summary?.tongPhatSinhTHU)}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Đã thu: {formatTien(summary?.daThu)} • Còn phải thu: {formatTien(summary?.conPhaiThu)}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle2">Phát sinh Chi (thanh toán)</Typography>
              <Typography variant="h5">{formatTien(summary?.tongPhatSinhCHI)}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Đã chi: {formatTien(summary?.daChi)} • Còn phải chi: {formatTien(summary?.conPhaiChi)}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle2">Dòng tiền ròng</Typography>
              <Typography variant="h5">{formatTien(summary?.dongTienRong)}</Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Bộ lọc */}
        <Card sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="Năm"
                value={filters.year}
                onChange={(e) => {
                  setPaging((p) => ({ ...p, page: 1 }));
                  setFilters((f) => ({ ...f, year: Number(e.target.value) }));
                }}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="Loại"
                value={filters.type}
                onChange={(e) => {
                  setPaging((p) => ({ ...p, page: 1 }));
                  setFilters((f) => ({ ...f, type: e.target.value }));
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="THU">Thu</MenuItem>
                <MenuItem value="CHI">Chi</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="Trạng thái"
                value={filters.status}
                onChange={(e) => {
                  setPaging((p) => ({ ...p, page: 1 }));
                  setFilters((f) => ({ ...f, status: e.target.value }));
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {["NHAP", "CHO_DUYET", "DA_DUYET", "TU_CHOI", "DA_CHOT", "HUY"].map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                type="date"
                fullWidth
                label="Từ ngày"
                InputLabelProps={{ shrink: true }}
                value={filters.from}
                onChange={(e) => {
                  setPaging((p) => ({ ...p, page: 1 }));
                  setFilters((f) => ({ ...f, from: e.target.value }));
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                type="date"
                fullWidth
                label="Đến ngày"
                InputLabelProps={{ shrink: true }}
                value={filters.to}
                onChange={(e) => {
                  setPaging((p) => ({ ...p, page: 1 }));
                  setFilters((f) => ({ ...f, to: e.target.value }));
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Tìm kiếm"
                placeholder="Mã phiếu / phân loại / ghi chú..."
                value={filters.q}
                onChange={(e) => {
                  setPaging((p) => ({ ...p, page: 1 }));
                  setFilters((f) => ({ ...f, q: e.target.value }));
                }}
              />
            </Grid>
          </Grid>
        </Card>

        {/* Bảng giao dịch */}
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mã phiếu</TableCell>
                  <TableCell>Ngày</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Phân loại</TableCell>
                  <TableCell>Nguồn</TableCell>
                  <TableCell align="center">Kho</TableCell>
                  <TableCell align="center">Quỹ</TableCell>
                  <TableCell align="center">Nhân viên</TableCell>

                  <TableCell align="right">Tổng tiền</TableCell>
                  <TableCell align="right">Đã thu/chi</TableCell>
                  <TableCell align="right">Còn lại</TableCell>

                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Ghi chú</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.code}</TableCell>
                    <TableCell>{r.receipt_date}</TableCell>
                    <TableCell>{labelLoai(r.type)}</TableCell>
                    <TableCell>{r.subtype || "-"}</TableCell>
                    <TableCell>{labelNguon(r.source)}</TableCell>
                    <TableCell align="center">
  {r.warehouse?.name || r.warehouse_id || "-"}
</TableCell>

<TableCell align="center">
  {r.fund?.name || r.fund_id || "-"}
</TableCell>

<TableCell align="center">
  {r.employee?.full_name || r.employee?.username || r.employee_id || "-"}
</TableCell>


                    <TableCell align="right">{formatTien(r.total_amount)}</TableCell>
                    <TableCell align="right">{formatTien(r.paid_amount)}</TableCell>
                    <TableCell align="right">{formatTien(r.remaining_amount)}</TableCell>

                    <TableCell>{r.status}</TableCell>
                    <TableCell>{r.note || "-"}</TableCell>
                  </TableRow>
                ))}

                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={13}>
                      <Typography variant="body2" sx={{ p: 2 }}>
                        {loading ? "Đang tải..." : "Không có dữ liệu"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-end" sx={{ p: 2 }}>
            <Pagination
              page={paging.page}
              count={paging.totalPages || 1}
              onChange={(_, p) => setPaging((x) => ({ ...x, page: p }))}
            />
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
