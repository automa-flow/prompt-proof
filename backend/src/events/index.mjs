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

  // Bound stored props size (~2 KB) to prevent storage-cost abuse
  let safeProps;
  if (props && typeof props === 'object') {
    const serialized = JSON.stringify(props);
    if (serialized.length <= 2048) safeProps = props;
  }

  // 90-day TTL so the analytics table never grows unbounded
  const expiresAt = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;

  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          sessionId,
          ts,
          event: eventName,
          expiresAt,
          ...(safeProps ? { props: safeProps } : {}),
        },
      }),
    );
  } catch (err) {
    console.error('Events Lambda DynamoDB error:', err);
    // Still return 200 — analytics failures must not affect the user
  }

  return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
}
