const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vwruogwdtbsareighmoc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__1Y1EwVreZS7LEaExgwrew_hIDT-ECZ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkData() {
    console.log("Checking students table...");
    const { data, error } = await supabase.from('students').select('*').limit(5);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data from Supabase:", JSON.stringify(data, null, 2));
    }
}

checkData();
