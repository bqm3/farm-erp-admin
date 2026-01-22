import { Helmet } from 'react-helmet-async';
// routes
import { useParams } from 'src/routes/hooks';
// sections
import { DepartmentDetailPage } from 'src/sections/department/view';

// ----------------------------------------------------------------------

export default function DepartmentDetailsPage() {
  const params = useParams();

  const { id } = params;

  return (
    <>
      <Helmet>
        <title> Khu vực</title>
      </Helmet>

      <DepartmentDetailPage id={`${id}`} />
    </>
  );
}
