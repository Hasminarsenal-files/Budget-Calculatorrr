'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { CatIllustration } from '@/components/ui/CatIllustration';
import { useAuth } from '@/lib/auth/AuthContext';
import { useSync } from '@/lib/hooks/useSync';
import { db } from '@/lib/db';
import { User, Phone, Mail, Globe, RefreshCw, Trash2, CheckCircle2, Shield, LogOut } from 'lucide-react';
import { CatMood } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { profile, updateProfile, logoutUser, isOfflineMode } = useAuth();
  const { status, pendingCount, lastSyncedAt, triggerSync } = useSync();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [currency, setCurrency] = useState(profile?.currency || 'USD');
  const [selectedAvatar, setSelectedAvatar] = useState<CatMood>((profile?.avatar_url as CatMood) || 'happy');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const catAvatarOptions: { mood: CatMood; label: string }[] = [
    { mood: 'happy', label: 'Happy Whiskers' },
    { mood: 'saving', label: 'Piggy Saver' },
    { mood: 'rich', label: 'Cool Tycoon' },
    { mood: 'warning', label: 'Alert Kitty' },
    { mood: 'sleeping', label: 'Sleepy Paws' },
    { mood: 'detective', label: 'Detective Cat' },
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    const res = await updateProfile({
      full_name: fullName,
      phone,
      currency,
      avatar_url: selectedAvatar
    });

    setIsSaving(false);
    if (!res.error) {
      setSuccessMsg('Profile updated successfully! 🐾');
    }
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear local IndexedDB cache? Local unsynced changes will be lost.')) {
      await db.sync_queue.clear();
      await db.transactions.clear();
      await db.budgets.clear();
      window.location.reload();
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Account & App Settings ⚙️</h1>
          <p className="text-xs sm:text-sm text-[#7C6E6A]">Manage your profile details, mascot avatar, currency, and offline synchronization.</p>
        </div>

        {/* Profile Settings Form */}
        <Card className="space-y-6">
          <CardHeader>
            <div>
              <CardTitle>Personal Profile</CardTitle>
              <CardDescription>Update your personal information and mascot avatar</CardDescription>
            </div>
            {isOfflineMode && <Badge variant="peach">Offline Mode Active</Badge>}
          </CardHeader>

          {successMsg && (
            <div className="bg-[#EBF1EC] text-[#6E8B74] border border-[#D1E2D4] p-3 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Mascot Avatar Picker */}
            <div>
              <label className="text-xs font-semibold text-[#3A2E2B] mb-3 block">
                Choose Cat Mascot Avatar
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {catAvatarOptions.map((item) => (
                  <button
                    key={item.mood}
                    type="button"
                    onClick={() => setSelectedAvatar(item.mood)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                      selectedAvatar === item.mood
                        ? 'border-[#6E8B74] bg-[#EBF1EC] ring-2 ring-[#6E8B74]'
                        : 'border-[#EFE6DD] bg-[#FAF6F0] hover:bg-white'
                    }`}
                  >
                    <CatIllustration mood={item.mood} size={48} />
                    <span className="text-[11px] font-bold text-[#3A2E2B] text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email Address (Read Only)"
                value={profile?.email || ''}
                leftIcon={<Mail className="w-4 h-4" />}
                disabled
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                placeholder="+1 555-0199"
              />

              <div>
                <label className="text-xs font-semibold text-[#3A2E2B] mb-1.5 block">Preferred Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-white border border-[#EFE6DD] text-[#3A2E2B] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#6E8B74]"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="sage" isLoading={isSaving}>
                Save Changes 🐾
              </Button>
            </div>
          </form>
        </Card>

        {/* Offline Sync & Storage Management Card */}
        <Card className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle>Offline Engine & Sync Status</CardTitle>
              <CardDescription>Dexie IndexedDB local store and Supabase synchronization</CardDescription>
            </div>
            <Badge variant={status === 'offline' ? 'peach' : 'sage'}>
              {status.toUpperCase()}
            </Badge>
          </CardHeader>

          <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EFE6DD] space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#7C6E6A]">Pending Sync Queue Items:</span>
              <span className="font-bold text-[#3A2E2B]">{pendingCount} records</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#7C6E6A]">Last Successful Sync:</span>
              <span className="font-bold text-[#3A2E2B]">
                {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={triggerSync}
            >
              Force Sync Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:bg-red-50 hover:border-red-200"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={handleClearCache}
            >
              Clear Local Cache
            </Button>
          </div>
        </Card>

        {/* Account Session & Sign Out Card */}
        <Card className="space-y-4 border-red-100 bg-white">
          <CardHeader>
            <div>
              <CardTitle className="text-red-600">Account Session</CardTitle>
              <CardDescription>Sign out of this device securely</CardDescription>
            </div>
          </CardHeader>

          <p className="text-xs text-[#7C6E6A] leading-relaxed">
            Logging out will end your active session on this device. Your offline records synced to the cloud will remain secure and ready when you log back in.
          </p>

          <div className="pt-2">
            <Button
              variant="danger"
              size="md"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={async () => {
                await logoutUser();
                router.push('/login');
              }}
            >
              Sign Out of Budget Cat
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
