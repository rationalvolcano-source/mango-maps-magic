import { createFileRoute } from '@tanstack/react-router';
import { CropArtworkPage } from '@/components/gramshakti/asset-viewer';
import { pageHead, selectionSearch } from '@/lib/gramshakti/data';
export const Route = createFileRoute('/procurement/mango/crop-protection')({
 validateSearch: selectionSearch,
 head: () => pageHead('Mango regional pest and management context', 'Explore regional Mango pest and disease context without pesticide prescriptions.'),
 component: () => <CropArtworkPage crop="mango" screen="003"/>,
});
