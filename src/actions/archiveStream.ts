"use server";

import { createClient } from "@supabase/supabase-js";
import { Buffer } from "buffer";

interface ArchiveStreamParams {
  streamId: string;
  title: string;
  description: string;
  recordedUrl: string;
  thumbnailUrl?: string;
  userId: string;
}

export async function archiveStream(params: ArchiveStreamParams): Promise<{ success: boolean; error?: string }> {
  // Validate parameters
  if (!params.streamId || !params.title || !params.recordedUrl || !params.userId) {
    return { success: false, error: "Missing required parameters" };
  }

  try {
    // Initialize Supabase client (using environment variables)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create archive record in database
    const { data: archiveRecord, error: dbError } = await supabase
      .from("archived_streams")
      .insert({
        stream_id: params.streamId,
        title: params.title,
        description: params.description,
        user_id: params.userId,
        status: "pending",
        metadata_log: JSON.stringify({
          event: "archive_initiated",
          timestamp: new Date().toISOString(),
          actor: params.userId,
          details: {
            streamId: params.streamId,
            title: params.title,
            description: params.description,
          },
        }),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error creating archive record:", dbError);
      return { success: false, error: dbError.message };
    }

    // Download recorded stream from URL
    console.log(`Downloading stream ${params.streamId} from ${params.recordedUrl}`);
    
    const response = await fetch(params.recordedUrl);
    if (!response.ok) {
      throw new Error(`Failed to download stream: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const bucketName = "archived-streams";
    const filePath = `${params.userId}/${params.streamId}.mp4`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage error uploading stream:", uploadError);
      
      await supabase
        .from("archived_streams")
        .update({
          status: "failed",
          metadata_log: JSON.stringify({
            event: "archive_failed",
            timestamp: new Date().toISOString(),
            actor: params.userId,
            details: {
              reason: "Storage upload failed",
              error: uploadError.message,
            },
          }),
        })
        .eq("stream_id", params.streamId);

      return { success: false, error: `Storage upload failed: ${uploadError.message}` };
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update archive record with success status and file metadata
    await supabase
      .from("archived_streams")
      .update({
        status: "completed",
        archived_url: publicUrl,
        file_path: filePath,
        file_size: buffer.length,
        metadata_log: JSON.stringify({
          event: "archive_completed",
          timestamp: new Date().toISOString(),
          actor: params.userId,
          details: {
            publicUrl,
            filePath,
            fileSize: buffer.length,
          },
        }),
      })
      .eq("stream_id", params.streamId);

    console.log(`Stream ${params.streamId} archived successfully at ${filePath}`);

    return { success: true };
  } catch (error) {
    console.error("Error archiving stream:", error);
    
    // Attempt to update status to failed if archive record exists
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase
        .from("archived_streams")
        .update({
          status: "failed",
          metadata_log: JSON.stringify({
            event: "archive_failed",
            timestamp: new Date().toISOString(),
            actor: params.userId,
            details: {
              reason: "Archive process failed",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          }),
        })
        .eq("stream_id", params.streamId);
    } catch (dbError) {
      console.error("Failed to update failure status:", dbError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}