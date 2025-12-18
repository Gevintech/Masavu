import { createClient } from '@supabase/supabase-js';

// Types for database tables

const supabaseUrl = 'https://kbhzwzbcrtmxhjshnkgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaHp3emJjcnRteGhqc2hua2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTgwNzIsImV4cCI6MjA4MTU3NDA3Mn0.bTDgMMhv3sVnKEj-eTZaGqHdTd9TbLkMhTpEHDT5ysI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  email: string;
  phone: string;
  referral_code: string;
  referral_link: string;
  referred_by: string | null;
  is_activated: boolean;
  wallet_referral: number;
  wallet_youtube: number;
  wallet_tiktok: number;
  wallet_quiz: number;
  wallet_daily: number;
  wallet_aviator: number;
  wallet_loan: number;
  wallet_math: number;
  total_referrals: number;
  last_daily_claim: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  type: 'youtube' | 'tiktok' | 'quiz' | 'aviator' | 'math';
  title: string;
  description: string;
  reward: number;
  link?: string;
  question?: string;
  options?: string[];
  correct_answer?: number;
  active: boolean;
  created_at: string;
};

export type Withdrawal = {
  id: string;
  user_id: string;
  username: string;
  wallet_type: string;
  amount: number;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export type Loan = {
  id: string;
  user_id: string;
  username: string;
  amount: number;
  reason: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export const generateReferralCode = (username: string): string => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${username.toUpperCase().substring(0, 4)}${random}`;
};

export const generateReferralLink = (referralCode: string): string => {
  return `https://www.supercash1.site/register?ref=${referralCode}`;
};
