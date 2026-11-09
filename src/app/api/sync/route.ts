import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const REPO_OWNER = 'Hasminarsenal-files';
const REPO_NAME = 'Budget-Calculatorrr';
const FILE_PATH = 'data/cloud-store.json';
const LOCAL_FILE_PATH = path.join(process.cwd(), 'data', 'cloud-store.json');

interface UserDataStore {
  profiles?: any[];
  budgets?: any[];
  budget_categories?: any[];
  transactions?: any[];
  income?: any[];
  bills?: any[];
  savings_goals?: any[];
  debts?: any[];
  last_updated?: string;
}

const DEFAULT_INITIAL_DATA: UserDataStore = {
  budgets: [],
  budget_categories: [],
  transactions: [],
  income: [],
  bills: [],
  savings_goals: [],
  debts: [],
  profiles: [],
  last_updated: new Date().toISOString()
};

let memoryCache: { data: UserDataStore; sha?: string; cachedAt: number } | null = null;

function readLocalStore(): UserDataStore {
  try {
    if (fs.existsSync(LOCAL_FILE_PATH)) {
      const raw = fs.readFileSync(LOCAL_FILE_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[CloudSync] Failed to read local cloud-store.json:', err);
  }
  return { ...DEFAULT_INITIAL_DATA };
}

function writeLocalStore(data: UserDataStore) {
  try {
    const dir = path.dirname(LOCAL_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Ignore on read-only serverless filesystems
  }
}

async function getRemoteData(): Promise<{ data: UserDataStore; sha?: string }> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BudgetCatSync'
      },
      cache: 'no-store'
    });

    if (res.status === 200) {
      const json = await res.json();
      const content = Buffer.from(json.content, 'base64').toString('utf8');
      const parsed = JSON.parse(content);
      memoryCache = { data: parsed, sha: json.sha, cachedAt: Date.now() };
      return { data: parsed, sha: json.sha };
    }
  } catch (err) {
    console.warn('[CloudSync] Failed to fetch remote file from GitHub, using local store:', err);
  }

  const localData = readLocalStore();
  memoryCache = { data: localData, cachedAt: Date.now() };
  return { data: localData };
}

async function saveRemoteData(data: UserDataStore, existingSha?: string): Promise<boolean> {
  writeLocalStore(data);
  try {
    let shaToUse = existingSha;
    if (!shaToUse) {
      const checkRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'BudgetCatSync'
        },
        cache: 'no-store'
      });
      if (checkRes.status === 200) {
        const checkJson = await checkRes.json();
        shaToUse = checkJson.sha;
      }
    }

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const body: any = {
      message: `chore(sync): cloud synchronization [skip ci]`,
      content
    };
    if (shaToUse) {
      body.sha = shaToUse;
    }

    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'BudgetCatSync'
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const json = await res.json();
      memoryCache = { data, sha: json.content?.sha, cachedAt: Date.now() };
      return true;
    }
  } catch (err) {
    console.warn('[CloudSync] Failed to save remote file to GitHub:', err);
  }
  return false;
}

export async function GET() {
  try {
    const { data } = await getRemoteData();
    return NextResponse.json({
      success: true,
      data
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tables, reset } = body;

    const { data: remoteData, sha } = await getRemoteData();

    if (reset) {
      const freshData: UserDataStore = {
        ...DEFAULT_INITIAL_DATA,
        last_updated: new Date().toISOString()
      };
      memoryCache = { data: freshData, sha, cachedAt: Date.now() };
      await saveRemoteData(freshData, sha);
      return NextResponse.json({
        success: true,
        data: freshData
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    }

    const currentData: UserDataStore = { ...remoteData };

    if (tables) {
      if (Array.isArray(tables.budgets)) currentData.budgets = tables.budgets;
      if (Array.isArray(tables.budget_categories)) currentData.budget_categories = tables.budget_categories;
      if (Array.isArray(tables.transactions)) currentData.transactions = tables.transactions;
      if (Array.isArray(tables.income)) currentData.income = tables.income;
      if (Array.isArray(tables.bills)) currentData.bills = tables.bills;
      if (Array.isArray(tables.savings_goals)) currentData.savings_goals = tables.savings_goals;
      if (Array.isArray(tables.debts)) currentData.debts = tables.debts;
      if (Array.isArray(tables.profiles)) currentData.profiles = tables.profiles;
    }

    currentData.last_updated = new Date().toISOString();
    memoryCache = { data: currentData, sha, cachedAt: Date.now() };

    saveRemoteData(currentData, sha).catch((e) => console.warn('[CloudSync] Async save error:', e));

    return NextResponse.json({
      success: true,
      data: currentData
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
