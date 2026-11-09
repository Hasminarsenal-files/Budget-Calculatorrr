'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CatPiggyBank, PiggyState } from '@/components/ui/CatPiggyBank';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/db';
import { syncManager } from '@/lib/sync/syncManager';
import { Budget, BudgetCategory, Transaction, DEFAULT_MONTHLY_CATEGORIES } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  PiggyBank,
  Plus,
  Edit3,
  Copy,
  RotateCcw,
  Eye,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Layers,
  Tag
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';

interface EditableCategoryRow {
  id?: string;
  name: string;
  planned: string;
  isCustom?: boolean;
}

const CATEGORY_COLORS = [
  '#6E8B74',
  '#E2856E',
  '#D99B26',
  '#8C7CA6',
  '#5A96B6',
  '#7A9A95',
  '#C97A63',
  '#B5838D',
  '#6D6875',
  '#52796F',
  '#E07A5F',
  '#81B29A'
];

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getPreviousMonthDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function matchExpenseToCategory(tx: Transaction, categoryName: string, categoryId?: string): boolean {
  const normCat = categoryName.trim().toLowerCase();
  if (categoryId && tx.category_id === categoryId) return true;
  if (tx.category && tx.category.trim().toLowerCase() === normCat) return true;
  if (tx.notes && tx.notes.trim().toLowerCase() === normCat) return true;
  if (tx.notes && tx.notes.toLowerCase().includes(`• ${normCat}`)) return true;

  // If transaction has an explicit category from DEFAULT_MONTHLY_CATEGORIES that is different, don't fuzzy match
  if (tx.category && tx.category.trim().toLowerCase() !== normCat) {
    return false;
  }

  const text = `${tx.description || ''} ${tx.notes || ''}`.toLowerCase();
  if (normCat === 'food & groceries' && /(grocery|groceries|food|supermarket|dining|restaurant|lunch|dinner|breakfast|coffee|meal)/.test(text)) return true;
  if (normCat === 'transportation' && /(transport|transportation|gas|fuel|grab|taxi|bus|train|flight|commute|parking|fare)/.test(text)) return true;
  if (normCat === 'house & utilities' && /(bill paid:|electric|electricity|water|internet|wifi|utility|utilities|meralco|pldt|globe)/.test(text)) return true;
  if (normCat === 'rent' && /\b(rent|lease|apartment|condo|dorm)\b/.test(text)) return true;
  if (normCat === 'shopping' && /(shopping|clothes|shoes|mall|lazada|shopee|amazon|gadget)/.test(text)) return true;
  if (normCat === 'healthcare' && /(health|medical|doctor|hospital|pharmacy|medicine|clinic|dental|vitamins)/.test(text)) return true;
  if (normCat === 'education' && /(school|tuition|education|book|course|class|university|college)/.test(text)) return true;
  if (normCat === 'entertainment' && /(movie|netflix|spotify|game|concert|entertainment|hobby|subscription)/.test(text)) return true;
  if (normCat === 'personal care' && /(salon|haircut|spa|skincare|gym|fitness|personal care|grooming)/.test(text)) return true;
  if (normCat === 'savings' && /(savings|emergency fund|reserve)/.test(text)) return true;
  if (normCat === 'debt payments' && /(debt payment:|loan|credit card|mortgage|installment)/.test(text)) return true;

  return false;
}

