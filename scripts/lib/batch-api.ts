/**
 * Claude Batch API wrapper for processing transcripts.
 *
 * Uses the Message Batches API to submit many requests at once,
 * then polls for completion.
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export interface BatchRequest {
  custom_id: string;
  params: {
    model: string;
    max_tokens: number;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  };
}

export interface BatchResult {
  custom_id: string;
  result: {
    type: 'succeeded' | 'errored' | 'expired' | 'canceled';
    message?: {
      content: Array<{ type: 'text'; text: string }>;
    };
    error?: { message: string };
  };
}

/**
 * Submit a batch of requests to the Claude Message Batches API.
 * Returns the batch ID.
 */
export async function submitBatch(
  requests: BatchRequest[],
): Promise<string> {
  console.log(`Submitting batch of ${requests.length} requests...`);

  const batch = await client.messages.batches.create({
    requests: requests.map((r) => ({
      custom_id: r.custom_id,
      params: r.params,
    })),
  });

  console.log(`Batch created: ${batch.id} (status: ${batch.processing_status})`);
  return batch.id;
}

/**
 * Poll a batch until it completes. Returns results.
 */
export async function waitForBatch(
  batchId: string,
  pollIntervalMs = 15000,
): Promise<void> {
  console.log(`Waiting for batch ${batchId}...`);

  while (true) {
    const batch = await client.messages.batches.retrieve(batchId);

    const counts = batch.request_counts;
    const total = counts.processing + counts.succeeded + counts.errored + counts.expired + counts.canceled;
    console.log(
      `  Status: ${batch.processing_status} | ` +
      `Succeeded: ${counts.succeeded}/${total} | ` +
      `Errored: ${counts.errored} | ` +
      `Processing: ${counts.processing}`
    );

    if (batch.processing_status === 'ended') {
      console.log(`Batch ${batchId} completed.`);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}

/**
 * Retrieve all results from a completed batch.
 */
export async function getBatchResults(batchId: string): Promise<BatchResult[]> {
  const results: BatchResult[] = [];

  for await (const result of client.messages.batches.results(batchId)) {
    results.push(result as unknown as BatchResult);
  }

  return results;
}

/**
 * Submit a batch, wait for completion, and return all results.
 */
export async function runBatch(requests: BatchRequest[]): Promise<BatchResult[]> {
  const batchId = await submitBatch(requests);
  await waitForBatch(batchId);
  return getBatchResults(batchId);
}
