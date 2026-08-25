import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required')
});

export const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  type: z.enum(['expense', 'income', 'transfer']),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  budgetId: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional()
});

export const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  budgetType: z.string(),
  totalBudget: z.number().positive('Total budget must be greater than zero'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().optional()
});

export const billSchema = z.object({
  name: z.string().min(1, 'Bill name is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  dueDate: z.string().min(1, 'Due date is required'),
  recurring: z.string(),
  notes: z.string().optional()
});

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  targetAmount: z.number().positive('Target amount must be greater than zero'),
  currentAmount: z.number().min(0),
  targetDate: z.string().optional()
});
