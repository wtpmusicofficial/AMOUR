import {
  AirtableApiError,
  AirtableConfigError,
  AirtableValidationError,
  createAirtableRecord,
  getAirtableConfig,
  mapSubmissionToFields,
} from '../_lib/airtable.js';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function isErrorType(err, name) {
  return err instanceof Error && (err.name === name || err.constructor.name === name);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
}

export async function onRequestPost(context) {
  try {
    const { env, request } = context;

    let data;
    try {
      data = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const config = getAirtableConfig(env);
    const fields = mapSubmissionToFields(data);
    const record = await createAirtableRecord(config, fields);

    return jsonResponse({
      ok: true,
      id: record.id,
    });
  } catch (err) {
    if (isErrorType(err, 'AirtableValidationError')) {
      return jsonResponse({ error: err.message }, 400);
    }

    if (isErrorType(err, 'AirtableConfigError')) {
      console.error(err.message);
      return jsonResponse(
        {
          error: 'Server configuration error',
          missing: err.missing,
          hint: 'Set these in Cloudflare Pages → Settings → Environment variables (Production and Preview).',
        },
        500
      );
    }

    if (isErrorType(err, 'AirtableApiError')) {
      console.error(err.message);
      return jsonResponse(
        {
          error: 'Failed to save signup',
          detail: err.message,
        },
        502
      );
    }

    console.error(err);
    return jsonResponse({ error: 'Unexpected server error' }, 500);
  }
}
