import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
// auth
import { AuthGuard } from 'src/auth/guard';
// layouts
import DashboardLayout from 'src/layouts/dashboard';
// components
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

// OVERVIEW
const IndexPage = lazy(() => import('src/pages/dashboard/app'));
const UserProfilePage = lazy(() => import('src/pages/dashboard/user/profile'));
const UserCardsPage = lazy(() => import('src/pages/dashboard/user/cards'));
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserCreatePage = lazy(() => import('src/pages/dashboard/user/new'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
const EmployeePayrollRangePage = lazy(() => import('src/pages/dashboard/user/user_payroll'));

// DEPARTMENT
const DepartmentListPage = lazy(() => import('src/pages/dashboard/department/list'));
const DepartmentUserListPage = lazy(() => import('src/pages/dashboard/department/list-user'));
const DepartmentDetailsPage = lazy(() => import('src/pages/dashboard/department/details'));
const DepartmentUserDetailsPage = lazy(() => import('src/pages/dashboard/department/details-user'));

// CATEGORY / ITEMS
const CategoryItemListPage = lazy(() => import('src/pages/dashboard/items/list-item'));
const CategoryCateListPage = lazy(() => import('src/pages/dashboard/items/list-category'));

// WAREHOUSE
const WarehouseListPage = lazy(() => import('src/pages/dashboard/warehouse/list'));

// ATTENDANCE
const AttendanceMonthListPage = lazy(() => import('src/pages/dashboard/attendance/list'));
const AttendanceCheckInPage = lazy(() => import('src/pages/dashboard/attendance/check-in'));
// LEAVE
const LeaveRequestPage = lazy(() => import('src/pages/dashboard/leave/request'));
const LeaveUserRequestPage = lazy(() => import('src/pages/dashboard/leave/user-request'));
const LeaveBalancePage = lazy(() => import('src/pages/dashboard/leave/balance'));
const AdvancePage = lazy(() => import('src/pages/dashboard/leave/advance'));
const AdvanceUserPage = lazy(() => import('src/pages/dashboard/leave/user-advance'));

// SPECIES
const SpeciesListPage = lazy(() => import('src/pages/dashboard/species/list'));

// FARMS
const FarmListPage = lazy(() => import('src/pages/dashboard/farm/list'));

// FUND
const FundPage = lazy(() => import('src/pages/dashboard/fund/list'));

// PARTNER
const PartnerPage = lazy(() => import('src/pages/dashboard/partner/list'));
const PartnerDetailView = lazy(() => import('src/pages/dashboard/partner/detail'));

// WORK CYCLE
const WorkCycleDetailsPage = lazy(() => import('src/pages/dashboard/workcycle/detail'));
const WorkCycleUserDetailsPage = lazy(() => import('src/pages/dashboard/workcycle/detail-user'));
const WorkCycleListPage = lazy(() => import('src/pages/dashboard/workcycle/list'));
const WorkCycleUserListPage = lazy(() => import('src/pages/dashboard/workcycle/list-users'));

// RECEIPT
const ReceiptUserListPage = lazy(() => import('src/pages/dashboard/receipt/list-user'));
const ReceiptListPage = lazy(() => import('src/pages/dashboard/receipt/list'));

// APP
const ChatPage = lazy(() => import('src/pages/dashboard/chat'));
// TEST RENDER PAGE BY ROLE
const PermissionDeniedPage = lazy(() => import('src/pages/dashboard/permission'));
// BLANK PAGE
const BlankPage = lazy(() => import('src/pages/dashboard/blank'));

// ----------------------------------------------------------------------

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { element: <IndexPage />, index: true },
      {
        path: 'user',
        children: [
          { element: <UserProfilePage />, index: true },
          { path: 'profile', element: <UserProfilePage /> },
          { path: 'cards', element: <UserCardsPage /> },
          { path: 'list', element: <UserListPage /> },
          { path: 'new', element: <UserCreatePage /> },
          { path: ':id/edit', element: <UserEditPage /> },
          { path: ':id/payroll-range', element: <EmployeePayrollRangePage /> },
        ],
      },
       {
        path: '',
        children: [
          { element: <CategoryItemListPage />, index: true },
          { path: 'items/list', element: <CategoryItemListPage /> },
          { path: 'category/list', element: <CategoryCateListPage /> },
        ]
      },
      {
        path: 'species',
        children: [
          { element: <SpeciesListPage />, index: true },
          { path: 'list', element: <SpeciesListPage /> },
        ]
      },
      {
        path: 'department',
        children: [
          { element: <DepartmentListPage />, index: true },
          { path: 'list', element: <DepartmentListPage /> },
          { path: 'list-user', element: <DepartmentUserListPage /> },
          { path: ':id', element: <DepartmentDetailsPage /> },
          { path: ':id/user', element: <DepartmentUserDetailsPage /> }
        ]
      },
       {
        path: 'receipt',
        children: [
          { element: <ReceiptListPage />, index: true },
          { path: 'list', element: <ReceiptListPage /> },
          { path: 'list-user', element: <ReceiptUserListPage /> }
          
        ]
      },
      {
        path: 'warehouse',
        children: [
          {
            element: <WarehouseListPage />, index: true
          },
          { path: 'list', element: <WarehouseListPage /> },
        ]
      },
       {
        path: 'project',
        children: [
          {
            element: <FarmListPage />, index: true
          },
          { path: 'list', element: <FarmListPage /> },
        ]
      },
       {
        path: 'fund',
        children: [
          {
            element: <FundPage />, index: true
          },
          { path: 'list', element: <FundPage /> },
        ]
      },
       {
        path: 'partner',
        children: [
          {
            element: <PartnerPage />, index: true
          },
          { path: 'list', element: <PartnerPage /> },
          
          { path: ':id', element: <PartnerDetailView /> },
        ]
      },
      
      {
        path: 'leave',
        children: [
          {
            element: <LeaveRequestPage />, index: true
          },
          { path: 'advance', element: <AdvancePage /> },
          { path: 'advance-user', element: <AdvanceUserPage /> },
          { path: 'list', element: <LeaveRequestPage /> },
          { path: 'list-user', element: <LeaveUserRequestPage /> },
          { path: 'balance', element: <LeaveBalancePage /> },
        ]
      },
      
      {
        path: 'work-cycles',
        children: [
          { element: <WorkCycleListPage />, index: true },
          { path: 'list', element: <WorkCycleListPage /> },
          { path: 'list-users', element: <WorkCycleUserListPage /> },
          { path: ':id', element: <WorkCycleDetailsPage /> },
          { path: ':id/user', element: <WorkCycleUserDetailsPage /> },
        ]
      },
      {
        path: 'attendance',
        children: [
          {
            element: <AttendanceMonthListPage />, index: true
          },
          { path: 'check-in', element: <AttendanceCheckInPage /> },
          { path: 'list', element: <AttendanceMonthListPage /> },
        ]
      },
      
      { path: 'chat', element: <ChatPage /> },
      { path: 'permission', element: <PermissionDeniedPage /> },
      { path: 'blank', element: <BlankPage /> },
    ],
  },
];
