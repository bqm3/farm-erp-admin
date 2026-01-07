

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Stack,
} from '@mui/material';
import Iconify from 'src/components/iconify';
import type { ISpecies } from 'src/api/species';

type Props = {
  rows: ISpecies[];
  onEdit: (row: ISpecies) => void;
  onDelete: (row: ISpecies) => void;
  onRestore?: (row: ISpecies) => void;
  showRestore?: boolean;
};

export default function SpeciesTable({ rows, onEdit, onDelete, onRestore, showRestore }: Props) {
  if (!rows.length) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body2">Không có dữ liệu.</Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width={180}>Mã</TableCell>
            <TableCell>Tên</TableCell>
            <TableCell width={140} align="right">
              Thao tác
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{r.code}</TableCell>
              <TableCell>{r.name}</TableCell>

              <TableCell align="right">
                <Stack direction="row" justifyContent="flex-end">
                  <Tooltip title="Sửa">
                    <IconButton onClick={() => onEdit(r)}>
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Xóa">
                    <IconButton onClick={() => onDelete(r)}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>

                  {showRestore && onRestore && (
                    <Tooltip title="Khôi phục">
                      <IconButton onClick={() => onRestore(r)}>
                        <Iconify icon="solar:undo-left-bold" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
