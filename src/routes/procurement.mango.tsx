import { createFileRoute } from '@tanstack/react-router';
import { LandscapePage } from '@/components/gramshakti/landscape';
import { pageHead, selectionSearch } from '@/lib/gramshakti/data';
export const Route = createFileRoute('/procurement/mango')({
 validateSearch: selectionSearch,
 head: () => pageHead('Mango India supply landscape', 'Explore Mango state production, availability and commercial sourcing geography.'),
 component: LandscapePage,
});
