import { createClient } from "@supabase/supabase-js";
import { Database } from "@zer0/supabase";

if (!process.env.SUPABASE_URL) {
  throw new Error("Missing environment variable: SUPABASE_URL");
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error("Missing environment variable: SUPABASE_ANON_KEY");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

class SupabaseClient {
  private static instance: ReturnType<typeof createClient<Database>>;
  private static adminInstance: ReturnType<typeof createClient<Database>>;

  private constructor() {}

  public static getInstance() {
    if (!SupabaseClient.instance) {
      SupabaseClient.instance = createClient<Database>(
        supabaseUrl,
        supabaseKey,
      );
    }
    return SupabaseClient.instance;
  }

  public static getAdminInstance() {
    if (!SupabaseClient.adminInstance) {
      SupabaseClient.adminInstance = createClient<Database>(
        supabaseUrl,
        supabaseServiceKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );
    }
    return SupabaseClient.adminInstance;
  }
}

export const supabase = SupabaseClient.getInstance();
export const supabaseAdmin = SupabaseClient.getAdminInstance();
