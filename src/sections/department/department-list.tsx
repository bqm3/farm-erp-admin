'use client';

import { useCallback } from 'react';
// @mui
import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import DepartmentItem from './department-item';

type Props = {
  farms: any[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEditRow: (id: number) => void;
};

export default function FarmList({ farms, page, totalPages, onPageChange, onEditRow }: Props) {
  const router = useRouter();

  const handleView = useCallback(
    (id: number) => {
      // TODO: chỉnh route thật của bạn
      router.push(paths.dashboard.department?.details?.(String(id)) || `/dashboard/department/${id}`);
    },
    [router]
  );

  const handleDelete = useCallback((id: number) => {
    console.info('DELETE', id);
  }, []);

  return (
    <>
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
      >
        {farms.map((farm) => (
          <DepartmentItem
            key={farm.id}
            farm={farm}
            onView={() => handleView(farm.id)}
            onEdit={() => onEditRow(farm.id)}
            onDelete={() => handleDelete(farm.id)}
          />
        ))}
      </Box>

      {totalPages > 1 && (
        <Pagination
          page={page}
          count={totalPages}
          onChange={(_, v) => onPageChange(v)}
          sx={{
            mt: 8,
            [`& .${paginationClasses.ul}`]: {
              justifyContent: 'center',
            },
          }}
        />
      )}
    </>
  );
}
