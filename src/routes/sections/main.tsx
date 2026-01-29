import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
// layouts
import MainLayout from 'src/layouts/main';
import SimpleLayout from 'src/layouts/simple';
import CompactLayout from 'src/layouts/compact';
// components
import { SplashScreen } from 'src/components/loading-screen';


// ----------------------------------------------------------------------

export const mainRoutes = [
  {
    element: (
      <MainLayout>
        <Suspense fallback={<SplashScreen />}>
          <Outlet />
        </Suspense>
      </MainLayout>
    ),
    children: [
      
    ],
  },
  {
    element: (
      <SimpleLayout>
        <Suspense fallback={<SplashScreen />}>
          <Outlet />
        </Suspense>
      </SimpleLayout>
    ),
    children: [
    ],
  },
  {
    element: (
      <CompactLayout>
        <Suspense fallback={<SplashScreen />}>
          <Outlet />
        </Suspense>
      </CompactLayout>
    ),
    children: [
     
    ],
  },
];
