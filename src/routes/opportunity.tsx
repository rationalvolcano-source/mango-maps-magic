import { createFileRoute } from '@tanstack/react-router';
import { FuturePage } from '@/components/gramshakti/entry';
import { pageHead, selectionSearch } from '@/lib/gramshakti/data';
export const Route = createFileRoute('/opportunity')({validateSearch: selectionSearch,head:()=>pageHead('Opportunity and FPO Discovery', 'Future agricultural intelligence module from GramShakti.'),component:FutureModule});
function FutureModule(){return <FuturePage climate={false}/>}
