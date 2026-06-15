export class AirtableConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AirtableConfigError';
  }
}

export class AirtableValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AirtableValidationError';
  }
}

export function getAirtableConfig(env) {
  const apiKey = env.AIRTABLE_API_KEY;
  const baseId = env.AIRTABLE_BASE_ID;
  const tableName = env.AIRTABLE_TABLE_NAME;

  if (!apiKey || !baseId || !tableName) {
    throw new AirtableConfigError(
      'Missing AIRTABLE_API_KEY, AIRTABLE_BASE_ID, or AIRTABLE_TABLE_NAME'
    );
  }

  return { apiKey, baseId, tableName };
}

export function mapSubmissionToFields(data) {
  validateSubmission(data);

  return {
    Location: data.location,
    Age: data.age,
    Gender: data.gender,
    'House Music': data.houseMusic,
    Dancing: data.dancing,
    Interests: data.interests,
    Instagram: data.instagram,
    'First Name': data.firstName,
    'Last Name': data.lastName,
    'Full Name': data.fullName,
    Phone: data.phone,
  };
}

function validateSubmission(data) {
  const required = [
    'location',
    'age',
    'gender',
    'houseMusic',
    'dancing',
    'interests',
    'instagram',
    'firstName',
    'lastName',
    'fullName',
    'phone',
  ];

  for (const key of required) {
    if (!data[key] || String(data[key]).trim() === '') {
      throw new AirtableValidationError(`Missing required field: ${key}`);
    }
  }

  if (data.age === 'Under 21') {
    throw new AirtableValidationError('Submissions must be 21+');
  }

  const phoneDigits = data.phone.replace(/\D/g, '');
  if (phoneDigits.length !== 10) {
    throw new AirtableValidationError('Invalid phone number');
  }
}

export async function createAirtableRecord(config, fields) {
  const url = `https://api.airtable.com/v0/${config.baseId}/${encodeURIComponent(config.tableName)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      records: [{ fields }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Airtable API error (${response.status}): ${detail}`);
  }

  const payload = await response.json();
  return payload.records[0];
}
