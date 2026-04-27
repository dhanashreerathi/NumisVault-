import { createClient } from '@supabase/supabase-js';

// Anon client — used for user-scoped operations (auth tokens forwarded from frontend)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Service-role client — used for admin operations only
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
