/* eslint-disable no-nested-ternary */
// src/sections/overview/app/view/overview-app-view.tsx
import { useEffect, useMemo, useState } from 'react';
// @mui
import { useTheme, alpha } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Iconify from 'src/components/iconify';

// hooks
import { useMockedUser } from 'src/hooks/use-mocked-user';
// components
import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';
// assets
import { SeoIllustration } from 'src/assets/illustrations';

import {
  getDashboardSummary,
  type DashboardEmployee,
  type DashboardSummary,
} from 'src/api/dashboard';
import AppWelcome from '../app-welcome';
import AppWidgetSummary from '../app-widget-summary';

// ----------------------------------------------------------------------

function fmtDate(d?: string | null) {
  if (!d) return '-';
  try {
    const dt = new Date(d);
    // dd/MM
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return '-';
  }
}

function displayNameOf(e: DashboardEmployee) {
  return e.full_name || e.name || `#${e.id}`;
}

export default function OverviewAppView() {
  const { user } = useMockedUser();
  const theme = useTheme();
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errMsg, setErrMsg] = useState<string>('');

  const now = useMemo(() => new Date(), []);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setErrMsg('');

        const res = await getDashboardSummary({ month, year });

        if (!mounted) return;
        setData(res);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Load dashboard failed';
        if (!mounted) return;
        setErrMsg(msg);
        enqueueSnackbar(msg, { variant: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [enqueueSnackbar, month, year]);

  const stats = data?.stats;

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Grid container spacing={3}>

         {/* 4 widgets */}
        <Grid xs={12} md={3}>
          <AppWidgetSummary
            title="Tổng nhân sự"
            percent={0}
            total={stats?.total_employees ?? 0}
            chart={{ series: [5, 18, 12, 51, 68, 11, 39, 37, 27, 20] }}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <AppWidgetSummary
            title="Tổng phòng ban"
            percent={0}
            total={stats?.total_departments ?? 0}
            chart={{ series: [10, 8, 12, 9, 7, 6, 8, 11, 10, 9] }}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <AppWidgetSummary
            title="Công việc tạo trong tháng"
            percent={0}
            total={stats?.tasks_created_in_month ?? 0}
            chart={{ series: [8, 9, 31, 8, 16, 37, 8, 33, 46, 31] }}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <AppWidgetSummary
            title="Phiếu tạo trong tháng"
            percent={0}
            total={stats?.receipts_created_in_month ?? 0}
            chart={{ series: [6, 7, 12, 14, 10, 9, 11, 13, 8, 7] }}
          />
        </Grid>
        
        {/* Sinh nhật hôm nay */}
        <Grid xs={12} md={6}>
          <Card
            sx={{
              height: 1,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.08)}`,
            }}
          >
            <CardHeader
              title={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.main,
                    }}
                  >
                    <Iconify icon="mdi:cake-variant" width={20} />
                  </Box>
                  <Stack spacing={0}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      Sinh nhật hôm nay
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {data?.period?.today || ''}
                    </Typography>
                  </Stack>
                </Stack>
              }
              sx={{ pb: 1 }}
            />

            <CardContent sx={{ pt: 0 }}>
              {loading ? (
                <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 2 }}>
                  <CircularProgress size={22} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Đang tải...
                  </Typography>
                </Stack>
              ) : (data?.birthdays?.today?.length || 0) === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Hôm nay không có ai sinh nhật.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding sx={{ mt: 0.5 }}>
                  {data!.birthdays.today.map((e, idx) => (
                    <Box key={e.id}>
                      {idx > 0 && <Divider sx={{ my: 1 }} />}

                      <ListItem
                        disableGutters
                        sx={{
                          py: 1.25,
                          px: 1,
                          borderRadius: 2,
                          transition: 'all .15s ease',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.06),
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            mr: 1.5,
                            bgcolor: alpha(theme.palette.primary.main, 0.18),
                            color: theme.palette.primary.main,
                            fontWeight: 800,
                          }}
                        >
                          {displayNameOf(e).slice(0, 1).toUpperCase()}
                        </Avatar>

                        <ListItemText
                          primary={
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              alignItems={{ xs: 'flex-start', sm: 'center' }}
                              justifyContent="space-between"
                            >
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {displayNameOf(e)}
                              </Typography>

                              <Chip
                                size="small"
                                label={fmtDate(e.dob || e.birth_date)}
                                icon={<Iconify icon="solar:calendar-bold" width={16} />}
                                sx={{
                                  height: 26,
                                  fontWeight: 700,
                                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                                  color: theme.palette.primary.main,
                                  '& .MuiChip-icon': { color: theme.palette.primary.main },
                                }}
                              />
                            </Stack>
                          }
                          secondary={
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              alignItems={{ xs: 'flex-start', sm: 'center' }}
                              sx={{ mt: 0.5 }}
                            >
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {e.roles
                                  ? `Chức vụ: ${e.roles[0].name}`
                                  : 'Chức vụ: -'}
                              </Typography>

                              {(e.email || e.phone) && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  • {e.email || e.phone}
                                </Typography>
                              )}
                            </Stack>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sinh nhật trong tháng */}
        <Grid xs={12} md={6}>
          <Card
            sx={{
              height: 1,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
              boxShadow: `0 10px 30px ${alpha(theme.palette.info.main, 0.08)}`,
            }}
          >
            <CardHeader
              title={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(theme.palette.info.main, 0.12),
                      color: theme.palette.info.main,
                    }}
                  >
                    <Iconify icon="solar:calendar-mark-bold" width={20} />
                  </Box>
                  <Stack spacing={0}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      Sinh nhật trong tháng
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Tháng {month}/{year}
                    </Typography>
                  </Stack>
                </Stack>
              }
              sx={{ pb: 1 }}
            />

            <CardContent sx={{ pt: 0 }}>
              {loading ? (
                <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 2 }}>
                  <CircularProgress size={22} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Đang tải...
                  </Typography>
                </Stack>
              ) : (data?.birthdays?.this_month?.length || 0) === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Tháng này chưa có dữ liệu sinh nhật.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding sx={{ mt: 0.5, maxHeight: 420, overflow: 'auto', pr: 0.5 }}>
                  {data!.birthdays.this_month.map((e, idx) => (
                    <Box key={e.id}>
                      {idx > 0 && <Divider sx={{ my: 1 }} />}

                      <ListItem
                        disableGutters
                        sx={{
                          py: 1.25,
                          px: 1,
                          borderRadius: 2,
                          transition: 'all .15s ease',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.info.main, 0.06),
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            mr: 1.5,
                            bgcolor: alpha(theme.palette.info.main, 0.18),
                            color: theme.palette.info.main,
                            fontWeight: 800,
                          }}
                        >
                          {displayNameOf(e).slice(0, 1).toUpperCase()}
                        </Avatar>

                        <ListItemText
                          primary={
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              alignItems={{ xs: 'flex-start', sm: 'center' }}
                              justifyContent="space-between"
                            >
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {displayNameOf(e)}
                              </Typography>

                              <Chip
                                size="small"
                                label={fmtDate(e.dob || e.birth_date)}
                                icon={<Iconify icon="solar:calendar-bold" width={16} />}
                                sx={{
                                  height: 26,
                                  fontWeight: 700,
                                  bgcolor: alpha(theme.palette.info.main, 0.12),
                                  color: theme.palette.info.main,
                                  '& .MuiChip-icon': { color: theme.palette.info.main },
                                }}
                              />
                            </Stack>
                          }
                          secondary={
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              alignItems={{ xs: 'flex-start', sm: 'center' }}
                              sx={{ mt: 0.5 }}
                            >
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {e.roles
                                  ? `Chức vụ: ${e.roles[0].name}`
                                  : 'Chức vụ: -'}
                              </Typography>

                              {(e.email || e.phone) && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  • {e.email || e.phone}
                                </Typography>
                              )}
                            </Stack>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

       
      </Grid>
    </Container>
  );
}
