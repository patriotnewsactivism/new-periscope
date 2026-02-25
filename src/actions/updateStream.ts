"use server";

import { createClient } from '@supabase/supabase-js';

export async function updateStream(streamId: string, updates: Partial<{
  title: string;
  description: string;
  status: string;
  is_live: boolean;
  mux_playback_id: string;
  mux_stream_key: string;
}>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('streams')
    .update(updates)
    .eq('id', streamId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}