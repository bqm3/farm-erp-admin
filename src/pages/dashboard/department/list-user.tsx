import { Helmet } from 'react-helmet-async';
import { useEffect, useMemo, useState, useCallback } from 'react';
// routes
import { useParams } from 'src/routes/hooks';
// sections
import { DepartmentUserListView } from 'src/sections/department/view';

export default function DepartmentListPage() {
  const params = useParams();
  return (
    <>
      <Helmet>
        <title>Khu vực</title>
      </Helmet>

      <DepartmentUserListView />
    </>
  );
}
