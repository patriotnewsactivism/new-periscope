"use server";

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Storage client with service role credentials
// This ensures we have full access to all buckets and files
export const createStorageClient = () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return supabase.storage;
};

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  filePath?: string;
  error?: string;
}

/**
 * Uploads a file to Supabase Storage
 */
export async function uploadFile(
  bucketName: string,
  filePath: string,
  fileData: Buffer,
  contentType?: string
): Promise<UploadResult> {
  try {
    const storage = createStorageClient();

    const { error } = await storage
      .from(bucketName)
      .upload(filePath, fileData, {
        contentType: contentType || "application/octet-stream",
        upsert: true,
      });

    if (error) {
      console.error(`Error uploading to ${bucketName}/${filePath}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }

    const { data: urlData } = storage.from(bucketName).getPublicUrl(filePath);

    return {
      success: true,
      publicUrl: urlData.publicUrl,
      filePath,
    };
  } catch (error) {
    console.error(`Error uploading to ${bucketName}/${filePath}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Downloads a file from Supabase Storage
 */
export async function downloadFile(
  bucketName: string,
  filePath: string
): Promise<Buffer | null> {
  try {
    const storage = createStorageClient();

    const { data, error } = await storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error(`Error downloading from ${bucketName}/${filePath}:`, error);
      return null;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error(`Error downloading from ${bucketName}/${filePath}:`, error);
    return null;
  }
}

/**
 * Deletes a file from Supabase Storage
 */
export async function deleteFile(
  bucketName: string,
  filePath: string
): Promise<boolean> {
  try {
    const storage = createStorageClient();

    const { error } = await storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`Error deleting ${bucketName}/${filePath}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error deleting ${bucketName}/${filePath}:`, error);
    return false;
  }
}

/**
 * Gets public URL for a file in Supabase Storage
 */
export function getPublicUrl(bucketName: string, filePath: string): string {
  const storage = createStorageClient();
  const { data } = storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
}