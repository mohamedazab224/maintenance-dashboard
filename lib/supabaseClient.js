import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = require('process').env.SUPABASE_URL;
const SUPABASE_KEY = require('process').env.SUPABASE_KEY;

// إنشاء عميل Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
