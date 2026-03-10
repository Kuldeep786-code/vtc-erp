import { createClient } from "@supabase/supabase-js"

let url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("Supabase URL from .env:", url);
console.log("Supabase Key from .env:", key ? "Loaded" : "NOT LOADED");

// Auto-fix: Ensure URL starts with https://
if (url && !url.startsWith('http')) {
  url = `https://${url}`
}

if (!url || !key) {
  console.error("Supabase URL or Key is missing!")
}

export const supabase = url && key ? createClient(url, key) : null
