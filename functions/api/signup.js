import {
  AirtableConfigError,
  AirtableValidationError,
  createAirtableRecord,
  getAirtableConfig,
  mapSubmissionToFields,
} from '../../lib/airtable.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
}

export async function onRequestPost(context) {
  const { env, request } = context;

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  try {
    const config = getAirtableConfig(env);
    const fields = mapSubmissionToFields(data);
    const record = await createAirtableRecord(config, fields);

    return jsonResponse({
      ok: true,
      id: record.id,
    });
  } catch (err) {
    if (err instanceof AirtableValidationError) {
      return jsonResponse({ error: err.message }, 400);
    }

    if (err instanceof AirtableConfigError) {
      console.error(err.message);
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    console.error(err);
    return jsonResponse({ error: 'Failed to save signup' }, 502);
  }
}