export default function MonthlyOverviewPage() {
  const { user, profile } = useAuth();
  const userId = profile?.id || user?.id || 'default-user';

  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Live Dexie Queries
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];
  const budgetCategories = useLiveQuery(() => db.budget_categories.toArray(), []) || [];
  const bills = useLiveQuery(() => db.bills.toArray(), []) || [];
  const savings = useLiveQuery(() => db.savings_goals.toArray(), []) || [];

  // Modals & UI States
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planModalMode, setPlanModalMode] = useState<'create' | 'edit' | 'copy'>('create');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [editingCategoryItem, setEditingCategoryItem] = useState<BudgetCategory | null>(null);
  const [editCatPlannedVal, setEditCatPlannedVal] = useState('');
  const [isAddSingleCatOpen, setIsAddSingleCatOpen] = useState(false);
  const [singleCatName, setSingleCatName] = useState('');
  const [singleCatCustomName, setSingleCatCustomName] = useState('');
  const [singleCatAmount, setSingleCatAmount] = useState('');

  // Plan Builder Form State
  const [totalMonthlyInput, setTotalMonthlyInput] = useState('');
  const [categoryRows, setCategoryRows] = useState<EditableCategoryRow[]>([]);
  const [newCustomCatName, setNewCustomCatName] = useState('');
  const [newCustomCatAmount, setNewCustomCatAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Month Metadata
  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth();
  const selectedMonthKey = getMonthKey(currentDate);
  const prevMonthDate = getPreviousMonthDate(currentDate);
  const prevMonthKey = getMonthKey(prevMonthDate);

  const monthYearLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const prevMonthLabel = prevMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shortMonthLabel = currentDate.toLocaleDateString('en-US', { month: 'short' });

  // Determine if selected month is Past, Current, or Future/Upcoming
  const monthTimelineStatus = useMemo(() => {
    const now = new Date();
    const nowKey = getMonthKey(now);
    if (selectedMonthKey === nowKey) return 'current';
    if (selectedMonthKey > nowKey) return 'future';
    return 'past';
  }, [selectedMonthKey]);

  // Navigate Month Helper
  const navigateMonth = (direction: 'prev' | 'next' | 'today') => {
    setFeedbackBanner(null);
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else {
      const nextDate = new Date(selectedYear, selectedMonth + (direction === 'prev' ? -1 : 1), 1);
      setCurrentDate(nextDate);
    }
  };

  const handleMonthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM
    if (!val) return;
    const [y, m] = val.split('-').map(Number);
    if (y && m) {
      setFeedbackBanner(null);
      setCurrentDate(new Date(y, m - 1, 1));
    }
  };

  // Quick Jump Months (Current, Next Month, +2 Months)
  const quickMonths = useMemo(() => {
    const now = new Date();
    return [0, 1, 2].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      return {
        key: getMonthKey(d),
        date: d,
        label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        tag: offset === 0 ? 'Current' : offset === 1 ? 'Upcoming' : 'Future'
      };
    });
  }, []);

  // Find Monthly Budget Plan specifically for the selected month & year
  const activeMonthlyPlan = useMemo(() => {
    return budgets.find((b) => {
      if (b.budget_type !== 'monthly') return false;
      const bKey = b.month_key || (b.start_date ? b.start_date.slice(0, 7) : '');
      return bKey === selectedMonthKey;
    }) || null;
  }, [budgets, selectedMonthKey]);

  // Find Previous Month's Budget Plan (for Copy Previous Month's Budget)
  const previousMonthlyPlan = useMemo(() => {
    return budgets.find((b) => {
      if (b.budget_type !== 'monthly') return false;
      const bKey = b.month_key || (b.start_date ? b.start_date.slice(0, 7) : '');
      return bKey === prevMonthKey;
    }) || null;
  }, [budgets, prevMonthKey]);

  // Categories belonging to the active month's budget plan
  const activePlanCategories = useMemo(() => {
    if (!activeMonthlyPlan) return [];
    return budgetCategories.filter((c) => c.budget_id === activeMonthlyPlan.id);
  }, [budgetCategories, activeMonthlyPlan]);

  // Categories belonging to the previous month's budget plan
  const previousPlanCategories = useMemo(() => {
    if (!previousMonthlyPlan) return [];
    return budgetCategories.filter((c) => c.budget_id === previousMonthlyPlan.id);
  }, [budgetCategories, previousMonthlyPlan]);

  // Filter transactions strictly for the selected month & year
  // Note: Planned budget allocations are never stored as expense transactions,
  // and any legacy 'Budget Allocation' entries are excluded so only real expenses count.
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.transaction_date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const monthExpenseTransactions = useMemo(() => {
    return monthTransactions.filter(
      (t) => t.type === 'expense' && t.payment_method !== 'Budget Allocation'
    );
  }, [monthTransactions]);

  // Core Monthly Financial Totals
  const monthIncome = useMemo(
    () => monthTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );

  const monthExpenses = useMemo(
    () => monthExpenseTransactions.reduce((sum, t) => sum + t.amount, 0),
    [monthExpenseTransactions]
  );

  const monthSavingsTotal = useMemo(
    () => savings.reduce((sum, s) => sum + s.current_amount, 0),
    [savings]
  );

  const monthBillsTotal = useMemo(
    () => bills.filter((b) => {
      if (!b.due_date) return true;
      const d = new Date(b.due_date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }).reduce((sum, b) => sum + b.amount, 0),
    [bills, selectedMonth, selectedYear]
  );

  // Per-Category Planned vs. Actual Calculation
  const categoryBreakdownList = useMemo(() => {
    const matchedTxIds = new Set<string>();

    const rows = activePlanCategories.map((cat, idx) => {
      const matchingTxs = monthExpenseTransactions.filter((tx) => {
        if (matchedTxIds.has(tx.id)) return false;
        const isMatch = matchExpenseToCategory(tx, cat.name, cat.id);
        if (isMatch) matchedTxIds.add(tx.id);
        return isMatch;
      });

      const planned = cat.planned_amount || 0;
      const actual = matchingTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const remaining = planned - actual;
      const rawPct = planned > 0 ? (actual / planned) * 100 : actual > 0 ? 100 : 0;
      const pctUsed = Math.round(rawPct);

      // Status color rules:
      // Green: Within budget (< 80%)
      // Orange: Approaching budget limit (>= 80% and <= 100%)
      // Red: Over budget (> 100% or actual > planned)
      let status: 'within' | 'warning' | 'over' = 'within';
      if ((planned > 0 && actual > planned) || (planned === 0 && actual > 0)) {
        status = 'over';
      } else if (rawPct >= 80) {
        status = 'warning';
      }

      return {
        id: cat.id,
        categoryRecord: cat,
        name: cat.name,
        color: cat.color || CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        planned,
        actual,
        remaining,
        pctUsed,
        barWidthPct: Math.min(100, Math.max(0, rawPct)),
        status,
        matchingTxs
      };
    });

    // If there are unmatched expenses and an "Other Expenses" category exists in the plan, attribute them there
    const unmatchedTxs = monthExpenseTransactions.filter((tx) => !matchedTxIds.has(tx.id));
    if (unmatchedTxs.length > 0) {
      const otherRow = rows.find((r) => r.name.toLowerCase() === 'other expenses');
      if (otherRow) {
        const extraAmt = unmatchedTxs.reduce((s, t) => s + t.amount, 0);
        otherRow.actual += extraAmt;
        otherRow.remaining = otherRow.planned - otherRow.actual;
        const rawPct = otherRow.planned > 0 ? (otherRow.actual / otherRow.planned) * 100 : 100;
        otherRow.pctUsed = Math.round(rawPct);
        otherRow.barWidthPct = Math.min(100, Math.max(0, rawPct));
        otherRow.matchingTxs = [...otherRow.matchingTxs, ...unmatchedTxs];
        if ((otherRow.planned > 0 && otherRow.actual > otherRow.planned) || (otherRow.planned === 0 && otherRow.actual > 0)) {
          otherRow.status = 'over';
        } else if (rawPct >= 80) {
          otherRow.status = 'warning';
        }
      }
    }

    return rows;
  }, [activePlanCategories, monthExpenseTransactions]);

  // Monthly Budget Summary Metrics
  const totalMonthlyBudget = activeMonthlyPlan?.total_budget || 0;
  const totalAllocatedBudget = useMemo(
    () => activePlanCategories.reduce((sum, c) => sum + (c.planned_amount || 0), 0),
    [activePlanCategories]
  );
  const totalActualExpenses = monthExpenses;
  const remainingMonthlyBudget = totalMonthlyBudget - totalActualExpenses;
  const unallocatedBudget = totalMonthlyBudget - totalAllocatedBudget;
  const overallBudgetUsedPct = totalMonthlyBudget > 0
    ? Math.round((totalActualExpenses / totalMonthlyBudget) * 100)
    : 0;

  // Smart Budget Cat Assistant Calculation
  const catAssistantData = useMemo((): { message: string; state: PiggyState; extraAlerts: string[] } => {
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
    const overCategories = categoryBreakdownList.filter((c) => c.status === 'over' && c.planned > 0);
    const warningCategories = categoryBreakdownList.filter((c) => c.status === 'warning');
    const alerts: string[] = [];

    overCategories.forEach((c) => {
      alerts.push(`Careful! You've exceeded your ${c.name} Budget (₱${c.actual.toLocaleString()} / ₱${c.planned.toLocaleString()}).`);
    });
    warningCategories.forEach((c) => {
      alerts.push(`Meow! You've already used ${c.pctUsed}% of your ${c.name} Budget!`);
    });

    if (!activeMonthlyPlan) {
      if (monthTimelineStatus === 'future') {
        return {
          state: 'happy',
          message: `Planning ahead for ${monthYearLabel}? Click "Create Budget Plan" to set your ${monthName} budget in advance! 🐾`,
          extraAlerts: []
        };
      }
      return {
        state: 'happy',
        message: `Meow! You haven't set a ${monthYearLabel} budget plan yet. Create your monthly plan to track category spending! 🐾`,
        extraAlerts: []
      };
    }

    // 1. Over budget on any specific category
    if (overCategories.length > 0) {
      const worst = [...overCategories].sort((a, b) => (b.actual - b.planned) - (a.actual - a.planned))[0];
      return {
        state: 'sad',
        message: `Careful! You've exceeded your ${worst.name} Budget by ₱${(worst.actual - worst.planned).toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
        extraAlerts: alerts.filter((a) => !a.includes(worst.name))
      };
    }

    // 2. Over total monthly budget
    if (totalMonthlyBudget > 0 && totalActualExpenses > totalMonthlyBudget) {
      return {
        state: 'sad',
        message: `Careful! You've exceeded your ${monthName} monthly budget by ₱${(totalActualExpenses - totalMonthlyBudget).toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
        extraAlerts: alerts
      };
    }

    // 3. Approaching limit (>= 80%) on a specific category
    if (warningCategories.length > 0) {
      const topWarn = [...warningCategories].sort((a, b) => b.pctUsed - a.pctUsed)[0];
      return {
        state: 'worried',
        message: `Meow! You've already used ${topWarn.pctUsed}% of your ${topWarn.name} Budget!`,
        extraAlerts: alerts.filter((a) => !a.includes(topWarn.name))
      };
    }

    // 4. Approaching limit (>= 80%) on overall monthly budget
    if (totalMonthlyBudget > 0 && overallBudgetUsedPct >= 80) {
      return {
        state: 'worried',
        message: `Meow! You've already used ${overallBudgetUsedPct}% of your ${monthName} monthly budget!`,
        extraAlerts: alerts
      };
    }

    // 5. Advance future month plan ready
    if (monthTimelineStatus === 'future' && totalActualExpenses === 0) {
      return {
        state: 'excited',
        message: `Your ${monthName} budget plan is ready. You're all set! 🐾`,
        extraAlerts: []
      };
    }

    // 6. Within budget
    return {
      state: 'happy',
      message: `Great job! You're staying within your monthly budget! 🐾`,
      extraAlerts: []
    };
  }, [
    currentDate,
    monthYearLabel,
    monthTimelineStatus,
    activeMonthlyPlan,
    categoryBreakdownList,
    totalMonthlyBudget,
    totalActualExpenses,
    overallBudgetUsedPct
  ]);

  // Top Spending Categories Chart Data (from actual expenses)
  const spendingPieData = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenseTransactions.forEach((t) => {
      const cat = t.category || t.notes || t.description || 'General Expense';
      map[cat] = (map[cat] || 0) + t.amount;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], idx) => ({
        name,
        value,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      }));
  }, [monthExpenseTransactions]);

  // ─── Actions: Open Create / Edit / Copy Modal ───
  const openCreatePlanModal = () => {
    setFormError('');
    setPlanModalMode('create');
    setTotalMonthlyInput(activeMonthlyPlan ? String(activeMonthlyPlan.total_budget) : '');

    if (activePlanCategories.length > 0) {
      const existingMap = new Map(activePlanCategories.map((c) => [c.name.toLowerCase(), c]));
      const rows: EditableCategoryRow[] = DEFAULT_MONTHLY_CATEGORIES.map((name) => {
        const match = existingMap.get(name.toLowerCase());
        if (match) existingMap.delete(name.toLowerCase());
        return {
          id: match?.id,
          name,
          planned: match ? String(match.planned_amount) : '0',
          isCustom: false
        };
      });
      existingMap.forEach((customCat) => {
        rows.push({
          id: customCat.id,
          name: customCat.name,
          planned: String(customCat.planned_amount),
          isCustom: true
        });
      });
      setCategoryRows(rows);
    } else {
      setCategoryRows(
        DEFAULT_MONTHLY_CATEGORIES.map((name) => ({
          name,
          planned: '0',
          isCustom: false
        }))
      );
    }
    setIsPlanModalOpen(true);
  };

  const openEditPlanModal = () => {
    if (!activeMonthlyPlan) {
      openCreatePlanModal();
      return;
    }
    setFormError('');
    setPlanModalMode('edit');
    setTotalMonthlyInput(String(activeMonthlyPlan.total_budget));

    const existingMap = new Map(activePlanCategories.map((c) => [c.name.toLowerCase(), c]));
    const rows: EditableCategoryRow[] = [];

    // Include all existing categories first, plus any default categories not yet added
    activePlanCategories.forEach((c) => {
      const isDefault = DEFAULT_MONTHLY_CATEGORIES.some((d) => d.toLowerCase() === c.name.toLowerCase());
      rows.push({
        id: c.id,
        name: c.name,
        planned: String(c.planned_amount),
        isCustom: !isDefault
      });
    });

    DEFAULT_MONTHLY_CATEGORIES.forEach((name) => {
      if (!existingMap.has(name.toLowerCase())) {
        rows.push({
          name,
          planned: '0',
          isCustom: false
        });
      }
    });

    setCategoryRows(rows);
    setIsPlanModalOpen(true);
  };

  const handleCopyPreviousMonthBudget = () => {
    setFormError('');
    if (!previousMonthlyPlan && previousPlanCategories.length === 0) {
      setFeedbackBanner(`No saved budget plan found for ${prevMonthLabel}. You can create a new plan for ${monthYearLabel} below.`);
      openCreatePlanModal();
      return;
    }

    setPlanModalMode('copy');
    setTotalMonthlyInput(String(previousMonthlyPlan?.total_budget || 0));

    const prevMap = new Map(previousPlanCategories.map((c) => [c.name.toLowerCase(), c]));
    const rows: EditableCategoryRow[] = [];

    previousPlanCategories.forEach((c) => {
      const isDefault = DEFAULT_MONTHLY_CATEGORIES.some((d) => d.toLowerCase() === c.name.toLowerCase());
      rows.push({
        name: c.name,
        planned: String(c.planned_amount),
        isCustom: !isDefault
      });
    });

    DEFAULT_MONTHLY_CATEGORIES.forEach((name) => {
      if (!prevMap.has(name.toLowerCase())) {
        rows.push({
          name,
          planned: '0',
          isCustom: false
        });
      }
    });

    setCategoryRows(rows);
    setIsPlanModalOpen(true);
  };

  const handleAddCustomCategoryRow = () => {
    const cleanName = newCustomCatName.trim();
    if (!cleanName) return;
    if (categoryRows.some((r) => r.name.toLowerCase() === cleanName.toLowerCase())) {
      setFormError(`Category "${cleanName}" is already in this budget plan.`);
      return;
    }
    setFormError('');
    setCategoryRows([
      ...categoryRows,
      {
        name: cleanName,
        planned: newCustomCatAmount || '0',
        isCustom: true
      }
    ]);
    setNewCustomCatName('');
    setNewCustomCatAmount('');
  };

  const handleRemoveCategoryRow = (index: number) => {
    setCategoryRows(categoryRows.filter((_, i) => i !== index));
  };

  const modalTotalPlanned = useMemo(
    () => categoryRows.reduce((sum, r) => sum + (parseFloat(r.planned) || 0), 0),
    [categoryRows]
  );
  const modalTotalBudgetNum = parseFloat(totalMonthlyInput) || 0;
  const modalUnallocated = modalTotalBudgetNum - modalTotalPlanned;

  // Save Monthly Budget Plan (prevents duplicate plans for the same user & month)
  const handleSaveMonthlyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const finalTotalBudget = modalTotalBudgetNum > 0 ? modalTotalBudgetNum : modalTotalPlanned;
    if (finalTotalBudget <= 0 && modalTotalPlanned <= 0) {
      setFormError('Please enter a Total Monthly Budget or allocate amounts to at least one category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const deterministicPlanId = activeMonthlyPlan?.id || `monthly-plan-${selectedMonthKey}`;
      const startDateStr = `${selectedMonthKey}-01`;
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const endDateStr = `${selectedMonthKey}-${String(lastDay).padStart(2, '0')}`;

      // Remove any duplicate monthly budgets for this same month_key
      const duplicatePlans = budgets.filter((b) => {
        if (b.budget_type !== 'monthly') return false;
        const bKey = b.month_key || (b.start_date ? b.start_date.slice(0, 7) : '');
        return bKey === selectedMonthKey && b.id !== deterministicPlanId;
      });
      for (const dup of duplicatePlans) {
        await db.budgets.delete(dup.id);
        await syncManager.queueChange('budgets', 'DELETE', dup.id, null);
      }

      // Save the canonical Monthly Budget Plan record
      const planRecord: Budget = {
        id: deterministicPlanId,
        user_id: userId,
        name: `${monthYearLabel} Monthly Budget`,
        description: `Monthly Budget Plan for ${monthYearLabel}`,
        budget_type: 'monthly',
        month_key: selectedMonthKey,
        total_budget: finalTotalBudget,
        spent_amount: totalActualExpenses,
        start_date: startDateStr,
        end_date: endDateStr,
        status: 'active',
        sync_status: 'pending',
        created_at: activeMonthlyPlan?.created_at || now,
        updated_at: now
      };

      await db.budgets.put(planRecord);
      await syncManager.queueChange('budgets', activeMonthlyPlan ? 'UPDATE' : 'INSERT', deterministicPlanId, planRecord);

      // Replace old category records for this monthly plan
      const existingCats = await db.budget_categories.where('budget_id').equals(deterministicPlanId).toArray();
      for (const oldCat of existingCats) {
        await db.budget_categories.delete(oldCat.id);
      }

      // Save all categories with planned amount > 0 (or custom categories added by user)
      const categoriesToSave = categoryRows.filter((r) => (parseFloat(r.planned) || 0) > 0 || r.isCustom);
      for (let i = 0; i < categoriesToSave.length; i++) {
        const row = categoriesToSave[i];
        const catId = row.id || `mcat-${selectedMonthKey}-${i}-${Date.now().toString(36)}`;
        const catRecord: BudgetCategory = {
          id: catId,
          budget_id: deterministicPlanId,
          name: row.name.trim(),
          icon: 'Tag',
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
          planned_amount: Math.max(0, parseFloat(row.planned) || 0),
          sync_status: 'pending',
          created_at: now,
          updated_at: now
        };
        await db.budget_categories.put(catRecord);
        await syncManager.queueChange('budget_categories', 'INSERT', catId, catRecord);
      }

      await syncManager.sync();
      setIsPlanModalOpen(false);
      setFeedbackBanner(`${monthYearLabel} Monthly Budget Plan saved! 🐾`);
    } catch (err) {
      console.error('Error saving monthly budget plan:', err);
      setFormError('Failed to save monthly budget plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline Edit Single Category Allocation
  const handleUpdateSingleCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryItem || !activeMonthlyPlan) return;
    setIsSubmitting(true);

    try {
      const newPlanned = Math.max(0, parseFloat(editCatPlannedVal) || 0);
      const updatedCat: BudgetCategory = {
        ...editingCategoryItem,
        planned_amount: newPlanned,
        updated_at: new Date().toISOString(),
        sync_status: 'pending'
      };
      await db.budget_categories.put(updatedCat);
      await syncManager.queueChange('budget_categories', 'UPDATE', updatedCat.id, updatedCat);
      await syncManager.sync();
      setEditingCategoryItem(null);
      setFeedbackBanner(`Updated ${updatedCat.name} budget allocation to ₱${newPlanned.toLocaleString()}.`);
    } catch (err) {
      console.error('Error updating category allocation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline Delete Single Category Allocation
  const handleDeleteSingleCategory = async (cat: BudgetCategory) => {
    try {
      await db.budget_categories.delete(cat.id);
      await syncManager.queueChange('budget_categories', 'DELETE', cat.id, null);
      await syncManager.sync();
      setFeedbackBanner(`Removed "${cat.name}" from ${monthYearLabel} budget allocations.`);
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  // Add Single Category Allocation directly to active month's plan
  const handleAddSingleCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMonthlyPlan) return;
    const chosenName = (singleCatName === '__custom__' ? singleCatCustomName : singleCatName).trim();
    const plannedAmt = Math.max(0, parseFloat(singleCatAmount) || 0);
    if (!chosenName || plannedAmt <= 0) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const existing = activePlanCategories.find((c) => c.name.toLowerCase() === chosenName.toLowerCase());
      if (existing) {
        const updated: BudgetCategory = {
          ...existing,
          planned_amount: plannedAmt,
          updated_at: now,
          sync_status: 'pending'
        };
        await db.budget_categories.put(updated);
        await syncManager.queueChange('budget_categories', 'UPDATE', existing.id, updated);
      } else {
        const newCatId = `mcat-${selectedMonthKey}-${Date.now()}`;
        const newCat: BudgetCategory = {
          id: newCatId,
          budget_id: activeMonthlyPlan.id,
          name: chosenName,
          icon: 'Tag',
          color: CATEGORY_COLORS[activePlanCategories.length % CATEGORY_COLORS.length],
          planned_amount: plannedAmt,
          sync_status: 'pending',
          created_at: now
        };
        await db.budget_categories.put(newCat);
        await syncManager.queueChange('budget_categories', 'INSERT', newCatId, newCat);
      }
      await syncManager.sync();
      setSingleCatName('');
      setSingleCatCustomName('');
      setSingleCatAmount('');
      setIsAddSingleCatOpen(false);
      setFeedbackBanner(`Saved "${chosenName}" allocation (₱${plannedAmt.toLocaleString()}) for ${monthYearLabel}.`);
    } catch (err) {
      console.error('Error adding single category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Selected Month's Budget Plan
  const handleConfirmResetPlan = async () => {
    if (!activeMonthlyPlan) {
      setIsResetModalOpen(false);
      return;
    }
    setIsSubmitting(true);
    try {
      const cats = await db.budget_categories.where('budget_id').equals(activeMonthlyPlan.id).toArray();
      for (const c of cats) {
        await db.budget_categories.delete(c.id);
        await syncManager.queueChange('budget_categories', 'DELETE', c.id, null);
      }
      await db.budgets.delete(activeMonthlyPlan.id);
      await syncManager.queueChange('budgets', 'DELETE', activeMonthlyPlan.id, null);
      await syncManager.sync();
      setIsResetModalOpen(false);
      setFeedbackBanner(`${monthYearLabel} budget plan has been reset.`);
    } catch (err) {
      console.error('Error resetting budget plan:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* ─── Top Header & Advance Month Selector ─── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#3A2E2B]">Monthly Overview 🗓️</h1>
              <Badge
                variant={
                  monthTimelineStatus === 'current'
                    ? 'sage'
                    : monthTimelineStatus === 'future'
                    ? 'honey'
                    : 'gray'
                }
              >
                {monthTimelineStatus === 'current'
                  ? 'Current Month'
                  : monthTimelineStatus === 'future'
                  ? 'Upcoming / Future Month'
                  : 'Past Month'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#7C6E6A]">
              Plan monthly budgets in advance and compare planned category allocations against real expenses for{' '}
              <strong className="text-[#3A2E2B]">{monthYearLabel}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            {/* Quick Upcoming Month Pills */}
            <div className="hidden xl:flex items-center gap-1.5 bg-[#FAF6F0] p-1 rounded-2xl border border-[#EFE6DD]">
              {quickMonths.map((qm) => {
                const isSelected = qm.key === selectedMonthKey;
                return (
                  <button
                    key={qm.key}
                    type="button"
                    onClick={() => {
                      setFeedbackBanner(null);
                      setCurrentDate(qm.date);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#6E8B74] text-white shadow-sm'
                        : 'text-[#7C6E6A] hover:text-[#3A2E2B] hover:bg-white'
                    }`}
                  >
                    {qm.label}
                  </button>
                );
              })}
            </div>

            {/* Prev / Month Picker / Next Controls */}
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#EFE6DD] shadow-sm">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-xl text-[#7C6E6A] hover:bg-[#FAF6F0] hover:text-[#3A2E2B]"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="relative flex items-center">
                <input
                  type="month"
                  value={selectedMonthKey}
                  onChange={handleMonthInputChange}
                  aria-label="Select Month and Year"
                  className="bg-[#FAF6F0] border border-[#EFE6DD] text-[#3A2E2B] text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6E8B74] cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => navigateMonth('today')}
                className="px-2.5 py-1.5 text-xs font-bold text-[#6E8B74] hover:bg-[#EBF1EC] rounded-xl transition-colors"
                title="Jump to Current Month"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-xl text-[#7C6E6A] hover:bg-[#FAF6F0] hover:text-[#3A2E2B]"
                aria-label="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackBanner && (
          <div className="bg-[#EBF1EC] text-[#6E8B74] border border-[#D1E2D4] px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-xs underline hover:text-[#3A2E2B]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ─── Smart Budget Cat Assistant Banner ─── */}
        <Card className="p-5 sm:p-6 bg-gradient-to-r from-white via-[#FAF6F0] to-[#EBF1EC] flex flex-col lg:flex-row items-center justify-between gap-6 border border-[#EFE6DD]">
          <CatPiggyBank
            spentAmount={totalActualExpenses}
            totalBudget={totalMonthlyBudget}
            savingsGoalProgress={
              totalMonthlyBudget > 0 ? Math.min(99, Math.max(0, 100 - overallBudgetUsedPct)) : 0
            }
            currencySymbol="₱"
            size={130}
            customMessage={catAssistantData.message}
            customState={catAssistantData.state}
            extraAlerts={catAssistantData.extraAlerts}
          />

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
            <div className="bg-white/90 p-3.5 rounded-2xl border border-[#EFE6DD] min-w-[145px] text-center lg:text-right">
              <span className="text-[11px] font-bold uppercase text-[#7C6E6A] block">Monthly Income</span>
              <p className="text-lg font-black text-[#6E8B74]">
                ₱{monthIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/90 p-3.5 rounded-2xl border border-[#EFE6DD] min-w-[145px] text-center lg:text-right">
              <span className="text-[11px] font-bold uppercase text-[#7C6E6A] block">Net Cashflow</span>
              <p className={`text-lg font-black ${monthIncome - totalActualExpenses >= 0 ? 'text-[#3A2E2B]' : 'text-red-600'}`}>
                ₱{(monthIncome - totalActualExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/90 p-3.5 rounded-2xl border border-[#EFE6DD] min-w-[145px] text-center lg:text-right">
              <span className="text-[11px] font-bold uppercase text-[#7C6E6A] block">Scheduled Bills</span>
              <p className="text-lg font-black text-[#8C7CA6]">
                ₱{monthBillsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>

        {/* ─── 4. Monthly Budget Summary Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Monthly Budget"
            amount={`₱${totalMonthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<Wallet className="w-5 h-5 text-[#6E8B74]" />}
            badgeText={monthYearLabel}
            subtitle={activeMonthlyPlan ? 'Planned monthly cap' : 'No plan set yet'}
          />
          <StatCard
            title="Total Allocated Budget"
            amount={`₱${totalAllocatedBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<Layers className="w-5 h-5 text-[#D99B26]" />}
            badgeText={`${activePlanCategories.length} Categories`}
            subtitle={
              totalMonthlyBudget > 0
                ? `₱${Math.max(0, unallocatedBudget).toLocaleString('en-US', { minimumFractionDigits: 2 })} unallocated`
                : 'Category sum'
            }
          />
          <StatCard
            title="Total Actual Expenses"
            amount={`₱${totalActualExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<TrendingDown className="w-5 h-5 text-[#E2856E]" />}
            change={totalMonthlyBudget > 0 ? `${overallBudgetUsedPct}% of budget` : undefined}
            changeType={overallBudgetUsedPct > 100 ? 'negative' : 'neutral'}
            badgeText={`${shortMonthLabel} Spent`}
          />
          <StatCard
            title="Remaining Budget"
            amount={`₱${remainingMonthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={<PiggyBank className="w-5 h-5 text-[#6E8B74]" />}
            change={
              activeMonthlyPlan
                ? remainingMonthlyBudget >= 0
                  ? 'Within Budget'
                  : 'Over Budget'
                : 'Set Plan'
            }
            changeType={remainingMonthlyBudget >= 0 ? 'positive' : 'negative'}
            badgeText="Available"
          />
        </div>

        {/* ─── 1, 2, 3, 5. Monthly Budget Plan Section ─── */}
        <Card className="space-y-6 p-5 sm:p-7 border border-[#EFE6DD]">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[#EFE6DD]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg sm:text-xl">
                  Monthly Budget Plan — {monthYearLabel} 📋
                </CardTitle>
                {activeMonthlyPlan ? (
                  <Badge variant="sage" dot>
                    Plan Saved
                  </Badge>
                ) : (
                  <Badge variant="peach">No Plan Yet</Badge>
                )}
              </div>
              <CardDescription>
                {monthTimelineStatus === 'future'
                  ? `Advance budget planning for ${monthYearLabel}. Changes here apply only to ${monthYearLabel}.`
                  : `Manage category budget allocations and track real-time spending for ${monthYearLabel}.`}
              </CardDescription>
            </div>

            {/* 5. Budget Planning Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="sage"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={openCreatePlanModal}
              >
                Create Budget Plan
              </Button>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit3 className="w-4 h-4" />}
                onClick={openEditPlanModal}
                disabled={!activeMonthlyPlan}
              >
                Edit Budget
              </Button>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Copy className="w-4 h-4" />}
                onClick={handleCopyPreviousMonthBudget}
                title={`Copy allocations from ${prevMonthLabel}`}
              >
                Copy Previous Month&apos;s Budget
              </Button>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Eye className="w-4 h-4" />}
                onClick={() => setIsDetailsModalOpen(true)}
                disabled={!activeMonthlyPlan && categoryBreakdownList.length === 0}
              >
                View Budget Details
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={() => setIsResetModalOpen(true)}
                disabled={!activeMonthlyPlan}
              >
                Reset Budget Plan
              </Button>
            </div>
          </div>

          {/* Overall Monthly Budget Progress Bar (when plan exists) */}
          {activeMonthlyPlan && (
            <div className="bg-[#FAF6F0] p-4 sm:p-5 rounded-2xl border border-[#EFE6DD] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7C6E6A]">
                    Overall {monthYearLabel} Budget Consumption
                  </span>
                  <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                    <span className="text-lg font-black text-[#3A2E2B]">
                      ₱{totalActualExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })} spent
                    </span>
                    <span className="text-xs font-semibold text-[#7C6E6A]">
                      of ₱{totalMonthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })} planned ({overallBudgetUsedPct}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setSingleCatName(DEFAULT_MONTHLY_CATEGORIES[0]);
                      setSingleCatCustomName('');
                      setSingleCatAmount('');
                      setIsAddSingleCatOpen(true);
                    }}
                  >
                    + Add Category Allocation
                  </Button>
                </div>
              </div>

              <div className="w-full bg-white h-3.5 rounded-full overflow-hidden border border-[#EFE6DD]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalActualExpenses > totalMonthlyBudget
                      ? 'bg-red-500'
                      : overallBudgetUsedPct >= 80
                      ? 'bg-amber-500'
                      : 'bg-[#6E8B74]'
                  }`}
                  style={{
                    width: `${Math.min(100, totalMonthlyBudget > 0 ? (totalActualExpenses / totalMonthlyBudget) * 100 : 0)}%`
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-[#7C6E6A] pt-1 gap-2">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6E8B74]" /> Green: Within budget (&lt;80%)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Orange: Approaching limit (80%–100%)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Red: Over budget (&gt;100%)
                  </span>
                </div>
                <span className="font-bold text-[#3A2E2B]">
                  {remainingMonthlyBudget >= 0
                    ? `₱${remainingMonthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })} Remaining`
                    : `Over by ₱${Math.abs(remainingMonthlyBudget).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>
          )}

          {/* Category Cards Grid or Empty Prompt */}
          {!activeMonthlyPlan ? (
            <div className="bg-[#FAF6F0] rounded-3xl p-8 text-center border border-[#EFE6DD] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF1EC] text-[#6E8B74] flex items-center justify-center mx-auto">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-black text-[#3A2E2B]">
                  No Budget Plan Set for {monthYearLabel} Yet
                </h3>
                <p className="text-xs text-[#7C6E6A] leading-relaxed">
                  {monthTimelineStatus === 'future'
                    ? `Prepare your ${monthYearLabel} budget plan ahead of time! Allocate amounts across Food & Groceries, Transportation, Rent, Utilities, Savings, or custom categories.`
                    : `Create a monthly budget plan for ${monthYearLabel} or copy your allocations from ${prevMonthLabel} to automatically compare planned vs. actual spending.`}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button variant="sage" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreatePlanModal}>
                  Create {monthYearLabel} Budget Plan
                </Button>
                {previousMonthlyPlan && (
                  <Button variant="outline" leftIcon={<Copy className="w-4 h-4" />} onClick={handleCopyPreviousMonthBudget}>
                    Copy from {prevMonthLabel}
                  </Button>
                )}
              </div>
            </div>
          ) : categoryBreakdownList.length === 0 ? (
            <div className="bg-[#FAF6F0] rounded-2xl p-6 text-center border border-[#EFE6DD] space-y-3">
              <p className="text-xs font-bold text-[#7C6E6A]">
                Your total monthly budget is set to ₱{totalMonthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}, but no individual categories have been allocated yet.
              </p>
              <Button variant="sage" size="sm" onClick={openEditPlanModal}>
                Allocate Categories Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryBreakdownList.map((item) => {
                const barColorClass =
                  item.status === 'over'
                    ? 'bg-red-500'
                    : item.status === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-[#6E8B74]';

                const statusTextClass =
                  item.status === 'over'
                    ? 'text-red-600'
                    : item.status === 'warning'
                    ? 'text-amber-600'
                    : 'text-[#6E8B74]';

                return (
                  <div
                    key={item.id}
                    className="bg-[#FAF6F0] p-4 sm:p-5 rounded-2xl border border-[#EFE6DD] hover:border-[#6E8B74]/50 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs"
                            style={{ backgroundColor: item.color }}
                          >
                            <Tag className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-[#3A2E2B] truncate">{item.name}</h4>
                            <span className={`text-[11px] font-bold ${statusTextClass}`}>
                              {item.status === 'over'
                                ? 'Over Budget'
                                : item.status === 'warning'
                                ? 'Approaching Limit'
                                : 'Within Budget'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            title="Edit category allocation"
                            onClick={() => {
                              setEditingCategoryItem(item.categoryRecord);
                              setEditCatPlannedVal(String(item.planned));
                            }}
                            className="p-1.5 rounded-xl text-[#7C6E6A] hover:text-[#3A2E2B] hover:bg-white transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete category allocation"
                            onClick={() => handleDeleteSingleCategory(item.categoryRecord)}
                            className="p-1.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 4 Required Metrics per Category */}
                      <div className="bg-white p-3 rounded-xl border border-[#EFE6DD] space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#7C6E6A]">Planned Budget:</span>
                          <span className="font-bold text-[#3A2E2B]">
                            ₱{item.planned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7C6E6A]">Actual Expenses:</span>
                          <span className={`font-bold ${statusTextClass}`}>
                            ₱{item.actual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7C6E6A]">Remaining Budget:</span>
                          <span className={`font-bold ${item.remaining < 0 ? 'text-red-600' : 'text-[#3A2E2B]'}`}>
                            {item.remaining >= 0
                              ? `₱${item.remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                              : `-₱${Math.abs(item.remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-[#EFE6DD]">
                          <span className="text-[#7C6E6A]">Budget Used:</span>
                          <span className={`font-black ${statusTextClass}`}>{item.pctUsed}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-[#EFE6DD]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                          style={{ width: `${item.barWidthPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ─── Existing Monthly Overview Visual Charts (Planned vs Actual Bar Chart & Spending Share Pie) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Planned vs Actual Bar Chart */}
          <Card className="lg:col-span-2 space-y-4">
            <CardHeader>
              <div>
                <CardTitle>Planned Budget vs. Actual Expenses Chart</CardTitle>
                <CardDescription>
                  Visual category comparison for {monthYearLabel}
                </CardDescription>
              </div>
              <Badge variant="sage">Real-time Sync</Badge>
            </CardHeader>

            {categoryBreakdownList.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#7C6E6A] bg-[#FAF6F0] rounded-2xl border border-[#EFE6DD]">
                Create a Monthly Budget Plan above to see your Planned vs. Actual chart for {monthYearLabel}.
              </div>
            ) : (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryBreakdownList.map((c) => ({
                      name: c.name.length > 14 ? c.name.slice(0, 12) + '…' : c.name,
                      Planned: c.planned,
                      Actual: c.actual
                    }))}
                    margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                  >
                    <XAxis dataKey="name" stroke="#7C6E6A" fontSize={11} tickLine={false} />
                    <YAxis stroke="#7C6E6A" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFF',
                        borderRadius: '16px',
                        border: '1px solid #EFE6DD',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="Planned" fill="#6E8B74" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Actual" fill="#E2856E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Top Spending Categories Chart */}
          <Card className="space-y-4 flex flex-col justify-between">
            <CardHeader>
              <div>
                <CardTitle>Top Spending Categories</CardTitle>
                <CardDescription>Actual expense share in {monthYearLabel}</CardDescription>
              </div>
            </CardHeader>

            {spendingPieData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-[#7C6E6A] bg-[#FAF6F0] rounded-2xl border border-[#EFE6DD] p-4 text-center">
                No actual expenses recorded in {monthYearLabel} yet.
              </div>
            ) : (
              <>
                <div className="h-52 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendingPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {spendingPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#EFE6DD]">
                  {spendingPieData.slice(0, 5).map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-xs font-semibold text-[#3A2E2B]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate max-w-[140px]">{item.name}</span>
                      </div>
                      <span>₱{item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ─── Modal 1: Create / Edit / Copy Monthly Budget Plan ─── */}
        <Modal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          title={
            planModalMode === 'copy'
              ? `Copy ${prevMonthLabel} Budget to ${monthYearLabel} 📋`
              : planModalMode === 'edit'
              ? `Edit ${monthYearLabel} Budget Plan ✏️`
              : `Create ${monthYearLabel} Budget Plan 🐾`
          }
          description={
            planModalMode === 'copy'
              ? `Copied category allocations from ${prevMonthLabel}. Modify any amount below before saving for ${monthYearLabel}.`
              : `Set your total monthly budget and allocate amounts across categories for ${monthYearLabel}.`
          }
          maxWidth="xl"
        >
          <form onSubmit={handleSaveMonthlyPlan} className="space-y-4">
            {formError && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Total Monthly Budget Input + Live Allocation Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF6F0] p-4 rounded-2xl border border-[#EFE6DD]">
              <div className="sm:col-span-1">
                <Input
                  label={`Total Monthly Budget (₱)`}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 25000.00"
                  value={totalMonthlyInput}
                  onChange={(e) => setTotalMonthlyInput(e.target.value)}
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#EFE6DD] flex flex-col justify-center">
                <span className="text-[11px] font-bold text-[#7C6E6A] uppercase">Total Allocated</span>
                <span className="text-base font-black text-[#3A2E2B]">
                  ₱{modalTotalPlanned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  onClick={() => setTotalMonthlyInput(String(modalTotalPlanned))}
                  className="text-[10px] font-bold text-[#6E8B74] hover:underline text-left mt-0.5"
                >
                  Match Total Budget to Allocated Sum
                </button>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#EFE6DD] flex flex-col justify-center">
                <span className="text-[11px] font-bold text-[#7C6E6A] uppercase">Unallocated Reserve</span>
                <span
                  className={`text-base font-black ${
                    modalUnallocated < 0 ? 'text-red-600' : 'text-[#6E8B74]'
                  }`}
                >
                  ₱{modalUnallocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[#7C6E6A]">
                  {modalUnallocated < 0 ? 'Allocations exceed total cap' : 'Available to allocate'}
                </span>
              </div>
            </div>

            {/* Category Allocations List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#3A2E2B] uppercase tracking-wider">
                  Category Budget Allocations (₱)
                </label>
                <span className="text-[11px] text-[#7C6E6A]">
                  Enter planned amounts for each category
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categoryRows.map((row, idx) => (
                  <div
                    key={`${row.name}-${idx}`}
                    className="flex items-center justify-between gap-2 bg-[#FAF6F0] px-3 py-2 rounded-xl border border-[#EFE6DD]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#3A2E2B] truncate">{row.name}</p>
                      {row.isCustom && (
                        <span className="text-[10px] font-semibold text-[#6E8B74]">Custom Category</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-[#7C6E6A]">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.planned}
                        onChange={(e) => {
                          const updated = [...categoryRows];
                          updated[idx] = { ...updated[idx], planned: e.target.value };
                          setCategoryRows(updated);
                        }}
                        className="w-24 bg-white border border-[#EFE6DD] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#3A2E2B] text-right focus:outline-none focus:border-[#6E8B74]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCategoryRow(idx)}
                        title="Remove category"
                        className="p-1 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Custom Expense Category Row */}
            <div className="bg-[#FAF6F0] p-3.5 rounded-2xl border border-[#EFE6DD] space-y-2">
              <span className="text-xs font-bold text-[#3A2E2B] block">
                + Add Custom Expense Category
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Custom category name (e.g. Pet Care, Subscriptions)"
                  value={newCustomCatName}
                  onChange={(e) => setNewCustomCatName(e.target.value)}
                  className="flex-1 bg-white border border-[#EFE6DD] rounded-xl px-3 py-2 text-xs text-[#3A2E2B] focus:outline-none focus:border-[#6E8B74]"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Planned ₱"
                    value={newCustomCatAmount}
                    onChange={(e) => setNewCustomCatAmount(e.target.value)}
                    className="w-32 bg-white border border-[#EFE6DD] rounded-xl px-3 py-2 text-xs text-[#3A2E2B] focus:outline-none focus:border-[#6E8B74]"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddCustomCategoryRow}>
                    Add Category
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EFE6DD]">
              <Button type="button" variant="ghost" onClick={() => setIsPlanModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="sage" isLoading={isSubmitting}>
                Save {monthYearLabel} Budget Plan 🐾
              </Button>
            </div>
          </form>
        </Modal>

        {/* ─── Modal 2: Inline Edit Single Category Allocation ─── */}
        <Modal
          isOpen={!!editingCategoryItem}
          onClose={() => setEditingCategoryItem(null)}
          title={`Edit ${editingCategoryItem?.name} Budget`}
          description={`Update planned allocation for ${monthYearLabel}.`}
        >
          {editingCategoryItem && (
            <form onSubmit={handleUpdateSingleCategory} className="space-y-4">
              <Input
                label={`Planned Budget for ${editingCategoryItem.name} (₱)`}
                type="number"
                step="0.01"
                min="0"
                value={editCatPlannedVal}
                onChange={(e) => setEditCatPlannedVal(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditingCategoryItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="sage" isLoading={isSubmitting}>
                  Save Allocation 🐾
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* ─── Modal 3: Add Single Category Allocation ─── */}
        <Modal
          isOpen={isAddSingleCatOpen}
          onClose={() => setIsAddSingleCatOpen(false)}
          title={`Add Category to ${monthYearLabel} Plan`}
          description="Select a category or add a custom expense category."
        >
          <form onSubmit={handleAddSingleCategory} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#3A2E2B] mb-1.5 block">Expense Category</label>
              <select
                value={singleCatName}
                onChange={(e) => setSingleCatName(e.target.value)}
                className="w-full bg-white border border-[#EFE6DD] text-[#3A2E2B] rounded-2xl px-4 py-2.5 text-sm"
              >
                {DEFAULT_MONTHLY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__custom__">+ Custom Category...</option>
              </select>
            </div>

            {singleCatName === '__custom__' && (
              <Input
                label="Custom Category Name"
                placeholder="e.g. Pet Supplies, WiFi & Cable"
                value={singleCatCustomName}
                onChange={(e) => setSingleCatCustomName(e.target.value)}
                required
              />
            )}

            <Input
              label="Planned Budget Amount (₱)"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 3000.00"
              value={singleCatAmount}
              onChange={(e) => setSingleCatAmount(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddSingleCatOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="sage" isLoading={isSubmitting}>
                Add Allocation 🐾
              </Button>
            </div>
          </form>
        </Modal>

        {/* ─── Modal 4: View Budget Details ─── */}
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`${monthYearLabel} — Full Budget Details 📊`}
          description="Complete breakdown of planned allocations vs. actual recorded expenses."
          maxWidth="xl"
        >
          <div className="space-y-5">
            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-[#FAF6F0] p-3 rounded-xl border border-[#EFE6DD]">
                <span className="text-[#7C6E6A] block">Total Budget</span>
                <span className="font-black text-sm text-[#3A2E2B]">
                  ₱{totalMonthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-[#FAF6F0] p-3 rounded-xl border border-[#EFE6DD]">
                <span className="text-[#7C6E6A] block">Total Allocated</span>
                <span className="font-black text-sm text-[#D99B26]">
                  ₱{totalAllocatedBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-[#FAF6F0] p-3 rounded-xl border border-[#EFE6DD]">
                <span className="text-[#7C6E6A] block">Actual Expenses</span>
                <span className="font-black text-sm text-[#E2856E]">
                  ₱{totalActualExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-[#FAF6F0] p-3 rounded-xl border border-[#EFE6DD]">
                <span className="text-[#7C6E6A] block">Remaining</span>
                <span className={`font-black text-sm ${remainingMonthlyBudget < 0 ? 'text-red-600' : 'text-[#6E8B74]'}`}>
                  ₱{remainingMonthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Category Table */}
            <div className="max-h-80 overflow-y-auto border border-[#EFE6DD] rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F0] border-b border-[#EFE6DD] text-[#7C6E6A] uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Planned</th>
                    <th className="px-4 py-3 text-right">Actual</th>
                    <th className="px-4 py-3 text-right">Remaining</th>
                    <th className="px-4 py-3 text-right">Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE6DD]">
                  {categoryBreakdownList.map((row) => (
                    <tr key={row.id} className="hover:bg-[#FAF6F0]/60">
                      <td className="px-4 py-3 font-bold text-[#3A2E2B]">{row.name}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ₱{row.planned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#E2856E]">
                        ₱{row.actual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${row.remaining < 0 ? 'text-red-600' : 'text-[#6E8B74]'}`}>
                        {row.remaining >= 0
                          ? `₱${row.remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : `-₱${Math.abs(row.remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          variant={
                            row.status === 'over'
                              ? 'danger'
                              : row.status === 'warning'
                              ? 'honey'
                              : 'sage'
                          }
                          size="sm"
                        >
                          {row.pctUsed}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setIsDetailsModalOpen(false); openEditPlanModal(); }}>
                Edit Plan
              </Button>
              <Button variant="sage" size="sm" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>

        {/* ─── Modal 5: Reset Budget Plan Confirmation ─── */}
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title={`Reset ${monthYearLabel} Budget Plan? 🔄`}
          description={`This will clear the planned budget and category allocations for ${monthYearLabel} only. Other months and your recorded transactions will not be affected.`}
        >
          <div className="space-y-4">
            <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EFE6DD] text-xs space-y-1">
              <div className="flex justify-between font-bold text-[#3A2E2B]">
                <span>{monthYearLabel} Planned Budget</span>
                <span>₱{totalMonthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <p className="text-[#7C6E6A]">
                {activePlanCategories.length} allocated categories will be cleared.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="peach"
                onClick={handleConfirmResetPlan}
                isLoading={isSubmitting}
              >
                Yes, Reset {monthYearLabel} Plan
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
