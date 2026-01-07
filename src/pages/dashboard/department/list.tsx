import { Helmet } from 'react-helmet-async';
// sections
import { FarmListView } from 'src/sections/department/view';

// ----------------------------------------------------------------------

export default function DepartmentListPage() {
  return (
    <>
      <Helmet>
        <title> Khu vực</title>
      </Helmet>

      <FarmListView />
    </>
  );
}
