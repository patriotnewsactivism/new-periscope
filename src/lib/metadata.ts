import { v4 as uuidv4 } from 'uuid';

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  screenResolution: { width: number; height: number };
  pixelRatio: number;
  camera?: {
    width: number;
    height: number;
    facingMode: string;
    frameRate: number;
  };
  microphone?: {
    sampleRate: number;
    channelCount: number;
  };
}

export interface MetadataLogEntry {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  details: Record<string, any>;
}

export interface ChainOfCustodyLog {
  streamId: string;
  entries: MetadataLogEntry[];
}

/**
 * Creates an initial chain of custody log for a stream
 */
export function createChainOfCustody(streamId: string, actor: string, details?: Record<string, any>): ChainOfCustodyLog {
  return {
    streamId,
    entries: [
      createLogEntry('log_created', actor, {
        ...details,
        version: '1.0',
        timestamp: new Date().toISOString(),
      }),
    ],
  };
}

/**
 * Creates a metadata log entry with unique identifier and timestamp
 */
export function createLogEntry(event: string, actor: string, details: Record<string, any>): MetadataLogEntry {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    event,
    actor,
    details,
  };
}

/**
 * Adds a new entry to an existing chain of custody log
 */
export function addLogEntry(
  log: ChainOfCustodyLog,
  event: string,
  actor: string,
  details: Record<string, any>
): ChainOfCustodyLog {
  return {
    ...log,
    entries: [
      ...log.entries,
      createLogEntry(event, actor, details),
    ],
  };
}

/**
 * Generates a JSON string from the log with indenting for readability
 */
export function stringifyLog(log: ChainOfCustodyLog): string {
  return JSON.stringify(log, null, 2);
}

/**
 * Parses a stringified chain of custody log
 */
export function parseLog(logString: string): ChainOfCustodyLog {
  return JSON.parse(logString);
}

/**
 * Creates a tamper-evident hash of the chain of custody log
 */
export async function generateTamperProofHash(log: ChainOfCustodyLog): Promise<string> {
  const logString = JSON.stringify(log);
  const encoder = new TextEncoder();
  const data = encoder.encode(logString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates that a chain of custody log has not been tampered with
 */
export async function validateLog(log: ChainOfCustodyLog, expectedHash?: string): Promise<boolean> {
  try {
    const calculatedHash = await generateTamperProofHash(log);
    
    if (expectedHash) {
      return calculatedHash === expectedHash;
    }

    return true; // Return true if no expected hash is provided (we just verified it can be hashed)
  } catch (error) {
    console.error('Failed to validate log:', error);
    return false;
  }
}