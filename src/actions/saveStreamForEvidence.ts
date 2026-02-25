"use server";

import { createClient } from '@supabase/supabase-js';
import { createChainOfCustody, addLogEntry, stringifyLog } from '@/lib/metadata';

export async function saveStreamForEvidence(streamId: string, evidenceDetails: {
  incidentId?: string;
  description?: string;
  metadata?: Record<string, any>;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: stream, error: streamError } = await supabase
    .from('streams')
    .select('*')
    .eq('id', streamId)
    .single();

  if (streamError) {
    throw new Error(streamError.message);
  }

  if (!stream) {
    throw new Error('Stream not found');
  }

  // Create chain of custody log for evidence
  const chainOfCustody = createChainOfCustody(streamId, stream.streamer_id, {
    action: 'save_for_evidence',
    incidentId: evidenceDetails.incidentId,
    description: evidenceDetails.description,
    metadata: evidenceDetails.metadata,
  });

  const { data: evidence, error: evidenceError } = await supabase
    .from('evidence_streams')
    .insert({
      stream_id: streamId,
      title: stream.title,
      description: stream.description,
      streamer_id: stream.streamer_id,
      mux_playback_id: stream.mux_playback_id,
      incident_id: evidenceDetails.incidentId,
      evidence_description: evidenceDetails.description,
      evidence_metadata: evidenceDetails.metadata,
      created_at: stream.created_at,
      metadata_log: stringifyLog(chainOfCustody)
    })
    .select('*')
    .single();

  if (evidenceError) {
    throw new Error(evidenceError.message);
  }

  const { error: updateError } = await supabase
    .from('streams')
    .update({ status: 'archived', is_live: false })
    .eq('id', streamId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return evidence;
}