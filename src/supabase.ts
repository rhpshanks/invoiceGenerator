import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://hmewlygmfkdxhhnkgota.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZXdseWdtZmtkeGhobmtnb3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODM0NTcsImV4cCI6MjA5NjI1OTQ1N30.kEGdNZR_qi91pBZBXljr-E0oCdQit4SB-ItDuyBdufo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
