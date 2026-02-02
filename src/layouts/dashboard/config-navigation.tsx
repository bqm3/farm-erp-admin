/* eslint-disable no-nested-ternary */
/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from 'react';
// routes
import { paths } from 'src/routes/paths';
// locales
import { useLocales } from 'src/locales';
// components
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import SvgColor from 'src/components/svg-color';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
  // OR
  // <Iconify icon="fluent:mail-24-filled" />
  // https://icon-sets.iconify.design/solar/
  // https://www.streamlinehq.com/icons
);

const ICONS = {
  job: icon('ic_job'),
  blog: icon('ic_blog'),
  chat: icon('ic_chat'),
  mail: icon('ic_mail'),
  user: icon('ic_user'),
  file: icon('ic_file'),
  lock: icon('ic_lock'),
  tour: icon('ic_tour'),
  order: icon('ic_order'),
  label: icon('ic_label'),
  blank: icon('ic_blank'),
  kanban: icon('ic_kanban'),
  folder: icon('ic_folder'),
  banking: icon('ic_banking'),
  booking: icon('ic_booking'),
  invoice: icon('ic_invoice'),
  product: icon('ic_product'),
  calendar: icon('ic_calendar'),
  disabled: icon('ic_disabled'),
  external: icon('ic_external'),
  menuItem: icon('ic_menu_item'),
  ecommerce: icon('ic_ecommerce'),
  analytics: icon('ic_analytics'),
  dashboard: icon('ic_dashboard'),
};

// ----------------------------------------------------------------------

