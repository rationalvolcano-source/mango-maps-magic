import { createFileRoute } from '@tanstack/react-router';
import { DirectoryPage } from '@/components/gramshakti/directory';
import { pageHead, selectionSearch } from '@/lib/gramshakti/data';
export const Route = createFileRoute('/procurement')({
 validateSearch: selectionSearch,
 head: () => pageHead('Crop procurement directory', 'Explore eight agricultural crop categories and the Mango sourcing journey.'),
 component: DirectoryPage,
});
