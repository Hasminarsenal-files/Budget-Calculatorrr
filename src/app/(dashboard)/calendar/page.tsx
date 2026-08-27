'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { db } from '@/lib/db';
import { syncManager } from '@/lib/sync/syncManager';
import { Bill } from '@/lib/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  Tag,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function CalendarPage() {
  const { profile, user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  
  const bills = useLiveQuery(() => db.bills.toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  
  // Add bill form state
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [billRecurring, setBillRecurring] = useState<'none' | 'monthly' | 'weekly' | 'yearly'>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayDate = new Date();
  const isCurrentMonth = todayDate.getMonth() === month && todayDate.getFullYear() === year;

  // Map bills & transactions to specific calendar days
  const eventsByDay = useMemo(() => {
    const map: Record<number, { bills: Bill[]; txs: any[] }> = {};

    bills.forEach(b => {
      const d = new Date(b.due_date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!map[day]) map[day] = { bills: [], txs: [] };
        map[day].bills.push(b);
      }
    });

    transactions.forEach(t => {
      const d = new Date(t.transaction_date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!map[day]) map[day] = { bills: [], txs: [] };
        map[day].txs.push(t);
      }
    });

    return map;
  }, [bills, transactions, month, year]);

  const handleTogglePaid = async (bill: Bill) => {
    const newStatus = bill.status === 'paid' ? 'pending' : 'paid';
    await db.bills.update(bill.id, { status: newStatus });
    await syncManager.queueChange('bills', 'UPDATE', bill.id, { ...bill, status: newStatus });
    setSelectedBill(null);
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billName.trim() || !billAmount) return;
    setIsSubmitting(true);

    try {
      const userId = profile?.id || user?.id || 'default-user';
      const newBill: Bill = {
        id: 'bill-' + Date.now(),
        user_id: userId,
        name: billName.trim(),
        amount: parseFloat(billAmount),
        due_date: billDueDate,
        recurring: billRecurring,
        status: 'pending',
        sync_status: 'pending',
        created_at: new Date().toISOString()
      };

      await db.bills.put(newBill);
      await syncManager.queueChange('bills', 'INSERT', newBill.id, newBill);

      setBillName('');
      setBillAmount('');
      setIsAddBillOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDayEvents = eventsByDay[selectedDay] || { bills: [], txs: [] };
  const selectedFormattedDate = new Date(year, month, selectedDay).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Calendar Header with Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Payment & Bills Calendar 📅</h1>
            <p className="text-xs sm:text-sm text-[#7C6E6A]">Tap any date to inspect due bills, planned expenses, and daily activity.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                setCurrentDate(now);
                setSelectedDay(now.getDate());
              }}
            >
              Today
            </Button>
            <Button
              variant="sage"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddBillOpen(true)}
            >
              + Add Bill
            </Button>
          </div>
        </div>

        {/* Month Navigation & Legend Bar */}
        <Card className="p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const prev = new Date(year, month - 1, 1);
                setCurrentDate(prev);
                setSelectedDay(1);
              }}
              className="p-2 rounded-xl text-[#7C6E6A] hover:bg-[#FAF6F0] hover:text-[#3A2E2B] transition-colors border border-[#EFE6DD]"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <span className="text-base sm:text-lg font-black text-[#3A2E2B]">{monthLabel}</span>
            </div>

            <button
              onClick={() => {
                const next = new Date(year, month + 1, 1);
                setCurrentDate(next);
                setSelectedDay(1);
              }}
              className="p-2 rounded-xl text-[#7C6E6A] hover:bg-[#FAF6F0] hover:text-[#3A2E2B] transition-colors border border-[#EFE6DD]"
              aria-label="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dots Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] font-bold text-[#7C6E6A] pt-2 border-t border-[#EFE6DD]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#6E8B74]" /> Paid Bill</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D99B26]" /> Upcoming Bill</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#E2856E]" /> Activity / Spent</span>
          </div>
        </Card>

        {/* Calendar Grid Container */}
        <Card className="p-3 sm:p-6 space-y-3">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-black uppercase text-[#7C6E6A] pb-2 border-b border-[#EFE6DD]">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty Leading Cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square sm:aspect-auto sm:h-24 md:h-28 bg-[#FAF6F0]/30 rounded-xl sm:rounded-2xl border border-transparent" />
            ))}

            {/* Month Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = isCurrentMonth && todayDate.getDate() === day;
              const isSelected = selectedDay === day;
              const dayEvents = eventsByDay[day] || { bills: [], txs: [] };
              const hasBills = dayEvents.bills.length > 0;
              const hasTxs = dayEvents.txs.length > 0;
              const hasPaid = dayEvents.bills.some(b => b.status === 'paid');
              const hasPending = dayEvents.bills.some(b => b.status !== 'paid');

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square sm:aspect-auto sm:h-24 md:h-28 p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between items-center sm:items-stretch text-left ${
                    isSelected
                      ? 'bg-[#6E8B74] border-[#6E8B74] text-white shadow-md shadow-[#6E8B74]/20 ring-2 ring-[#6E8B74]/40'
                      : isToday
                      ? 'bg-[#EBF1EC] border-[#6E8B74] text-[#6E8B74] font-black'
                      : 'bg-white border-[#EFE6DD] hover:bg-[#FAF6F0] text-[#3A2E2B]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-white' : isToday ? 'text-[#6E8B74]' : 'text-[#3A2E2B]'}`}>
                      {day}
                    </span>
                    {isToday && (
                      <span className={`hidden sm:inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-[#6E8B74] text-white'}`}>
                        Today
                      </span>
                    )}
                  </div>

                  {/* Mobile Dot Indicators */}
                  <div className="flex sm:hidden items-center justify-center gap-1 mt-auto pb-0.5">
                    {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-[#D99B26]" />}
                    {hasPaid && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#6E8B74]'}`} />}
                    {hasTxs && <span className="w-1.5 h-1.5 rounded-full bg-[#E2856E]" />}
                  </div>

                  {/* Desktop Rich Event Chips (>= sm) */}
                  <div className="hidden sm:flex flex-col gap-1 overflow-hidden mt-1 w-full">
                    {dayEvents.bills.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBill(b);
                        }}
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate flex items-center justify-between ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : b.status === 'paid'
                            ? 'bg-[#EBF1EC] text-[#6E8B74]'
                            : 'bg-[#FFF8EA] text-[#D99B26]'
                        }`}
                      >
                        <span className="truncate">{b.name}</span>
                        <span className="shrink-0 font-black">₱{b.amount}</span>
                      </div>
                    ))}
                    {dayEvents.bills.length > 2 && (
                      <span className="text-[9px] font-bold text-[#7C6E6A] pl-1">
                        +{dayEvents.bills.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected Day Agenda & Details Card */}
        <Card className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle className="text-base sm:text-lg">Agenda for {selectedFormattedDate} 📌</CardTitle>
              <CardDescription>Scheduled bills, payments, and transactions recorded on this day</CardDescription>
            </div>
            <Badge variant={selectedDayEvents.bills.length + selectedDayEvents.txs.length > 0 ? 'sage' : 'gray'}>
              {selectedDayEvents.bills.length + selectedDayEvents.txs.length} Events
            </Badge>
          </CardHeader>

          <div className="space-y-3">
            {selectedDayEvents.bills.length === 0 && selectedDayEvents.txs.length === 0 ? (
              <div className="bg-[#FAF6F0] p-6 rounded-2xl border border-[#EFE6DD] text-center space-y-2">
                <p className="text-xs font-bold text-[#7C6E6A]">No bills or transactions recorded for this day ✨</p>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const dueStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                    setBillDueDate(dueStr);
                    setIsAddBillOpen(true);
                  }}
                >
                  Schedule Bill for this day
                </Button>
              </div>
            ) : (
              <>
                {/* Bills on this day */}
                {selectedDayEvents.bills.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl border border-[#EFE6DD] bg-white flex items-center justify-between gap-3 hover:bg-[#FAF6F0]/50 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-2xl shrink-0 ${b.status === 'paid' ? 'bg-[#EBF1EC] text-[#6E8B74]' : 'bg-[#FFF8EA] text-[#D99B26]'}`}>
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-[#3A2E2B] truncate">{b.name}</p>
                        <p className="text-[11px] text-[#7C6E6A]">Recurring: {b.recurring} • Due {b.due_date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-black text-sm sm:text-base text-[#3A2E2B]">₱{b.amount.toFixed(2)}</p>
                        <Badge variant={b.status === 'paid' ? 'sage' : 'peach'} size="sm">
                          {b.status.toUpperCase()}
                        </Badge>
                      </div>
                      <Button
                        variant={b.status === 'paid' ? 'outline' : 'sage'}
                        size="sm"
                        onClick={() => handleTogglePaid(b)}
                      >
                        {b.status === 'paid' ? 'Undo' : 'Pay 💳'}
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Transactions on this day */}
                {selectedDayEvents.txs.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl border border-[#EFE6DD] bg-white flex items-center justify-between gap-3 hover:bg-[#FAF6F0]/50 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-2xl shrink-0 ${tx.type === 'expense' ? 'bg-[#FDF1EE] text-[#E2856E]' : 'bg-[#EBF1EC] text-[#6E8B74]'}`}>
                        <Tag className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-[#3A2E2B] truncate">{tx.description}</p>
                        <p className="text-[11px] text-[#7C6E6A]">{tx.payment_method} • {new Date(tx.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`font-black text-sm sm:text-base ${tx.type === 'expense' ? 'text-[#E2856E]' : 'text-[#6E8B74]'}`}>
                        {tx.type === 'expense' ? '-' : '+'}₱{tx.amount.toFixed(2)}
                      </p>
                      <Badge variant={tx.type === 'expense' ? 'peach' : 'sage'} size="sm">
                        {tx.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>

        {/* Add Bill Modal */}
        <Modal
          isOpen={isAddBillOpen}
          onClose={() => setIsAddBillOpen(false)}
          title="Add New Bill / Payment"
          description="Schedule a bill due date to track in your calendar."
        >
          <form onSubmit={handleAddBill} className="space-y-4">
            <Input
              label="Bill Name"
              placeholder="e.g. Electric Meralco, Internet, Rent"
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              required
            />
            <Input
              label="Amount (₱)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={billDueDate}
              onChange={(e) => setBillDueDate(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-bold text-[#3A2E2B] uppercase mb-1">Recurring Frequency</label>
              <select
                value={billRecurring}
                onChange={(e) => setBillRecurring(e.target.value as any)}
                className="w-full bg-[#FAF6F0] border border-[#EFE6DD] text-[#3A2E2B] text-xs font-bold rounded-2xl px-3 py-2.5"
              >
                <option value="none">One-time payment</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddBillOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="sage" isLoading={isSubmitting}>
                Save Bill 📅
              </Button>
            </div>
          </form>
        </Modal>

        {/* Bill Details Modal */}
        <Modal
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
          title="Bill Details"
          description="Inspect payment due date and status."
        >
          {selectedBill && (
            <div className="space-y-4">
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EFE6DD] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#7C6E6A]">Bill Title</span>
                  <span className="text-sm font-black text-[#3A2E2B]">{selectedBill.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#7C6E6A]">Amount Due</span>
                  <span className="text-base font-black text-[#6E8B74]">₱{selectedBill.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#7C6E6A]">Due Date</span>
                  <span className="text-xs font-semibold text-[#3A2E2B]">{selectedBill.due_date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#7C6E6A]">Status</span>
                  <Badge variant={selectedBill.status === 'paid' ? 'sage' : 'peach'}>
                    {selectedBill.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setSelectedBill(null)}>
                  Close
                </Button>
                <Button
                  type="button"
                  variant={selectedBill.status === 'paid' ? 'outline' : 'sage'}
                  onClick={() => handleTogglePaid(selectedBill)}
                >
                  {selectedBill.status === 'paid' ? 'Mark Pending' : 'Mark as Paid 💳'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
