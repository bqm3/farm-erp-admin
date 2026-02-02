import { Helmet } from 'react-helmet-async';
// sections
import { SpeciesListView } from 'src/sections/species/view';

// ----------------------------------------------------------------------

export default function SpeciesListPage() {
  return (
    <>
      <Helmet>
        <title> Vật nuôi, cây trồng</title>
      </Helmet>

      <SpeciesListView />
    </>
  );
}
