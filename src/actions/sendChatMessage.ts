"use server";

import { createClient } from '@supabase/supabase-js';

export async function sendChatMessage(formData: FormData) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const streamId = formData.get('streamId') as string;
  const userId = formData.get('userId') as string;
  const message = formData.get('message') as string;
  const username = formData.get('username') as string;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      stream_id: streamId,
      user_id: userId,
      username: username,
      message: message,
      timestamp: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}