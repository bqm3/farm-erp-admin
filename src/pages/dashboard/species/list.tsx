import { Helmet } from 'react-helmet-async';
// sections
import { SpeciesListView } from 'src/sections/species/view';

// ----------------------------------------------------------------------

export default function SpeciesListPage() {
  return (
    <>
      <Helmet>
        <title> Giống loài</title>
      </Helmet>

      <SpeciesListView />
    </>
  );
}
