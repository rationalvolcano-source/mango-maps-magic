import { createFileRoute } from '@tanstack/react-router';
import { ProtectionPage } from '@/components/gramshakti/protection';
import { pageHead, selectionSearch } from '@/lib/gramshakti/data';
export const Route = createFileRoute('/procurement/mango/crop-protection')({
 validateSearch: selectionSearch,
 head: () => pageHead('Mango regional pest and management context', 'Explore regional Mango pest and disease context without pesticide prescriptions.'),
 component: ProtectionPage,
});
