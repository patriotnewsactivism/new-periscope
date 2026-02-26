"use server";

import Mux from "@mux/mux-node";
import { createClient } from '@supabase/supabase-js';

export async function startBroadcast(title: string, description: string, streamerId: string) {
  try {
    const muxTokenId = process.env.MUX_TOKEN_ID;
    const muxTokenSecret = process.env.MUX_TOKEN_SECRET;
    
    if (!muxTokenId || !muxTokenSecret) {
      throw new Error("Mux credentials not configured");
    }

    const muxClient = new Mux({
      tokenId: muxTokenId,
      tokenSecret: muxTokenSecret,
    });

    // 1. Create Mux Live Stream
    const stream = await muxClient.video.liveStreams.create({
      playback_policy: ["public"],
      new_asset_settings: { playback_policy: ["public"] },
      test: process.env.NODE_ENV !== "production",
    });

    const muxStreamKey = stream.stream_key;
    const muxPlaybackId = stream.playback_ids?.[0].id;

    if (!muxStreamKey || !muxPlaybackId) {
      throw new Error("Failed to create Mux live stream properly");
    }

    // 2. Save to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('streams')
      .insert({
        title,
        description,
        streamer_id: streamerId,
        mux_stream_key: muxStreamKey,
        mux_playback_id: muxPlaybackId,
        status: 'live',
        is_live: true,
        mux_live_stream_id: stream.id,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      streamKey: muxStreamKey,
      playbackId: muxPlaybackId,
      streamId: stream.id,
    };
  } catch (error: any) {
    console.error("Broadcast Start Error:", error);
    throw new Error(error.message || "Failed to start broadcast");
  }
}
