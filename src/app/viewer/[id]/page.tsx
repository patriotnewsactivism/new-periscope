import { Viewer } from '@/components/Viewer';

interface ViewerPageProps {
  params: {
    id: string;
  };
}

export default function ViewerPage({ params }: ViewerPageProps) {
  return <Viewer streamId={params.id} />;
}
