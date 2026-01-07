'use client';

import isEqual from 'lodash/isEqual';
import { useState, useCallback, useEffect, useMemo } from 'react';
// @mui
import { alpha } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';
// _mock
import { _userList, _roles, USER_STATUS_OPTIONS } from 'src/_mock';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  getComparator,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import axiosInstance from 'src/utils/axios';
// types
import { IUserItem, IUserTableFilters, IUserTableFilterValue } from 'src/types/user';
//
import UserTableRow from '../user-table-row';
import UserTableToolbar from '../user-table-toolbar';
import UserTableFiltersResult from '../user-table-filters-result';
import UserCreateDialog from '../UserCreateDialog';
import UserEditDialog from '../UserEditDialog';


// ----------------------------------------------------------------------

const STATUS_OPTIONS = [ 'ACTIVE', 'BANNED']; // API đang trả ACTIVE
const ROLE_OPTIONS = [ 'ACCOUNTANT', 'MANAGER', 'STAFF']; // lấy theo role code

const TABLE_HEAD = [
  { id: 'full_name', label: 'Họ và tên', align: 'left' },
  { id: 'username', label: 'Tài khoản', align: 'left' },
  { id: 'email', label: 'Email', align: 'left' },
  { id: 'phone', label: 'SĐT', align: 'left' },
  { id: 'role', label: 'Chức vụ', align: 'left' },
  { id: 'isVerified', label: 'Xác thực', align: 'center' },
  { id: 'status', label: 'Trạng thái', align: 'left' },
  { id: '' },
];

type Filters = {
  name: string;
  role: string[];   // multiple
  status: string;   // all | ACTIVE | BANNED
};
// ----------------------------------------------------------------------

type ApiRole = { id: number; code: string; name: string };
type ApiUser = {
  id: number;
  username: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  dob: string;
  status: string; // ACTIVE
  isDelete: boolean;
  roles: ApiRole[];
};

type UiUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  phoneNumber: string;
  address: string;
  status: string;
  role: string; // code
  roles: ApiRole[];
  company?: string;
  isVerified?: boolean;
  avatarUrl?: string;
};

