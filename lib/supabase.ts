import { createClient } from "@supabase/supabase-js";

export type Todo = {
  id: string;
  user_id: string;
  text: string;
  done: boolean;
  created_at: string;
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
