import {createClient} from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = 'https://bnsydsxrhzlyptwyvjll.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuc3lkc3hyaHpseXB0d3l2amxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTgzMzcsImV4cCI6MjA3NTY3NDMzN30.6isq1xIJS-y1opkixbP6CyX645uxsZGEBR0nkQJ3SEA'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

window.supabase = supabase

const loginBtn = document.querySelector('#login-btn')
const logoutBtn = document.querySelector('#logout-btn')
const userDisplay = document.querySelector('#user-info')

let dataLoaded = false

// Restore session on page load
checkSession()  

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

supabase.auth.onAuthStateChange((event, session) => {
  const user = session?.user || null
  updateUI(user)

  if (user && !dataLoaded) {
    loadAllData()
    dataLoaded = true
  }
})

async function checkSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("getSession error:", error);

  const user = data.session?.user || null;
  updateUI(user);

  // ✅ NEW: if already signed in on refresh, load data immediately
  if (user && !dataLoaded) {
    await loadAllData();
    dataLoaded = true;
  }
}


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
    const [rounds, members, movies, ratings] = await Promise.all([
      fetchAllRows('rounds'),
      fetchAllRows('members'),
      fetchAllRows('movies'),
      fetchAllRows('ratings'),
    ]);

    console.log("✅ Data loaded successfully:", {
      rounds: rounds.length,
      members: members.length,
      movies: movies.length,
      ratings: ratings.length
    });

    // Optional: make available globally
    window.rounds = rounds;
    window.members = members;
    window.movies = movies;
    window.ratings = ratings;

    window.dispatchEvent(new Event('dataLoaded'))

  } catch (err) {
    console.error("Error loading data:", err);
  }

  // --- Helper: fetch all rows from a Supabase table ---
  async function fetchAllRows(tableName) {
    const allData = [];
    let from = 0;
    const chunk = 1000;
    let done = false;

    while (!done) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(from, from + chunk - 1);

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        break;
      }

      allData.push(...data);
      if (data.length < chunk) done = true;
      from += chunk;
    }

    return allData;
  }
}