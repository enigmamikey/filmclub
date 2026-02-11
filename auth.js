console.log("AUTH VERSION: 2026-02-11-A");

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("auth.js loaded");

// ---- Supabase client ----
const SUPABASE_URL = "https://bnsydsxrhzlyptwyvjll.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuc3lkc3hyaHpseXB0d3l2amxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTkzOTgsImV4cCI6MjA4NTc1OTM5OH0.s0M4Ftsu8JtIxXEfDuMxfw3j9rtCV5uQvOYtYQznm1c";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

window.supabase = supabase;

// ---- DOM ----
const loginBtn = document.querySelector("#login-btn");
const logoutBtn = document.querySelector("#logout-btn");
const userDisplay = document.querySelector("#user-info");

// ---- UI (logout NEVER shown) ----
function updateUI(user) {
  window.currentUser = user ?? null;

  // logout button stays hidden permanently (per your rule)
  if (logoutBtn) logoutBtn.classList.add("hidden");

  if (!user) {
    userDisplay.textContent = "Not signed in";
    loginBtn.classList.remove("hidden");
    return;
  }

  const name = user.user_metadata?.full_name || user.email;
  userDisplay.textContent = `Hello, ${name}`;
  loginBtn.classList.add("hidden");
}

// ---- Data loading ----
async function fetchAllRows(tableName) {
  const all = [];
  const chunk = 1000;
  let from = 0;

  while (true) {
    const to = from + chunk - 1; // ✅ FIX: define `to`
    const { data, error } = await supabase.from(tableName).select("*").range(from, to);

    if (error) throw error;

    const rows = data || [];
    all.push(...rows);

    if (rows.length < chunk) break;
    from += chunk;
  }

  return all;
}

async function loadAllData() {
  console.log("loadAllData() starting");

  try {
    console.log("Fetching rounds...");
    const rounds = await fetchAllRows("rounds");

    console.log("Fetching members...");
    const members = await fetchAllRows("members");

    console.log("Fetching movies...");
    const movies = await fetchAllRows("movies");

    console.log("Fetching ratings...");
    const ratings = await fetchAllRows("ratings");

    // ✅ Store globally (no `allData` variable anywhere)
    window.rounds = rounds;
    window.members = members;
    window.movies = movies;
    window.ratings = ratings;

    console.log("✅ Data loaded:", {
      rounds: rounds.length,
      members: members.length,
      movies: movies.length,
      ratings: ratings.length,
    });

    window.dispatchEvent(new Event("dataLoaded"));
  } catch (err) {
    console.error("Error loading data:", err);
    throw err;
  }
}

// Guard so we only load once per page load
let loadPromise = null;
async function ensureDataLoaded() {
  if (loadPromise) return loadPromise;
  loadPromise = loadAllData();
  return loadPromise;
}

// ---- Auth actions ----
async function signIn() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });

  if (error) console.error("Login error:", error.message);
}

// Logout button is hidden, but keep a function for future or manual calls
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Logout error:", error.message);

  loadPromise = null;
  updateUI(null);
}

// ---- Init ----
async function initAuth() {
  if (loginBtn) loginBtn.addEventListener("click", signIn);
  if (logoutBtn) logoutBtn.addEventListener("click", signOut);

  console.log("registering onAuthStateChange");

  // Restore session immediately on load (refresh should keep you logged in)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;
  updateUI(user);

  // If already logged in on load, fetch data once
  if (user) {
    await ensureDataLoaded();
  }

  // React to auth events (OAuth redirect back, refresh/session init, token refresh)
  supabase.auth.onAuthStateChange(async (event, session2) => {
    const hasSession = !!session2;
    console.log("AUTH EVENT:", event, "hasSession:", hasSession);

    const user2 = session2?.user ?? null;
    updateUI(user2);

    if (user2 && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
      await ensureDataLoaded();
    }

    if (!user2 && event === "SIGNED_OUT") {
      loadPromise = null;
    }
  });
}

initAuth();
