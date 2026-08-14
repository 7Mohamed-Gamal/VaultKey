import { SecretItem, GoogleSheetConfig } from '../types';
import { INITIAL_SAMPLE_SECRETS } from '../data/presets';

const STORAGE_KEYS = {
  SECRETS: 'keyvault_secrets_data_v1',
  GOOGLE_CONFIG: 'keyvault_google_config_v1',
  MASTER_PIN: 'keyvault_master_pin_v1',
  LANGUAGE: 'keyvault_preferred_lang_v1',
  SHORTCUT_CUSTOM: 'keyvault_shortcut_custom_v1'
};

export const getStoredSecrets = (): SecretItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECRETS);
    if (!raw) {
      // Seed with initial sample secrets
      localStorage.setItem(STORAGE_KEYS.SECRETS, JSON.stringify(INITIAL_SAMPLE_SECRETS));
      return INITIAL_SAMPLE_SECRETS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse secrets from storage', err);
    return INITIAL_SAMPLE_SECRETS;
  }
};

export const saveStoredSecrets = (secrets: SecretItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SECRETS, JSON.stringify(secrets));
  } catch (err) {
    console.error('Failed to save secrets to storage', err);
  }
};

export const getStoredGoogleConfig = (): GoogleSheetConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GOOGLE_CONFIG);
    if (!raw) {
      return {
        isConnected: false,
        spreadsheetId: null,
        spreadsheetName: 'KeyVault_API_Secrets_DB',
        spreadsheetUrl: null,
        lastSyncedAt: null,
        accountEmail: null,
        autoSync: true
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      isConnected: false,
      spreadsheetId: null,
      spreadsheetName: 'KeyVault_API_Secrets_DB',
      spreadsheetUrl: null,
      lastSyncedAt: null,
      accountEmail: null,
      autoSync: true
    };
  }
};

export const saveStoredGoogleConfig = (config: GoogleSheetConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save Google config', err);
  }
};

export const exportToDotEnv = (secrets: SecretItem[]): string => {
  const lines: string[] = [
    '# ========================================================',
    '# KeyVault & API Sync - Generated .env configuration',
    `# Exported: ${new Date().toLocaleString()}`,
    '# ========================================================\n'
  ];

  secrets.forEach(item => {
    // Sanitize key name into ENV format
    let keyName = item.serviceName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_');
    
    if (item.type === 'api_key' && !keyName.includes('KEY') && !keyName.includes('API') && !keyName.includes('SECRET')) {
      keyName += '_API_KEY';
    } else if (item.type === 'password' && !keyName.includes('PASS')) {
      keyName += '_PASSWORD';
    } else if (item.type === 'token' && !keyName.includes('TOKEN')) {
      keyName += '_TOKEN';
    }

    if (item.notes) {
      lines.push(`# ${item.notes} (Env: ${item.environment})`);
    }
    lines.push(`${keyName}="${item.secretValue}"\n`);
  });

  return lines.join('\n');
};

export const exportToCSV = (secrets: SecretItem[]): string => {
  const headers = ['ID', 'Type', 'Service Name', 'Category', 'Username/Email', 'Secret/Key/Password', 'Environment', 'Project', 'Tags', 'Notes', 'Created At', 'Last Updated'];
  
  const escapeCSV = (val: string | undefined | null) => {
    if (!val) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = secrets.map(s => [
    escapeCSV(s.id),
    escapeCSV(s.type),
    escapeCSV(s.serviceName),
    escapeCSV(s.category || 'General'),
    escapeCSV(s.usernameOrEmail || ''),
    escapeCSV(s.secretValue),
    escapeCSV(s.environment),
    escapeCSV(s.project || 'Default'),
    escapeCSV((s.tags || []).join('; ')),
    escapeCSV(s.notes || ''),
    escapeCSV(s.createdAt),
    escapeCSV(s.updatedAt)
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const exportToJSON = (secrets: SecretItem[]): string => {
  return JSON.stringify(secrets, null, 2);
};

export const parseDotEnv = (content: string): Partial<SecretItem>[] => {
  const lines = content.split(/\r?\n/);
  const results: Partial<SecretItem>[] = [];

  let currentComment = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentComment = '';
      continue;
    }

    if (trimmed.startsWith('#')) {
      // Capture comment if it doesn't look like section header
      if (!trimmed.includes('====') && !trimmed.includes('Generated')) {
        currentComment = trimmed.replace(/^#\s*/, '');
      }
      continue;
    }

    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) {
      const rawKey = match[1];
      let rawVal = match[2].trim();

      // Remove outer quotes if present
      if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"))) {
        rawVal = rawVal.substring(1, rawVal.length - 1);
      }

      // Convert KEY_NAME to friendly Service Name
      let serviceName = rawKey
        .replace(/_API_KEY$/i, '')
        .replace(/_KEY$/i, '')
        .replace(/_SECRET$/i, '')
        .replace(/_PASSWORD$/i, '')
        .replace(/_TOKEN$/i, '')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());

      if (!serviceName) serviceName = rawKey;

      let type: SecretItem['type'] = 'api_key';
      if (rawKey.toLowerCase().includes('pass')) {
        type = 'password';
      } else if (rawKey.toLowerCase().includes('token')) {
        type = 'token';
      } else if (rawKey.toLowerCase().includes('url') || rawKey.toLowerCase().includes('db') || rawKey.toLowerCase().includes('database')) {
        type = 'database_url';
      }

      results.push({
        type,
        serviceName,
        secretValue: rawVal,
        notes: currentComment || undefined,
        environment: 'production',
        tags: [rawKey]
      });

      currentComment = '';
    }
  }

  return results;
};

export const parseCSV = (content: string): Partial<SecretItem>[] => {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const results: Partial<SecretItem>[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV split considering quotes
    const cells: string[] = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (insideQuotes && line[j + 1] === '"') {
          currentCell += '"';
          j++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    if (cells.length >= 3) {
      // Headers: ID(0), Type(1), Service Name(2), Category(3), Username/Email(4), Secret(5), Env(6), Project(7), Tags(8), Notes(9)
      const serviceName = cells[2] || cells[0] || 'Imported Service';
      const secretValue = cells[5] || cells[3] || cells[1] || '';
      if (!secretValue) continue;

      const rawType = (cells[1] || 'api_key').toLowerCase();
      const validTypes = ['api_key', 'password', 'env_var', 'token', 'database_url', 'note'];
      const type = validTypes.includes(rawType) ? (rawType as any) : 'api_key';

      results.push({
        type,
        serviceName,
        usernameOrEmail: cells[4] || undefined,
        secretValue,
        environment: (cells[6] as any) || 'production',
        project: cells[7] || undefined,
        tags: cells[8] ? cells[8].split(';').map(t => t.trim()).filter(Boolean) : [],
        notes: cells[9] || undefined
      });
    }
  }

  return results;
};
