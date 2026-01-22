'use client';

// @mui
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
// utils
import { fDateTime } from 'src/utils/format-time';
// components
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

type Props = {
  farm: any;
  onView: VoidFunction;
  onEdit: VoidFunction;
  onDelete: VoidFunction;
};

export default function DepartmentItem({ farm, onView, onEdit, onDelete }: Props) {
  const popover = usePopover();

  const managerName = farm.manager?.full_name || farm.manager?.username || 'Chưa gán quản lý';

  return (
    <>
      <Card sx={{ position: 'relative' }}>
        {/* Header (code) */}
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              {farm.code}
            </Typography>

            <IconButton onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>

          <ListItemText
            primary={farm.name}
            secondary={`Tạo lúc: ${fDateTime(farm.created_at)}`}
            primaryTypographyProps={{ typography: 'subtitle1' }}
            secondaryTypographyProps={{ typography: 'caption', color: 'text.disabled', mt: 0.5 }}
          />
        </Box>

        {/* Info */}
        <Stack spacing={1.25} sx={{ px: 2.5, pb: 2.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ typography: 'body2' }}>
            <Iconify icon="solar:user-id-bold" color="info.main" />
            <Box component="span">{managerName}</Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ typography: 'body2' }}>
            <Iconify icon="solar:users-group-rounded-bold" color="success.main" />
            <Box component="span">{farm.employeeCount} nhân sự</Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ typography: 'body2' }}>
            <Iconify icon="solar:clock-circle-bold" color="warning.main" />
            <Box component="span">Cập nhật: {fDateTime(farm.updated_at)}</Box>
          </Stack>
        </Stack>
      </Card>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 160 }}
      >
        <MenuItem
          onClick={() => {
            popover.onClose();
            onView();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          Xem chi tiết
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onEdit();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Sửa
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onDelete();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Xóa
        </MenuItem>
      </CustomPopover>
    </>
  );
}
