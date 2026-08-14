import { SecretItem, GoogleSheetConfig } from '../types';

const SHEET_HEADERS = [
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

export async function createGoogleSpreadsheet(accessToken: string, title = 'KeyVault_API_Secrets_DB'): Promise<{ id: string; url: string }> {
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
                    red: 0.12,
                    green: 0.16,
                    blue: 0.23
                  },
                  horizontalAlignment: 'CENTER',
                  textFormat: {
                    foregroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0
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

export async function appendSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<any> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
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

export async function syncSecretToGoogleSheet(
  accessToken: string,
  config: GoogleSheetConfig,
  secret: SecretItem
): Promise<{ success: boolean; spreadsheetUrl?: string }> {
  let currentSheetId = config.spreadsheetId;

  // If no spreadsheet ID exists yet, create one in user's Google Drive
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

export async function fetchSecretsFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<SecretItem[]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Vault_Secrets!A2:K1000`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch from sheet');
  }

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((row: string[], index: number): SecretItem => {
    const rawType = (row[1] || 'api_key').toLowerCase();
    const validTypes = ['api_key', 'password', 'env_var', 'token', 'database_url', 'note'];
    const type = validTypes.includes(rawType) ? (rawType as any) : 'api_key';

    const tags = row[7] ? row[7].split(',').map((t: string) => t.trim()).filter(Boolean) : [];

    return {
      id: row[0] || `sec_imported_${index}_${Date.now()}`,
      type,
      serviceName: row[2] || 'Unnamed Service',
      usernameOrEmail: row[3] || '',
      secretValue: row[4] || '',
      environment: (row[5] as any) || 'production',
      project: row[6] || 'General',
      tags,
      notes: row[8] || '',
      createdAt: row[9] || new Date().toISOString(),
      updatedAt: row[10] || new Date().toISOString()
    };
  });
}
