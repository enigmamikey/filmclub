import {createClient} from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = 'https://bnsydsxrhzlyptwyvjll.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuc3lkc3hyaHpseXB0d3l2amxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTgzMzcsImV4cCI6MjA3NTY3NDMzN30.6isq1xIJS-y1opkixbP6CyX645uxsZGEBR0nkQJ3SEA'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

window.supabase = supabase

const loginBtn = document.querySelector('#login-btn')
const logoutBtn = document.querySelector('#logout-btn')
const userDisplay = document.querySelector('#user-info')

checkSession()

loginBtn?.addEventListener('click', async() => {
    const {error} = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {redirectTo: window.location.origin},
    })
    if (error) console.error("Login error:", error.message)
})

logoutBtn?.addEventListener('click', async() => {
    await supabase.auth.signOut()
    updateUI(null)
})

supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session?.user || null)
})

async function checkSession() {
    const {data} = await supabase.auth.getSession()
    updateUI(data.session?.user || null)
}

function updateUI(user) {
    if (user) {
        userDisplay.textContent = `Signed in as ${user.email}`
        loginBtn.classList.add('hidden')
        logoutBtn.classList.remove('hidden')
    }
    else {
        userDisplay.textContent = "Not signed in"
        loginBtn.classList.remove('hidden')
        logoutBtn.classList.add('hidden')
    }
    window.currentUser = user
}