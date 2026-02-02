/* eslint-disable no-nested-ternary */
/* eslint-disable consistent-return */
/* eslint-disable arrow-body-style */
// src/sections/work-cycle/work-cycle-edit-dialog.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  CircularProgress,
  InputAdornment,
} from '@mui/material';

import type { WorkCycle, WorkCycleCreatePayload, WorkCycleStatus } from 'src/api/workcycle';
import { listDepartment } from 'src/api/department';
import { apiListSpecies, type ISpecies } from 'src/api/species';

type DeptItem = { id: number; code: string; name: string };

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onSubmit: (payload: WorkCycleCreatePayload) => Promise<void>;
  initial?: WorkCycle | null;
};

const STATUS_OPTIONS: WorkCycleStatus[] = ['OPEN', 'CLOSED'];

export default function WorkCycleEditDialog({ open, onClose, onSubmit, initial }: Props) {
  const isEdit = Boolean(initial?.id);

  const [form, setForm] = useState<WorkCycleCreatePayload>({
    code: '',
    department_id: 0,
    species_id: 0,
    start_date: '',
    name: '',
    location: '',
    status: 'OPEN',
  });

  const [deptOptions, setDeptOptions] = useState<DeptItem[]>([]);
  const [speciesOptions, setSpeciesOptions] = useState<ISpecies[]>([]);

  const [deptLoading, setDeptLoading] = useState(false);
  const [speciesLoading, setSpeciesLoading] = useState(false);

  // fill form when open
  useEffect(() => {
    if (!open) return;

    if (initial) {
      setForm({
        code: initial.code || '',
        department_id: initial.department_id || 0,
        species_id: initial.species_id || 0,
        start_date: initial.start_date || '',
        name: initial.name || '',
        location: initial.location || '',
        status: initial.status || 'OPEN',
      });
    } else {
      setForm({
        code: '',
        department_id: 0,
        species_id: 0,
        start_date: '',
        name: '',
        location: '',
        status: 'OPEN',
      });
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;

    let alive = true;

    const loadBase = async () => {
      setSpeciesLoading(true);

      try {
        const [departmentResp, speciesResp] = await Promise.all([
          listDepartment({ page: 1, limit: 200 }),
          apiListSpecies({ page: 1, pageSize: 200 }),
        ]);

        if (!alive) return;
        setDeptOptions(departmentResp.data)
        setSpeciesOptions(speciesResp.data || []);
      } finally {
        if (alive) {
          setSpeciesLoading(false);
        }
      }
    };

    loadBase();

    return () => {
      alive = false;
    };
  }, [open]);


  const canSubmit = useMemo(() => {
    return (
      form.code.trim() &&
      form.name.trim() &&
      Number(form.department_id) > 0 &&
      Number(form.species_id) > 0 &&
      String(form.start_date).trim()
    );
  }, [form]);

  const handleChange =
    (key: keyof (WorkCycleCreatePayload & { farm_id?: number })) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = (e.target as any).value;
      setForm((prev) => ({ ...prev, [key]: v as any }));
    };

  const handleSubmit = async () => {
    await onSubmit({
      ...(form as any),
      code: String(form.code).trim(),
      name: String(form.name).trim(),
      location: String(form.location || '').trim(),
      department_id: Number(form.department_id),
      species_id: Number(form.species_id),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Sửa lứa/ vụ' : 'Tạo lứa/ vụ'}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Mã (code)" value={form.code} onChange={handleChange('code')} required />

         
          <TextField
            select
            label="Khu vực"
            value={form.department_id || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, department_id: Number((e.target as any).value) }))}
            required
            InputProps={{
              endAdornment: deptLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={18} />
                </InputAdornment>
              ) : null,
            }}
          >

            {deptOptions.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.code} - {d.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Vật nuôi, cây trồng"
            value={form.species_id || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, species_id: Number((e.target as any).value) }))}
            required
            disabled={speciesLoading}
            InputLabelProps={{ shrink: true }}
            SelectProps={{ displayEmpty: true }}
            InputProps={{
              endAdornment: speciesLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={18} />
                </InputAdornment>
              ) : null,
            }}
          >
            <MenuItem value="" disabled>
              {speciesLoading ? 'Đang tải danh sách...' : 'Chọn Vật nuôi, cây trồng'}
            </MenuItem>

            {speciesOptions.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.code} - {s.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Ngày bắt đầu (start_date)"
            value={form.start_date}
            onChange={handleChange('start_date')}
            required
            type="date"
            InputLabelProps={{ shrink: true }}
            helperText="yyyy-MM-dd"
          />

          <TextField label="Tên chuồng" value={form.name} onChange={handleChange('name')} required />
          <TextField label="Vị trí" value={form.location} onChange={handleChange('location')} />

          <TextField select label="Trạng thái" value={form.status} onChange={handleChange('status')}>
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Huỷ
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit}>
          {isEdit ? 'Lưu' : 'Tạo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
