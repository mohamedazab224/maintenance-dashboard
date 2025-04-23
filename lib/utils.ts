import { createClient } from '@supabase/supabase-js';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Updater } from '@tanstack/vue-table';
import type { Ref } from 'vue';

const SUPABASE_URL = require('process').env.SUPABASE_URL;
const SUPABASE_KEY = require('process').env.SUPABASE_KEY;

// إنشاء عميل Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function valueUpdater<T extends Updater<any>>(updaterOrValue: T, ref: Ref) {
  ref.value = typeof updaterOrValue === 'function'
    ? updaterOrValue(ref.value)
    : updaterOrValue
}
