'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { CatIllustration } from '@/components/ui/CatIllustration';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const res = await resetPassword(email);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.message) {
      setSuccessMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <Link href="/" className="inline-block">
              <CatIllustration mood="detective" size={72} className="mx-auto" />
            </Link>
            <h1 className="text-2xl font-black text-[#3A2E2B]">Reset Password 🐾</h1>
            <p className="text-xs text-[#7C6E6A]">Enter your email and we'll send reset instructions.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-[#EBF1EC] text-[#6E8B74] border border-[#D1E2D4] p-3 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="cat@budget.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="sage"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Send Reset Link
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-[#EFE6DD]">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C6E6A] hover:text-[#3A2E2B]">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
