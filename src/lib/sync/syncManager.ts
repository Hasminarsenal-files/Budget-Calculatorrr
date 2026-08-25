import { db } from '../db';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { SyncQueueItem, SyncStatus } from '../types';

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error' | 'synced';

type SyncListener = (state: { status: SyncState; pendingCount: number; lastSyncedAt: string | null; error?: string }) => void;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private state: SyncState = 'idle';
  private pendingCount = 0;
  private lastSyncedAt: string | null = typeof window !== 'undefined' ? localStorage.getItem('budget_cat_last_synced') : null;
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncManager] Connection restored. Syncing changes...');
        this.sync();
      });
      window.addEventListener('offline', () => {
        this.updateState('offline');
      });

      // Periodic check every 30 seconds when online
      setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
          this.sync();
        }
      }, 30000);
    }
  }

  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    listener({
      status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : this.state,
      pendingCount: this.pendingCount,
      lastSyncedAt: this.lastSyncedAt
    });

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : this.state;
    this.listeners.forEach((listener) => {
      listener({
        status: currentState,
        pendingCount: this.pendingCount,
        lastSyncedAt: this.lastSyncedAt
      });
    });
  }

  private updateState(newState: SyncState, error?: string) {
    this.state = newState;
    this.notify();
  }

  public async updatePendingCount() {
    try {
      this.pendingCount = await db.sync_queue.count();
      this.notify();
    } catch (e) {
      console.warn('[SyncManager] Failed to count sync queue:', e);
    }
  }

  public async queueChange(
    table_name: SyncQueueItem['table_name'],
    action: SyncQueueItem['action'],
    record_id: string,
    payload: any
  ) {
    const queueItem: SyncQueueItem = {
      table_name,
      action,
      record_id,
      payload,
      timestamp: new Date().toISOString(),
      retry_count: 0
    };

    await db.sync_queue.add(queueItem);
    await this.updatePendingCount();

    if (navigator.onLine) {
      this.sync();
    }
  }

  public async sync(): Promise<void> {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateState('offline');
      return;
    }

    if (!isSupabaseConfigured()) {
      try {
        const queueItems = await db.sync_queue.toArray();
        for (const item of queueItems) {
          const table = (db as any)[item.table_name];
          if (table) {
            await table.update(item.record_id, {
              sync_status: 'synced',
              last_synced_at: new Date().toISOString()
            });
          }
        }
        await db.sync_queue.clear();

        // Mark any remaining local pending records as synced
        const tables = ['transactions', 'budgets', 'income', 'bills', 'savings_goals', 'debts'] as const;
        for (const tableName of tables) {
          const table = (db as any)[tableName];
          if (table) {
            const pendings = await table.where('sync_status').equals('pending').toArray();
            for (const record of pendings) {
              await table.update(record.id, { sync_status: 'synced' });
            }
          }
        }
      } catch (e) {
        console.warn('[SyncManager] Local sync error:', e);
      }

      await this.updatePendingCount();
      this.updateState('synced');
      return;
    }

    this.isSyncing = true;
    this.updateState('syncing');

    try {
      const queueItems = await db.sync_queue.toArray();

      for (const item of queueItems) {
        try {
          if (item.action === 'INSERT' || item.action === 'UPDATE') {
            const cleanPayload = { ...item.payload };
            delete cleanPayload.local_id;
            delete cleanPayload.sync_status;
            delete cleanPayload.last_synced_at;

            const { data, error } = await supabase
              .from(item.table_name)
              .upsert(cleanPayload)
              .select()
              .single();

            if (error) {
              console.error(`[SyncManager] Isolated error for ${item.table_name}:`, error);
              item.retry_count += 1;
              item.error_message = error.message;
              await db.sync_queue.put(item);
            } else if (data) {
              const table = (db as any)[item.table_name];
              if (table) {
                await table.update(item.record_id, {
                  id: data.id,
                  server_id: data.id,
                  sync_status: 'synced',
                  last_synced_at: new Date().toISOString()
                });
              }
              if (item.id) await db.sync_queue.delete(item.id);
            }
          } else if (item.action === 'DELETE') {
            const { error } = await supabase
              .from(item.table_name)
              .delete()
              .eq('id', item.record_id);

            if (!error) {
              const table = (db as any)[item.table_name];
              if (table) await table.delete(item.record_id);
              if (item.id) await db.sync_queue.delete(item.id);
            }
          }
        } catch (itemErr) {
          console.error('[SyncManager] Error syncing individual queue item:', itemErr);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await this.pullServerData(session.user.id);
      }

      this.lastSyncedAt = new Date().toISOString();
      if (typeof window !== 'undefined') {
        localStorage.setItem('budget_cat_last_synced', this.lastSyncedAt);
      }

      await this.updatePendingCount();

      const remaining = await db.sync_queue.count();
      if (remaining > 0) {
        this.updateState('error', `${remaining} items failed sync`);
      } else {
        this.updateState('synced');
      }
    } catch (err: any) {
      console.error('[SyncManager] General sync error:', err);
      this.updateState('error', err.message || 'Sync failed');
    } finally {
      this.isSyncing = false;
    }
  }

  private async pullServerData(userId: string) {
    const tables: ('budgets' | 'budget_categories' | 'transactions' | 'income' | 'bills' | 'savings_goals' | 'debts')[] = [
      'budgets',
      'transactions',
      'income',
      'bills',
      'savings_goals',
      'debts'
    ];

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', userId);

        if (!error && data) {
          const dexieTable = (db as any)[tableName];
          for (const item of data) {
            const existing = await dexieTable.get(item.id);
            if (!existing || existing.sync_status === 'synced') {
              await dexieTable.put({
                ...item,
                sync_status: 'synced',
                last_synced_at: new Date().toISOString()
              });
            }
          }
        }
      } catch (err) {
        console.warn(`[SyncManager] Pull error for ${tableName}:`, err);
      }
    }
  }
}

export const syncManager = new SyncManager();
