import { Helmet } from 'react-helmet-async';
import { useEffect, useMemo, useState, useCallback } from 'react';
// routes
import { useParams } from 'src/routes/hooks';
// sections
import { DepartmentListView } from 'src/sections/department/view';
import axiosInstance from 'src/utils/axios';

type FarmOption = { id: number; code?: string; name: string };

export default function DepartmentListPage() {
 

  return (
    <>
      <Helmet>
        <title>Khu vực</title>
      </Helmet>

      <DepartmentListView/>
    </>
  );
}
