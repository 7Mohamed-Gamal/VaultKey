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
 * Dynamically resolves the sheet tab name to use.
 * 1. Checks if 'Vault_Secrets' exists.
 * 2. If not, attempts to create it via batchUpdate addSheet.
 * 3. If cannot create, returns the first sheet title (e.g. 'Sheet1' or 'ورقة1').
 */
export async function resolveSheetTabName(
  accessToken: string,
  spreadsheetId: string
): Promise<string> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId || !accessToken) return 'Vault_Secrets';

  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=sheets.properties`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (metaRes.ok) {
      const data = await metaRes.json();
      const sheets = data.sheets || [];
      const hasVaultSheet = sheets.some((s: any) => s.properties?.title === 'Vault_Secrets');
      if (hasVaultSheet) return 'Vault_Secrets';

      // Try creating 'Vault_Secrets' sheet
      try {
        const addRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: 'Vault_Secrets',
                      gridProperties: { frozenRowCount: 1 }
                    }
                  }
                }
              ]
            })
          }
        );
        if (addRes.ok) {
          // Write headers to the new sheet
          await appendSheetValues(accessToken, cleanId, 'Vault_Secrets!A1:K1', [SHEET_HEADERS]);
          return 'Vault_Secrets';
        }
      } catch (e) {
        // Fallback to first existing sheet
      }

      // Return the first sheet's title
      if (sheets[0]?.properties?.title) {
        return sheets[0].properties.title;
      }
    } else if (metaRes.status === 401) {
      throw new Error('AUTH_EXPIRED: انتهت صلاحية إذن Google (Access Token). يرجى إعادة تسجيل الدخول بحساب Google لتجديده.');
    }
  } catch (err: any) {
    if (err?.message?.includes('AUTH_EXPIRED')) throw err;
    console.warn('Could not inspect sheet tabs:', err);
  }

  return 'Vault_Secrets';
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
    if (createRes.status === 401) {
      throw new Error('AUTH_EXPIRED: انتهت صلاحية إذن Google (Access Token). يرجى إعادة تسجيل الدخول بحساب Google.');
    }
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
 * Appends rows to a spreadsheet with fallback if tab name fails
 */
export async function appendSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<any> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  
  let res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    }
  );

  // If 400 (range parsing error e.g. tab name not found), fallback to generic A:K
  if (!res.ok && res.status === 400 && range.includes('!')) {
    res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/A:K:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED: انتهت صلاحية إذن Google (Access Token). يرجى إعادة تسجيل الدخول بحساب Google.');
    }
    throw new Error(errData.error?.message || `Failed to append values: HTTP ${res.status}`);
  }

  return await res.json();
}

/**
 * Syncs single secret item to Google Sheet
 */
export async function syncSecretToGoogleSheet(
  accessToken: string | null | undefined,
  config: GoogleSheetConfig,
  secret: SecretItem
): Promise<{ success: boolean; spreadsheetUrl?: string }> {
  // If webhookUrl is configured, sync via Apps Script Webhook
  if (config.webhookUrl) {
    try {
      await fetch(config.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'append', secret })
      });
      return {
        success: true,
        spreadsheetUrl: config.spreadsheetUrl || undefined
      };
    } catch (e) {
      console.warn('Webhook sync error:', e);
    }
  }

  if (!accessToken) {
    throw new Error('NO_TOKEN: يتطلب الحفظ في Google Sheets وجود Access Token أو Webhook.');
  }

  let currentSheetId = extractSpreadsheetId(config.spreadsheetId || '');

  // If no spreadsheet ID exists yet, create one
  if (!currentSheetId) {
    const created = await createGoogleSpreadsheet(accessToken, config.spreadsheetName || 'KeyVault_API_Secrets_DB');
    currentSheetId = created.id;
    config.spreadsheetId = created.id;
    config.spreadsheetUrl = created.url;
  }

  const sheetTitle = await resolveSheetTabName(accessToken, currentSheetId);

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

  await appendSheetValues(accessToken, currentSheetId, `'${sheetTitle}'!A:K`, [rowData]);

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
  secrets: SecretItem[],
  webhookUrl?: string | null
): Promise<{ success: boolean; rowCount: number }> {
  // 1. If webhookUrl is configured, sync via Apps Script Webhook
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all', secrets, headers: SHEET_HEADERS })
      });
      return { success: true, rowCount: secrets.length };
    } catch (err: any) {
      console.warn('Webhook sync notice:', err);
    }
  }

  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) throw new Error('Spreadsheet ID is missing');
  if (!accessToken) throw new Error('NO_TOKEN: لم يتم توفير Access Token للكتابة في Google Sheets.');

  const sheetTitle = await resolveSheetTabName(accessToken, cleanId);

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

  let range = `'${sheetTitle}'!A1:K${rows.length}`;
  let res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: rows })
    }
  );

  // If 400 (range error), fallback to A1:K
  if (!res.ok && res.status === 400) {
    range = `A1:K${rows.length}`;
    res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: rows })
      }
    );
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error('AUTH_EXPIRED: انتهت صلاحية إذن Google (Access Token). يرجى إعادة تسجيل الدخول بحساب Google.');
    }
    throw new Error(errData.error?.message || `Failed to push secrets: HTTP ${res.status}`);
  }

  return { success: true, rowCount: secrets.length };
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
    .filter(row => row && row.length >= 2 && (row[2] || row[4]))
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
