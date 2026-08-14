import { ServicePreset, SecretItem } from '../types';

export const SERVICE_PRESETS: ServicePreset[] = [
  {
    name: 'OpenAI API',
    type: 'api_key',
    icon: 'Bot',
    defaultEnvVarName: 'OPENAI_API_KEY',
    color: 'from-emerald-500 to-teal-700',
    category: 'AI & ML'
  },
  {
    name: 'Anthropic Claude',
    type: 'api_key',
    icon: 'Sparkles',
    defaultEnvVarName: 'ANTHROPIC_API_KEY',
    color: 'from-amber-500 to-orange-700',
    category: 'AI & ML'
  },
  {
    name: 'Google Gemini',
    type: 'api_key',
    icon: 'Cpu',
    defaultEnvVarName: 'GEMINI_API_KEY',
    color: 'from-blue-500 to-indigo-700',
    category: 'AI & ML'
  },
  {
    name: 'Stripe Secret Key',
    type: 'api_key',
    icon: 'CreditCard',
    defaultEnvVarName: 'STRIPE_SECRET_KEY',
    color: 'from-violet-500 to-purple-800',
    category: 'Payment'
  },
  {
    name: 'Supabase Service Key',
    type: 'api_key',
    icon: 'Database',
    defaultEnvVarName: 'SUPABASE_SERVICE_ROLE_KEY',
    color: 'from-emerald-400 to-green-700',
    category: 'Auth & DB'
  },
  {
    name: 'GitHub Personal Token',
    type: 'token',
    icon: 'Github',
    defaultEnvVarName: 'GITHUB_TOKEN',
    color: 'from-zinc-700 to-zinc-900',
    category: 'Dev Tools'
  },
  {
    name: 'AWS Access Key',
    type: 'api_key',
    icon: 'Cloud',
    defaultEnvVarName: 'AWS_SECRET_ACCESS_KEY',
    color: 'from-amber-600 to-yellow-800',
    category: 'Cloud & Hosting'
  },
  {
    name: 'Resend Email API',
    type: 'api_key',
    icon: 'Mail',
    defaultEnvVarName: 'RESEND_API_KEY',
    color: 'from-slate-700 to-slate-900',
    category: 'Communication'
  },
  {
    name: 'Vercel Token',
    type: 'token',
    icon: 'Globe',
    defaultEnvVarName: 'VERCEL_TOKEN',
    color: 'from-gray-800 to-black',
    category: 'Cloud & Hosting'
  },
  {
    name: 'Firebase Service Account',
    type: 'api_key',
    icon: 'Flame',
    defaultEnvVarName: 'FIREBASE_PRIVATE_KEY',
    color: 'from-amber-500 to-red-600',
    category: 'Auth & DB'
  },
  {
    name: 'Cloudflare API Token',
    type: 'token',
    icon: 'Shield',
    defaultEnvVarName: 'CLOUDFLARE_API_TOKEN',
    color: 'from-orange-500 to-amber-700',
    category: 'Cloud & Hosting'
  },
  {
    name: 'Telegram Bot Token',
    type: 'token',
    icon: 'Send',
    defaultEnvVarName: 'TELEGRAM_BOT_TOKEN',
    color: 'from-sky-400 to-blue-600',
    category: 'Communication'
  }
];

export const INITIAL_SAMPLE_SECRETS: SecretItem[] = [
  {
    id: 'sec_sample_1',
    type: 'api_key',
    serviceName: 'OpenAI Platform',
    category: 'AI & ML',
    secretValue: 'sk-proj-9AbC8dEfGhIjKlMnOpQrStUvWxYz1234567890',
    usernameOrEmail: 'dev@mycompany.com',
    environment: 'production',
    tags: ['AI', 'GPT-4o', 'Billing'],
    notes: 'Used for Production Chatbot & Summarizer backend service',
    project: 'SaaS Platform v2',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    isFavorite: true
  },
  {
    id: 'sec_sample_2',
    type: 'api_key',
    serviceName: 'Stripe Payments',
    category: 'Payment',
    secretValue: 'sk_live_51MzAbCdEfGhIjKlMnOpQrStUvWxYz0987654321',
    usernameOrEmail: 'finance@mycompany.com',
    environment: 'production',
    tags: ['Stripe', 'Checkout', 'Webhooks'],
    notes: 'Live Stripe Secret Key for subscriptions',
    project: 'E-commerce Store',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    isFavorite: true
  },
  {
    id: 'sec_sample_3',
    type: 'password',
    serviceName: 'AWS Root Console',
    category: 'Cloud & Hosting',
    secretValue: 'X9#kL8$vM2!pQ7@wZ4^tB1',
    usernameOrEmail: 'admin@cloudinfrastructure.io',
    environment: 'production',
    tags: ['AWS', 'Root', 'MFA-Enabled'],
    notes: 'Emergency root access credentials. Hardware MFA token in safe.',
    project: 'Core Infrastructure',
    createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    isFavorite: false
  },
  {
    id: 'sec_sample_4',
    type: 'env_var',
    serviceName: 'Database Connection URI',
    category: 'Auth & DB',
    secretValue: 'postgresql://postgres:p4ssw0rdSecure!@db.mycluster.supabase.co:5432/postgres',
    usernameOrEmail: 'postgres',
    environment: 'staging',
    tags: ['Database', 'Postgres', 'Prisma'],
    notes: 'Staging cluster for QA team',
    project: 'SaaS Platform v2',
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    isFavorite: false
  }
];
