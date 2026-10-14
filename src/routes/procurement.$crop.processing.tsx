import { createFileRoute } from '@tanstack/react-router';
import { CropArtworkPage } from '@/components/gramshakti/asset-viewer';
import { pageHead, selectionSearch } from '@/lib/gramshakti/data';
export const Route = createFileRoute('/procurement/$crop/processing')({validateSearch:selectionSearch,head:({params})=>pageHead(`${params.crop} processing geographies`,'Original processing map, nodes and sourced catchment context.'),component:Page});
function Page(){const {crop}=Route.useParams();return <CropArtworkPage crop={crop} screen="006"/>}
