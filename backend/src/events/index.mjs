// Lambda handler for POST /events
// Ingests analytics events into DynamoDB.
// Invalid payloads are silently dropped (return 200) to avoid breaking the frontend.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { validateEventRequest } from '../shared/validate.mjs';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.EVENTS_TABLE;

const HEADERS = { 'Content-Type': 'application/json' };

export async function handler(event) {
  let body;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    // Malformed JSON — drop silently
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
  }

  if (!validateEventRequest(body)) {
    // Invalid shape — drop silently
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
  }

  const { sessionId, event: eventName, props, ts } = body;

  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          sessionId,
          ts,
          event: eventName,
          ...(props ? { props } : {}),
        },
      }),
    );
  } catch (err) {
    console.error('Events Lambda DynamoDB error:', err);
    // Still return 200 — analytics failures must not affect the user
  }

  return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
}
