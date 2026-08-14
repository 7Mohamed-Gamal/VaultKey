export type SecretType = 'api_key' | 'password' | 'env_var' | 'token' | 'database_url' | 'note';

export type EnvironmentType = 'production' | 'staging' | 'development' | 'testing' | 'personal';

export interface SecretItem {
  id: string;
  type: SecretType;
  serviceName: string;
  category?: string;
  secretValue: string;
  usernameOrEmail?: string;
  environment: EnvironmentType;
  tags: string[];
  notes?: string;
  project?: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  isFavorite?: boolean;
}

export interface GoogleSheetConfig {
  isConnected: boolean;
  spreadsheetId: string | null;
  spreadsheetName: string;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  accountEmail: string | null;
  accountName?: string;
  accountPhoto?: string;
  accessToken?: string | null;
  tokenExpiresAt?: number | null;
  autoSync: boolean;
  clientId?: string;
}

export interface ShortcutConfig {
  keyCombination: string;
  isEnabled: boolean;
}

export interface VaultStats {
  total: number;
  apiKeys: number;
  passwords: number;
  envVars: number;
  tokens: number;
  recentCount: number;
}

export interface ServicePreset {
  name: string;
  type: SecretType;
  icon: string;
  defaultEnvVarName?: string;
  color: string;
  category: 'AI & ML' | 'Cloud & Hosting' | 'Payment' | 'Auth & DB' | 'Communication' | 'Dev Tools' | 'General';
}
