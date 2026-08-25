'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { db } from '@/lib/db';
import { syncManager } from '@/lib/sync/syncManager';
import { Bill } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus
} from 'lucide-react';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const bills = useLiveQuery(() => db.bills.toArray(), []) || [];
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];

  const [selectedItem, setSelectedItem] = useState<Bill | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
    setSelectedItem(null);
  };

  const dayCells = [];
  // Empty lead cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    dayCells.push(<div key={`empty-${i}`} className="h-24 bg-[#FAF6F0]/40 rounded-2xl border border-[#EFE6DD]/40" />);
  }
  // Days 1..daysInMonth
  const todayDate = new Date();
  const isCurrentMonth = todayDate.getMonth() === month && todayDate.getFullYear() === year;

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isCurrentMonth && todayDate.getDate() === day;
    const dayEvents = eventsByDay[day] || { bills: [], txs: [] };

    dayCells.push(
      <div
        key={`day-${day}`}
        className={`h-28 sm:h-32 p-2 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
          isToday
            ? 'bg-[#EBF1EC] border-[#6E8B74] ring-2 ring-[#6E8B74]/30'
            : 'bg-white border-[#EFE6DD] hover:border-[#6E8B74]/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${isToday ? 'text-[#6E8B74]' : 'text-[#3A2E2B]'}`}>
            {day}
          </span>
          {isToday && <span className="text-[9px] font-black uppercase text-[#6E8B74]">Today</span>}
        </div>

        {/* Day Events Indicators */}
        <div className="space-y-1 overflow-y-auto max-h-20">
          {dayEvents.bills.map((b) => {
            const isPaid = b.status === 'paid';
            const isOverdue = !isPaid && new Date(b.due_date) < new Date();

            return (
              <button
                key={b.id}
                onClick={() => setSelectedItem(b)}
                className={`w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold truncate flex items-center justify-between gap-1 ${
                  isPaid
                    ? 'bg-[#EBF1EC] text-[#6E8B74]'
                    : isOverdue
                    ? 'bg-red-50 text-red-600'
                    : 'bg-[#FFF8EA] text-[#D99B26]'
                }`}
              >
                <span className="truncate">{b.name}</span>
                <span>${b.amount}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Calendar Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Payment & Bills Calendar 📅</h1>
            <p className="text-xs sm:text-sm text-[#7C6E6A]">Visual timeline of due dates, recurring bills, and planned expenses.</p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#EFE6DD] shadow-sm">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-xl text-[#7C6E6A] hover:bg-[#FAF6F0]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 py-1 text-sm font-bold text-[#3A2E2B]">{monthLabel}</span>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-xl text-[#7C6E6A] hover:bg-[#FAF6F0]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#7C6E6A]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#EBF1EC] border border-[#6E8B74]" /> Paid 🟢</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#FFF8EA] border border-[#D99B26]" /> Upcoming 🟡</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-50 border border-red-500" /> Overdue 🔴</span>
        </div>

        {/* Calendar Grid */}
        <Card className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase text-[#7C6E6A] pb-2 border-b border-[#EFE6DD]">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {dayCells}
          </div>
        </Card>

        {/* Item Detail Inspector Modal */}
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title="Bill Details"
          description="Inspect payment due date and status."
        >
          {selectedItem && (
            <div className="space-y-5">
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EFE6DD] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#7C6E6A]">Bill Title</span>
                  <span className="text-sm font-black text-[#3A2E2B]">{selectedItem.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#7C6E6A]">Amount Due</span>
                  <span className="text-lg font-black text-[#6E8B74]">${selectedItem.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#7C6E6A]">Due Date</span>
                  <span className="text-xs font-semibold text-[#3A2E2B]">{selectedItem.due_date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#7C6E6A]">Status</span>
                  <Badge variant={selectedItem.status === 'paid' ? 'sage' : 'danger'}>
                    {selectedItem.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setSelectedItem(null)}>
                  Close
                </Button>
                <Button
                  type="button"
                  variant={selectedItem.status === 'paid' ? 'outline' : 'sage'}
                  onClick={() => handleTogglePaid(selectedItem)}
                >
                  {selectedItem.status === 'paid' ? 'Mark Pending' : 'Mark as Paid 💳'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
