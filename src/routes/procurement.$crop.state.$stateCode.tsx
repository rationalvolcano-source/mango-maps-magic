import { createFileRoute } from '@tanstack/react-router';
import { StateAssetPage } from '@/components/gramshakti/asset-viewer';
import { pageHead, selectionSearch } from '@/lib/gramshakti/data';
export const Route = createFileRoute('/procurement/$crop/state/$stateCode')({validateSearch:selectionSearch,head:({params})=>pageHead(`${params.crop} in ${params.stateCode}`,'State sourcing context and read-only evidence coverage.'),component:Page});
function Page(){const {crop,stateCode}=Route.useParams();return <StateAssetPage crop={crop} stateCode={stateCode}/>}
