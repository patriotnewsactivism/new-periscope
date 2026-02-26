import Viewer from '@/components/Viewer';
import { getStream } from '@/actions/getStream';
import { notFound } from 'next/navigation';

interface ViewerPageProps {
  params: {
    id: string;
  };
}

export default async function ViewerPage({ params }: ViewerPageProps) {
  const stream = await getStream(params.id);

  if (!stream) {
    notFound();
  }

  return (
    <div className="h-screen w-screen bg-black">
      <Viewer 
        streamId={stream.id} 
        muxPlaybackId={stream.mux_playback_id}
        title={stream.title}
        description={stream.description}
      />
    </div>
  );
}
