import { createFileRoute } from '@tanstack/react-router';
import { StatePage } from '@/components/gramshakti/landscape';
import { pageHead, selectionSearch, states } from '@/lib/gramshakti/data';
export const Route = createFileRoute('/procurement/mango/state/$stateCode')({validateSearch:selectionSearch,head:({params})=>pageHead(`Mango in ${states.find(s=>s.code===params.stateCode)?.name??'unknown state'}`, 'State production, district evidence and Mango sourcing context.'),component:StateDetail});
function StateDetail(){const {stateCode}=Route.useParams();return <StatePage stateCode={stateCode}/>}
