import { createFileRoute } from '@tanstack/react-router';
import { CropArtworkPage } from '@/components/gramshakti/asset-viewer';
import { pageHead, selectionSearch } from '@/lib/gramshakti/data';
export const Route = createFileRoute('/procurement/mango/')({
 validateSearch: selectionSearch,
 head: () => pageHead('Mango India supply landscape', 'Explore Mango state production, availability and commercial sourcing geography.'),
 component: () => <CropArtworkPage crop="mango" screen="002"/>,
});
