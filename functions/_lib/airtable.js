export class AirtableConfigError extends Error {
  constructor(message, missing = []) {
    super(message);
    this.name = 'AirtableConfigError';
    this.missing = missing;
  }
}

export class AirtableValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AirtableValidationError';
  }
}

export class AirtableApiError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AirtableApiError';
  }
}

const ENV_KEYS = ['AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID', 'AIRTABLE_TABLE_NAME'];

export function getAirtableConfig(env = {}) {
  const missing = ENV_KEYS.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new AirtableConfigError(
      `Missing environment variables: ${missing.join(', ')}`,
      missing
    );
  }

  return {
    apiKey: env.AIRTABLE_API_KEY,
    baseId: env.AIRTABLE_BASE_ID,
    tableName: env.AIRTABLE_TABLE_NAME,
  };
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
    throw new AirtableApiError(`Airtable API error (${response.status}): ${detail}`);
  }

  const payload = await response.json();
  return payload.records[0];
}