export function useNavData() {
  const { t } = useLocales();
  const { user } = useAuthContext();
  const roles: string[] = user?.roles || [];
  const isAdmin = roles.includes('ADMIN');
  const isAccountant = roles.includes('ACCOUNTANT');
  const isManager = roles.includes('MANAGER');
  const isStaff = roles.includes('STAFF');

  const data = useMemo(() => {
    const navigationDataAdmin = [
      // OVERVIEW
      // ----------------------------------------------------------------------
      {
        subheader: t('overview'),
        items: [
          {
            title: t('app'),
            path: paths.dashboard.root,
            icon: ICONS.dashboard,
          },
          // {
          //   title: t('ecommerce'),
          //   path: paths.dashboard.general.ecommerce,
          //   icon: ICONS.ecommerce,
          // },
          // {
          //   title: t('analytics'),
          //   path: paths.dashboard.general.analytics,
          //   icon: ICONS.analytics,
          // },
          // {
          //   title: t('banking'),
          //   path: paths.dashboard.general.banking,
          //   icon: ICONS.banking,
          // },
          // {
          //   title: t('booking'),
          //   path: paths.dashboard.general.booking,
          //   icon: ICONS.booking,
          // },
          // {
          //   title: t('file'),
          //   path: paths.dashboard.general.file,
          //   icon: ICONS.file,
          // },
        ],
      },

      // MANAGEMENT
      // ----------------------------------------------------------------------
      {
        subheader: t('management'),
        items: [
          // USER
          {
            title: t('dự án'),
            path: paths.dashboard.project.root,
            icon: ICONS.job,
            children: [{ title: t('list'), path: paths.dashboard.project.list }],
          },
          {
            title: t('Khách hàng'),
            path: paths.dashboard.partner.root,
            icon: ICONS.booking,
            children: [{ title: t('list'), path: paths.dashboard.partner.list }],
          },
          {
            title: t('Quỹ tiền'),
            path: paths.dashboard.fund.root,
            icon: ICONS.banking,
            children: [{ title: t('list'), path: paths.dashboard.fund.list }],
          },
          {
            title: t('user'),
            path: paths.dashboard.user.root,
            icon: ICONS.user,
            children: [{ title: t('list'), path: paths.dashboard.user.list }, { title: t('profile'), path: paths.dashboard.user.profile }, ],
          },
          {
            // ITEM CATEGORY
            title: t('Hàng hóa'),
            path: paths.dashboard.category.root,
            icon: ICONS.job,
            children: [
              { title: t('thức ăn'), path: paths.dashboard.category.itemList },
              { title: t('vật tư tiêu hao'), path: paths.dashboard.category.cateList },
              //  {
              //   title: t('details'),
              //   path: `${paths.dashboard.department.details}`,
              // },
            ],
          },
          {
            // SPECIES
            title: t('Vật nuôi, cây trồng'),
            path: paths.dashboard.species.root,
            icon: ICONS.job,
            children: [
              { title: t('list'), path: paths.dashboard.species.root },
              //  {
              //   title: t('details'),
              //   path: `${paths.dashboard.department.details}`,
              // },
            ],
          },
          {
            // DEPARTMENT
            title: t('Khu vực'),
            path: paths.dashboard.department.root,
            icon: ICONS.tour,
            children: [
              { title: t('list'), path: paths.dashboard.department.root },
              //  {
              //   title: t('details'),
              //   path: `${paths.dashboard.department.details}`,
              // },
            ],
          },
          {
            // WORK CYCLE
            title: t('Vụ/lứa'),
            path: paths.dashboard.workcycle.root,
            icon: ICONS.job,
            children: [
              { title: t('list'), path: paths.dashboard.workcycle.root },
              //  {
              //   title: t('details'),
              //   path: `${paths.dashboard.department.details}`,
              // },
            ],
          },
          {
            // RECEIPT
            title: t('Phiếu'),
            path: paths.dashboard.receipt.root,
            icon: ICONS.invoice,
            children: [
              { title: t('Danh sách'), path: paths.dashboard.receipt.root },
              //  {
              //   title: t('details'),
              //   path: `${paths.dashboard.department.details}`,
              // },
            ],
          },
          {
            // WAREHOUSE
            title: t('Kho hàng'),
            path: paths.dashboard.warehouse.root,
            icon: ICONS.product,
            children: [
              { title: t('Danh sách'), path: paths.dashboard.warehouse.root },
              //  {
              //   title: t('details'),
              //   path: `${paths.dashboard.department.details}`,
              // },
            ],
          },

          {
            // WAREHOUSE
            title: t('Nghỉ phép và ứng lương'),
            path: paths.dashboard.leave.root,
            icon: ICONS.job,
            children: [
              { title: t('Ứng lương'), path: paths.dashboard.leave.advance },
              { title: t('Nghỉ phép'), path: paths.dashboard.leave.root },
              { title: t('Số dư'), path: paths.dashboard.leave.balance },
            ],
          },
          {
            // ATTENDANCE
            title: t('Lương'),
            path: paths.dashboard.attendance.root,
            icon: ICONS.calendar,
            children: [
              { title: t('Chấm công'), path: paths.dashboard.attendance.checkIn },
              { title: t('Danh sách'), path: paths.dashboard.attendance.root },
            ],
          },
          {
            title: t('chat'),
            path: paths.dashboard.chat,
            icon: ICONS.chat,
          },

          // PRODUCT
          // {
          //   title: t('product'),
          //   path: paths.dashboard.product.root,
          //   icon: ICONS.product,
          //   children: [
          //     { title: t('list'), path: paths.dashboard.product.root },
          //     {
          //       title: t('details'),
          //       path: paths.dashboard.product.demo.details,
          //     },
          //     { title: t('create'), path: paths.dashboard.product.new },
          //     { title: t('edit'), path: paths.dashboard.product.demo.edit },
          //   ],
          // },

          // // ORDER
          // {
          //   title: t('order'),
          //   path: paths.dashboard.order.root,
          //   icon: ICONS.order,
          //   children: [
          //     { title: t('list'), path: paths.dashboard.order.root },
          //     { title: t('details'), path: paths.dashboard.order.demo.details },
          //   ],
          // },

          // // INVOICE
          // {
          //   title: t('invoice'),
          //   path: paths.dashboard.invoice.root,
          //   icon: ICONS.invoice,
          //   children: [
          //     { title: t('list'), path: paths.dashboard.invoice.root },
          //     {
          //       title: t('details'),
          //       path: paths.dashboard.invoice.demo.details,
          //     },
          //     { title: t('create'), path: paths.dashboard.invoice.new },
          //     { title: t('edit'), path: paths.dashboard.invoice.demo.edit },
          //   ],
          // },

          // // BLOG
          // {
          //   title: t('blog'),
          //   path: paths.dashboard.post.root,
          //   icon: ICONS.blog,
          //   children: [
          //     { title: t('list'), path: paths.dashboard.post.root },
          //     { title: t('details'), path: paths.dashboard.post.demo.details },
          //     { title: t('create'), path: paths.dashboard.post.new },
          //     { title: t('edit'), path: paths.dashboard.post.demo.edit },
          //   ],
          // },

          // // JOB
          // {
          //   title: t('job'),
          //   path: paths.dashboard.job.root,
          //   icon: ICONS.job,
          //   children: [
          //     { title: t('list'), path: paths.dashboard.job.root },
          //     { title: t('details'), path: paths.dashboard.job.demo.details },
          //     { title: t('create'), path: paths.dashboard.job.new },
          //     { title: t('edit'), path: paths.dashboard.job.demo.edit },
          //   ],
          // },

          // // TOUR
          // {
          //   title: t('tour'),
          //   path: paths.dashboard.tour.root,
          //   icon: ICONS.tour,
          //   children: [
          //     { title: t('list'), path: paths.dashboard.tour.root },
          //     { title: t('details'), path: paths.dashboard.tour.demo.details },
          //     { title: t('create'), path: paths.dashboard.tour.new },
          //     { title: t('edit'), path: paths.dashboard.tour.demo.edit },
          //   ],
          // },

          // // FILE MANAGER
          // {
          //   title: t('file_manager'),
          //   path: paths.dashboard.fileManager,
          //   icon: ICONS.folder,
          // },

          // // MAIL
          // {
          //   title: t('mail'),
          //   path: paths.dashboard.mail,
          //   icon: ICONS.mail,
          //   info: <Label color="error">+32</Label>,
          // },

          // // CHAT
          // {
          //   title: t('chat'),
          //   path: paths.dashboard.chat,
          //   icon: ICONS.chat,
          // },

          // // CALENDAR
          // {
          //   title: t('calendar'),
          //   path: paths.dashboard.calendar,
          //   icon: ICONS.calendar,
          // },

          // // KANBAN
          // {
          //   title: t('kanban'),
          //   path: paths.dashboard.kanban,
          //   icon: ICONS.kanban,
          // },
        ],
      },
    ];

    const navigationDataUser = [
      {
        subheader: t('management'),
        items: [
          {
            title: t('user'),
            path: paths.dashboard.user.root,
            icon: ICONS.user,
            children: [ { title: t('profile'), path: paths.dashboard.user.profile }, ],
          },
          {
            // DEPARTMENT
            title: t('Khu vực'),
            path: paths.dashboard.department.root,
            icon: ICONS.tour,
            children: [{ title: t('list'), path: paths.dashboard.department.list_user }],
          },
          {
            // WORK CYCLE
            title: t('Vụ/lứa'),
            path: paths.dashboard.workcycle.root,
            icon: ICONS.job,
            children: [{ title: t('list'), path: paths.dashboard.workcycle.workcycle_user }],
          },
          {
            // RECEIPT
            title: t('Phiếu'),
            path: paths.dashboard.receipt.root,
            icon: ICONS.invoice,
            children: [{ title: t('Danh sách'), path: paths.dashboard.receipt.list_user }],
          },

          {
            // WAREHOUSE
            title: t('Nghỉ phép và ứng lương'),
            path: paths.dashboard.leave.root,
            icon: ICONS.job,
            children: [
              { title: t('Ứng lương'), path: paths.dashboard.leave.advance_user },
              { title: t('Nghỉ phép'), path: paths.dashboard.leave.list_user },
            ],
          },
           {
            // ATTENDANCE
            title: t('Chấm công'),
            path: paths.dashboard.attendance.root,
            icon: ICONS.calendar,
            children: [
              { title: t('Danh sách'), path: paths.dashboard.attendance.checkIn },
            ],
          },
          {
            title: t('chat'),
            path: paths.dashboard.chat,
            icon: ICONS.chat,
          },
        ],
      },
    ];

    const navigationDataManager = [
      // OVERVIEW
      // ----------------------------------------------------------------------
      {
        subheader: t('overview'),
        items: [
          {
            title: t('app'),
            path: paths.dashboard.root,
            icon: ICONS.dashboard,
          },
        ],
      },

      // MANAGEMENT
      // ----------------------------------------------------------------------
      {
        subheader: t('management'),
        items: [
         {
            title: t('user'),
            path: paths.dashboard.user.root,
            icon: ICONS.user,
            children: [ { title: t('profile'), path: paths.dashboard.user.profile }, ],
          },
          {
            // DEPARTMENT
            title: t('Khu vực'),
            path: paths.dashboard.department.root,
            icon: ICONS.tour,
            children: [
              { title: t('list'), path: paths.dashboard.department.root },
              //  {
              //   title: t('details'),
              //   path: `${paths.dashboard.department.details}`,
              // },
            ],
          },
          {
            // WORK CYCLE
            title: t('Vụ/lứa'),
            path: paths.dashboard.workcycle.root,
            icon: ICONS.job,
            children: [{ title: t('list'), path: paths.dashboard.workcycle.root }],
          },
          {
            // RECEIPT
            title: t('Phiếu'),
            path: paths.dashboard.receipt.root,
            icon: ICONS.invoice,
            children: [{ title: t('Danh sách'), path: paths.dashboard.receipt.root }],
          },
          {
            // WAREHOUSE
            title: t('Kho hàng'),
            path: paths.dashboard.warehouse.root,
            icon: ICONS.product,
            children: [{ title: t('Danh sách'), path: paths.dashboard.warehouse.root }],
          },

          {
            // WAREHOUSE
            title: t('Nghỉ phép và ứng lương'),
            path: paths.dashboard.leave.root,
            icon: ICONS.job,
            children: [
              { title: t('Ứng lương'), path: paths.dashboard.leave.advance },
              { title: t('Nghỉ phép'), path: paths.dashboard.leave.root },
            ],
          },
           {
            // ATTENDANCE
            title: t('Chấm công'),
            path: paths.dashboard.attendance.root,
            icon: ICONS.calendar,
            children: [
              { title: t('Danh sách'), path: paths.dashboard.attendance.checkIn },
            ],
          },

          {
            title: t('chat'),
            path: paths.dashboard.chat,
            icon: ICONS.chat,
          },
        ],
      },
    ];

    const navigationDataAccountant: any[] = [
      // OVERVIEW
      // ----------------------------------------------------------------------
      {
        subheader: t('overview'),
        items: [
          {
            title: t('app'),
            path: paths.dashboard.root,
            icon: ICONS.dashboard,
          },
        ],
      },

      // MANAGEMENT
      // ----------------------------------------------------------------------
      {
        subheader: t('management'),
        items: [
          {
            title: t('user'),
            path: paths.dashboard.user.root,
            icon: ICONS.user,
            children: [ { title: t('profile'), path: paths.dashboard.user.profile }, ],
          },
          {
            title: t('Khách hàng'),
            path: paths.dashboard.partner.root,
            icon: ICONS.booking,
            children: [{ title: t('list'), path: paths.dashboard.partner.list }],
          },
          {
            title: t('Quỹ tiền'),
            path: paths.dashboard.fund.root,
            icon: ICONS.banking,
            children: [{ title: t('list'), path: paths.dashboard.fund.list }],
          },
          {
            title: t('user'),
            path: paths.dashboard.user.root,
            icon: ICONS.user,
            children: [{ title: t('list'), path: paths.dashboard.user.list }],
          },
          {
            // ITEM CATEGORY
            title: t('Hàng hóa'),
            path: paths.dashboard.category.root,
            icon: ICONS.job,
            children: [
              { title: t('thức ăn'), path: paths.dashboard.category.itemList },
              { title: t('vật tư tiêu hao'), path: paths.dashboard.category.cateList },
            ],
          },
          {
            // SPECIES
            title: t('Vật nuôi, cây trồng'),
            path: paths.dashboard.species.root,
            icon: ICONS.job,
            children: [
              { title: t('list'), path: paths.dashboard.species.root },
            ],
          },
          {
            // DEPARTMENT
            title: t('Khu vực'),
            path: paths.dashboard.department.root,
            icon: ICONS.tour,
            children: [
              { title: t('list'), path: paths.dashboard.department.root },
            ],
          },
          {
            // WORK CYCLE
            title: t('Vụ/lứa'),
            path: paths.dashboard.workcycle.root,
            icon: ICONS.job,
            children: [
              { title: t('list'), path: paths.dashboard.workcycle.root },
            ],
          },
          {
            // RECEIPT
            title: t('Phiếu'),
            path: paths.dashboard.receipt.root,
            icon: ICONS.invoice,
            children: [
              { title: t('Danh sách'), path: paths.dashboard.receipt.root },
            ],
          },
          {
            // WAREHOUSE
            title: t('Kho hàng'),
            path: paths.dashboard.warehouse.root,
            icon: ICONS.product,
            children: [
              { title: t('Danh sách'), path: paths.dashboard.warehouse.root },
            ],
          },

          {
            // WAREHOUSE
            title: t('Nghỉ phép và ứng lương'),
            path: paths.dashboard.leave.root,
            icon: ICONS.job,
            children: [
              { title: t('Ứng lương'), path: paths.dashboard.leave.advance },
              { title: t('Nghỉ phép'), path: paths.dashboard.leave.root },
              { title: t('Số dư'), path: paths.dashboard.leave.balance },
            ],
          },
          {
            // ATTENDANCE
            title: t('Lương'),
            path: paths.dashboard.attendance.root,
            icon: ICONS.calendar,
            children: [
              
              { title: t('Chấm công'), path: paths.dashboard.attendance.checkIn },
              { title: t('Danh sách'), path: paths.dashboard.attendance.root }],
          },
          {
            title: t('chat'),
            path: paths.dashboard.chat,
            icon: ICONS.chat,
          },
        ],
      },
    ];

    return isAdmin
      ? navigationDataAdmin
      : isAccountant
      ? navigationDataAccountant
      : isManager
      ? navigationDataManager
      : navigationDataUser;
  }, [t, user]);

  return data;
}