export default function UserListPage() {
  const {
    dense,
    page,
    order,
    orderBy,
    rowsPerPage,
    setPage,
    selected,
    setSelected,
    onSelectRow,
    onSelectAllRows,
    onSort,
    onChangeDense,
    onChangePage,
    onChangeRowsPerPage,
  } = useTable();

  const { themeStretch } = useSettingsContext();

  const [tableData, setTableData] = useState<UiUser[]>([]);
  const [loading, setLoading] = useState(false);

  // filters theo toolbar
  const [filters, setFilters] = useState<Filters>({
    name: '',
    role: [],       // rỗng = all
    status: 'all',
  });

  const [openConfirm, setOpenConfirm] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editUserId, setEditUserId] = useState<string | number | null>(null);
  const [editRow, setEditRow] = useState<any>(null);

  const loadUsers = useCallback(async () => {
    const res = await axiosInstance.get('/api/users');
    const apiUsers = res.data?.data ?? [];
    const uiUsers = apiUsers.map((u: any) => ({
      id: String(u.id),
      name: u.full_name || u.username,
      username: u.username,
      email: u.email,
      phoneNumber: u.phone,
      address: u.address,
      status: u.status,
      role: (u.roles || []).filter((r: any) => r.code !== 'ADMIN')?.[0]?.code || 'STAFF',
      roles: (u.roles || []).filter((r: any) => r.code !== 'ADMIN'),
      isVerified: true,
    }));
    setTableData(uiUsers);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/api/users');
        const apiUsers: ApiUser[] = res.data?.data ?? [];

        const uiUsers: UiUser[] = apiUsers.map((u) => {
          const safeRoles = (u.roles || []).filter((r) => r.code !== 'ADMIN');
          return {
            id: String(u.id),
            name: u.full_name || u.username,
            username: u.username,
            email: u.email,
            phoneNumber: u.phone,
            address: u.address,
            status: u.status || 'ACTIVE',
            role: safeRoles?.[0]?.code || 'STAFF',
            roles: safeRoles,
            company: 'Farm',
            isVerified: true,
          };
        });

        if (mounted) setTableData(uiUsers);
      } catch (err) {
        console.error('Load users failed:', err);
        if (mounted) setTableData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // handler cho toolbar
  const handleFilters = useCallback(
    (name: string, value: any) => {
      setPage(0);
      setFilters((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    [setPage]
  );

  // tab status -> set filters.status
  const handleFilterStatus = (_: any, newValue: string) => {
    setPage(0);
    setFilters((prev) => ({ ...prev, status: newValue }));
  };

  const handleResetFilter = () => {
    setFilters({ name: '', role: [], status: 'all' });
  };

  const dataFiltered = useMemo(
    () =>
      applyFilter({
        inputData: tableData,
        comparator: getComparator(order, orderBy),
        filters,
      }),
    [tableData, order, orderBy, filters]
  );

  const dataInPage = dataFiltered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const denseHeight = dense ? 52 : 72;

  const isFiltered =
    filters.name !== '' || filters.status !== 'all' || (filters.role && filters.role.length > 0);

  const notFound =
    (!dataFiltered.length && !!filters.name) ||
    (!dataFiltered.length && !!filters.status && filters.status !== 'all') ||
    (!dataFiltered.length && !!filters.role && filters.role.length > 0);

  const handleOpenConfirm = () => setOpenConfirm(true);
  const handleCloseConfirm = () => setOpenConfirm(false);

  const handleDeleteRow = (id: string) => {
    const deleteRow = tableData.filter((row) => row.id !== id);
    setSelected([]);
    setTableData(deleteRow);

    if (page > 0 && dataInPage.length < 2) setPage(page - 1);
  };

  const handleDeleteRows = (selectedIds: string[]) => {
    const deleteRows = tableData.filter((row) => !selectedIds.includes(row.id));
    setSelected([]);
    setTableData(deleteRows);

    if (page > 0) {
      if (selectedIds.length === dataInPage.length) setPage(page - 1);
      else if (selectedIds.length === dataFiltered.length) setPage(0);
      else if (selectedIds.length > dataInPage.length) {
        const newPage = Math.ceil((tableData.length - selectedIds.length) / rowsPerPage) - 1;
        setPage(newPage);
      }
    }
  };

  const handleEditRow = (row: any) => {
    setEditUserId(row.id);
    setEditRow(row);
    setOpenEdit(true);
  };

  return (
    <>
      <>
        <CustomBreadcrumbs
          heading="Danh sách nhân viên"
          links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Danh sách' }]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpenCreate(true)}
            >
              Thêm mới nhân viên
            </Button>
          }
        />

        <Card sx={{ mt: 2 }}>
          <Tabs
            value={filters.status}
            onChange={handleFilterStatus}
            sx={{ px: 2, bgcolor: 'background.neutral' }}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab key={tab} label={tab} value={tab} />
            ))}
          </Tabs>

          {/* bật toolbar */}
          <UserTableToolbar
            filters={filters as any}
            onFilters={handleFilters as any}
            roleOptions={ROLE_OPTIONS}
          />

          {/* nếu bạn có component result */}
          {/* <UserTableFiltersResult
            filters={filters as any}
            onResetFilters={handleResetFilter}
            results={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          /> */}

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={dense}
              numSelected={selected.length}
              rowCount={tableData.length}
              onSelectAllRows={(checked) =>
                onSelectAllRows(
                  checked,
                  tableData.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={handleOpenConfirm}>
                    <Iconify icon="eva:trash-2-outline" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
                <TableHeadCustom
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={tableData.length}
                  numSelected={selected.length}
                  onSort={onSort}
                  onSelectAllRows={(checked) =>
                    onSelectAllRows(
                      checked,
                      tableData.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row: any) => (
                      <UserTableRow
                        key={row.id}
                        row={row}
                        selected={selected.includes(row.id)}
                        onSelectRow={() => onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleEditRow(row)}
                      />
                    ))}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(page, rowsPerPage, tableData.length)}
                  />
                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePaginationCustom
            count={dataFiltered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={onChangePage}
            onRowsPerPageChange={onChangeRowsPerPage}
            dense={dense}
            onChangeDense={onChangeDense}
          />
        </Card>
      </>

      <UserCreateDialog open={openCreate} onClose={() => setOpenCreate(false)} onCreated={loadUsers} />

      <UserEditDialog
        open={openEdit}
        userId={editUserId}
        initialRow={editRow}
        onClose={() => setOpenEdit(false)}
        onUpdated={loadUsers}
      />

      <ConfirmDialog
        open={openConfirm}
        onClose={handleCloseConfirm}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {selected.length} </strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows(selected);
              handleCloseConfirm();
            }}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  filters,
}: {
  inputData: UiUser[];
  comparator: (a: any, b: any) => number;
  filters: { name: string; status: string; role: string[] };
}) {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let data = stabilizedThis.map((el) => el[0]);

  // name
  if (filters.name) {
    const q = filters.name.toLowerCase();
    data = data.filter((user) => (user.name || '').toLowerCase().includes(q));
  }

  // status
  if (filters.status !== 'all') {
    data = data.filter((user) => user.status === filters.status);
  }

  // role (multiple): rỗng => all
  if (filters.role && filters.role.length > 0) {
    data = data.filter((user) => filters.role.includes(user.role));
  }

  return data;
}
