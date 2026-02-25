"use server";

import { createClient } from '@supabase/supabase-js';

export async function createStream(formData: FormData) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const streamerId = formData.get('streamerId') as string;
  const muxStreamKey = formData.get('muxStreamKey') as string;
  const muxPlaybackId = formData.get('muxPlaybackId') as string;

  const { data, error } = await supabase
    .from('streams')
    .insert({
      title,
      description,
      streamer_id: streamerId,
      mux_stream_key: muxStreamKey,
      mux_playback_id: muxPlaybackId,
      status: 'pending',
      is_live: false
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}