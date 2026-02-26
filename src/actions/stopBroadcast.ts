"use server";

import Mux from "@mux/mux-node";
import { createClient } from '@supabase/supabase-js';
import { createChainOfCustody, addLogEntry, stringifyLog } from '@/lib/metadata';

export async function stopBroadcast(streamId: string, muxLiveStreamId: string, streamerId: string, finalMetadata: any) {
  try {
    const muxTokenId = process.env.MUX_TOKEN_ID;
    const muxTokenSecret = process.env.MUX_TOKEN_SECRET;
    
    if (muxTokenId && muxTokenSecret) {
      const muxClient = new Mux({
        tokenId: muxTokenId,
        tokenSecret: muxTokenSecret,
      });
      // 1. Signal Mux to stop (optional, usually stops when ingest ends)
      // await muxClient.video.liveStreams.signalComplete(muxLiveStreamId);
    }

    // 2. Prepare final metadata log
    let log = createChainOfCustody(streamId, streamerId, {
      event: 'stream_stopped',
      timestamp: new Date().toISOString(),
      final_gps: finalMetadata.gps,
      duration: finalMetadata.duration,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Update stream status and save metadata
    const { data, error } = await supabase
      .from('streams')
      .update({
        status: 'archived',
        is_live: false,
        metadata_log: stringifyLog(log),
        ended_at: new Date().toISOString(),
      })
      .eq('id', streamId)
      .select('*')
      .single();

    if (error) throw new Error(`Database update failed: ${error.message}`);

    return { success: true };
  } catch (error: any) {
    console.error("Broadcast Stop Error:", error);
    return { success: false, error: error.message };
  }
}
