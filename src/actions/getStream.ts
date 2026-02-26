"use server";

import { createClient } from '@supabase/supabase-js';

export async function getStream(streamId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('streams')
    .select('*')
    .eq('id', streamId)
    .single();

  if (error) {
    console.error('Error fetching stream:', error);
    return null;
  }

  return data;
}
