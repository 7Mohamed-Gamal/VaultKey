import { SecretItem, GoogleSheetConfig } from '../types';

export const SHEET_HEADERS = [
  'ID',
  'Type',
  'Service / Platform',
  'Username / Email',
  'Secret / API Key / Password',
  'Environment',
  'Project',
  'Tags',
  'Notes',
  'Date Created',
  'Last Updated'
];

/**
 * Extracts Spreadsheet ID from full URL or returns the clean ID
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Creates a brand new Google Spreadsheet with headers
 */
export async function createGoogleSpreadsheet(
  accessToken: string,
  title = 'KeyVault_API_Secrets_DB'
): Promise<{ id: string; url: string }> {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: title
      },
      sheets: [
        {
          properties: {
            title: 'Vault_Secrets',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    })
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to create spreadsheet: ${createRes.statusText}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Format header row with styling
  await formatHeaderRow(accessToken, spreadsheetId);

  // Write initial header values
  await appendSheetValues(accessToken, spreadsheetId, 'Vault_Secrets!A1:K1', [SHEET_HEADERS]);

  return { id: spreadsheetId, url: spreadsheetUrl };
}

/**
 * Applies dark header styling to sheet
 */
export async function formatHeaderRow(accessToken: string, spreadsheetId: string): Promise<void> {
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.05,
                    green: 0.72,
                    blue: 0.54
                  },
                  horizontalAlignment: 'CENTER',
                  textFormat: {
                    foregroundColor: {
                      red: 0.0,
                      green: 0.0,
                      blue: 0.0
                    },
                    fontSize: 11,
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 11
              }
            }
          }
        ]
      })
    });
  } catch (err) {
    console.warn('Could not apply header styling, continuing:', err);
  }
}

/**
 * Appends rows to a spreadsheet
 */
export async function appendSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<any> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values
      })
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to append values: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Syncs single secret item to Google Sheet
 */
export async function syncSecretToGoogleSheet(
  accessToken: string,
  config: GoogleSheetConfig,
  secret: SecretItem
): Promise<{ success: boolean; spreadsheetUrl?: string }> {
  let currentSheetId = extractSpreadsheetId(config.spreadsheetId || '');

  // If no spreadsheet ID exists yet, create one
  if (!currentSheetId) {
    const created = await createGoogleSpreadsheet(accessToken, config.spreadsheetName || 'KeyVault_API_Secrets_DB');
    currentSheetId = created.id;
    config.spreadsheetId = created.id;
    config.spreadsheetUrl = created.url;
  }

  const rowData = [
    secret.id,
    secret.type.toUpperCase(),
    secret.serviceName,
    secret.usernameOrEmail || '',
    secret.secretValue,
    secret.environment,
    secret.project || 'General',
    (secret.tags || []).join(', '),
    secret.notes || '',
    secret.createdAt,
    secret.updatedAt
  ];

  await appendSheetValues(accessToken, currentSheetId, 'Vault_Secrets!A:K', [rowData]);

  return {
    success: true,
    spreadsheetUrl: config.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${currentSheetId}/edit`
  };
}

/**
 * Pushes entire local secret array to Google Sheet (overwrites or appends)
 */
export async function pushAllSecretsToSheet(
  accessToken: string,
  spreadsheetId: string,
  secrets: SecretItem[]
): Promise<boolean> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId || !accessToken) return false;

  const rows = [
    SHEET_HEADERS,
    ...secrets.map(s => [
      s.id,
      s.type.toUpperCase(),
      s.serviceName,
      s.usernameOrEmail || '',
      s.secretValue,
      s.environment,
      s.project || 'General',
      (s.tags || []).join(', '),
      s.notes || '',
      s.createdAt,
      s.updatedAt
    ])
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/Vault_Secrets!A1:K${rows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rows
      })
    }
  );

  return res.ok;
}

/**
 * Fetches all secrets from Google Sheet with fallback to standard Sheet1 or API Key
 */
export async function fetchSecretsFromSheet(
  auth: { accessToken?: string | null; apiKey?: string | null },
  rawSpreadsheetId: string
): Promise<SecretItem[]> {
  const cleanId = extractSpreadsheetId(rawSpreadsheetId);
  if (!cleanId) {
    throw new Error('Spreadsheet ID is missing');
  }

  const { accessToken, apiKey } = auth;
  if (!accessToken && !apiKey) {
    throw new Error('Google OAuth Access Token or API Key is required');
  }

  // Try sheet names: 'Vault_Secrets', 'Sheet1', or generic range 'A2:K1000'
  const sheetNamesToTry = ['Vault_Secrets!A2:K1000', 'Sheet1!A2:K1000', 'A2:K1000'];

  let rows: string[][] = [];
  let lastError: any = null;

  for (const range of sheetNamesToTry) {
    try {
      let url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}`;
      if (apiKey && !accessToken) {
        url += `?key=${apiKey}`;
      }

      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(url, { method: 'GET', headers });
      if (res.ok) {
        const data = await res.json();
        if (data.values && Array.isArray(data.values)) {
          rows = data.values;
          break;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        lastError = errData.error?.message || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      lastError = err.message || err;
    }
  }

  if (rows.length === 0 && lastError) {
    console.warn('Could not fetch rows with exact sheet names, last error:', lastError);
  }

  // Convert rows into valid SecretItem objects
  const parsedItems: SecretItem[] = rows
    .filter(row => row && row.length >= 2 && (row[2] || row[4])) // Ensure at least serviceName or secret exists
    .map((row: string[], index: number): SecretItem => {
      const rawType = (row[1] || 'api_key').toLowerCase().replace(/\s+/g, '_');
      const validTypes = ['api_key', 'password', 'env_var', 'token', 'database_url', 'note'];
      const type = validTypes.includes(rawType) ? (rawType as any) : 'api_key';

      const tags = row[7] 
        ? row[7].split(',').map((t: string) => t.trim()).filter(Boolean) 
        : [];

      return {
        id: row[0] || `sec_sheet_${index}_${Date.now()}`,
        type,
        serviceName: row[2] || 'Unnamed Service',
        usernameOrEmail: row[3] || undefined,
        secretValue: row[4] || '',
        environment: (row[5] as any) || 'production',
        project: row[6] || 'General',
        tags,
        notes: row[8] || '',
        createdAt: row[9] || new Date().toISOString(),
        updatedAt: row[10] || new Date().toISOString()
      };
    });

  return parsedItems;
}
