import {createClient} from "https://esm.sh/@supabase/supabase-js@2"

console.log("auth.js loaded");

const SUPABASE_URL = 'https://bnsydsxrhzlyptwyvjll.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuc3lkc3hyaHpseXB0d3l2amxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTkzOTgsImV4cCI6MjA4NTc1OTM5OH0.s0M4Ftsu8JtIxXEfDuMxfw3j9rtCV5uQvOYtYQznm1c'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'implicit',          // <-- add this
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

window.supabase = supabase

const loginBtn = document.querySelector('#login-btn')
const logoutBtn = document.querySelector('#logout-btn')
const userDisplay = document.querySelector('#user-info')

loginBtn.addEventListener('click', async() => {
    const {error} = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {redirectTo: window.location.origin},
    })
    if (error) console.error("Login error:", error.message)
})

logoutBtn.addEventListener('click', async() => {
    await supabase.auth.signOut()
    updateUI(null)
})

let dataLoaded = false;

console.log("registering onAuthStateChange");

supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("AUTH EVENT:", event, "hasSession:", !!session);
  const user = session?.user ?? null;
  updateUI(user);

  // This fires on every page load after Supabase finishes restoring session from storage.
  if (event === "INITIAL_SESSION") {
    if (user) {
      await loadAllData();
      dataLoaded = true;
    } else {
      dataLoaded = false;
    }
    return;
  }

  // When the user actively signs in (or token refreshes) later
  if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && user) {
    if (!dataLoaded) {
      await loadAllData();
      dataLoaded = true;
    }
    return;
  }

  if (event === "SIGNED_OUT") {
    dataLoaded = false;
    // optional: clear UI/data if you want
  }
});

function updateUI(user) {
    if (user) {
        loginBtn.classList.add('hidden')
        // logoutBtn.classList.remove('hidden')
    }
    else {
        userDisplay.textContent = "Not signed in"
        loginBtn.classList.remove('hidden')
        logoutBtn.classList.add('hidden')
    }
    window.currentUser = user
    if (user) {
        userDisplay.textContent = `Hello, ${user.user_metadata.full_name || user.email}`;
    }
}

// --- Load all tables in parallel ---
async function loadAllData() {
  try {
    console.log("loadAllData() starting");

    console.log("Fetching rounds...");
    const rounds = await fetchAllRows('rounds');
    console.log("Fetched rounds:", rounds.length);

    console.log("Fetching members...");
    const members = await fetchAllRows('members');
    console.log("Fetched members:", members.length);

    console.log("Fetching movies...");
    const movies = await fetchAllRows('movies');
    console.log("Fetched movies:", movies.length);

    console.log("Fetching ratings...");
    const ratings = await fetchAllRows('ratings');
    console.log("Fetched ratings:", ratings.length);

    console.log("✅ Data loaded successfully:", { rounds: rounds.length, members: members.length, movies: movies.length, ratings: ratings.length });

    window.rounds = rounds;
    window.members = members;
    window.movies = movies;
    window.ratings = ratings;

    window.dispatchEvent(new Event('dataLoaded'));
  } catch (err) {
    console.error("Error loading data:", err);
  }
}

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) await loadAllData();
})();
