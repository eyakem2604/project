// Supabase project details (your credentials)
const SUPABASE_URL = "https://dsdhriyfhbgwvfqfozzm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzZGhyaXlmaGJnd3ZmcWZvenptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NTUwNzYsImV4cCI6MjA3NzAzMTA3Nn0.K9AkSOB7qF7fSSERAfMy6Xmp4prcKd1sNaTbBazrdns";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hamburger toggle
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
if(hamburger){
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });
}

// Auth forms
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');

if(showSignup){
    showSignup.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });
}
if(showLogin){
    showLogin.addEventListener('click', () => {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
}

// Signup
if(signupForm){
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const display_name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const referral = document.getElementById('signup-referral').value;

        const { user, error } = await supabaseClient.auth.signUp({ email, password });

        if(error){
            alert(error.message);
            return;
        }

        // Insert into users table
        const { data, error: insertError } = await supabaseClient
            .from('users')
            .insert([{
                id: user.id,
                display_name: display_name,
                referral_code: Math.random().toString(36).substring(2,8).toUpperCase(),
                referred_by: referral || null,
                points_balance: referral ? 5 : 0,
                is_admin: email === "eyakemabi@gmail.com"
            }]);

        if(insertError){
            alert(insertError.message);
            return;
        }

        alert('Signup successful. Please login.');
        signupForm.reset();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
}

// Login
if(loginForm){
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if(error){
            alert(error.message);
            return;
        }

        localStorage.setItem('userId', data.user.id);
        window.location.href = 'dashboard.html';
    });
}

// Load dashboard info
async function loadDashboard(){
    const userId = localStorage.getItem('userId');
    if(!userId) return window.location.href = "index.html";

    const { data: user } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if(!user) return window.location.href = "index.html";

    document.getElementById('user-points').textContent = user.points_balance;
    document.getElementById('user-referrals').textContent = user.referred_by ? 1 : 0;

    // Show admin link if user is admin
    if(user.is_admin){
        const adminLink = document.getElementById('admin-link');
        if(adminLink) adminLink.classList.remove('hidden');
    }

    // Load announcements
    const { data: announcements } = await supabaseClient.from('messages').select('*').order('created_at', {ascending: false});
    const annContainer = document.getElementById('announcements');
    if(annContainer && announcements) {
        announcements.forEach(a => {
            const div = document.createElement('div');
            div.className = 'announcement-card';
            div.innerHTML = `<h3>${a.subject}</h3><p>${a.body}</p>`;
            annContainer.appendChild(div);
        });
    }
}

// Load tasks
async function loadTasks(){
    const userId = localStorage.getItem('userId');
    const { data: tasks } = await supabaseClient.from('tasks').select('*').order('visible_order', {ascending: true});
    const container = document.getElementById('tasks-container');
    if(container && tasks){
        tasks.forEach(t => {
            const div = document.createElement('div');
            div.className = 'task-card';
            div.innerHTML = `
                <h3>${t.title}</h3>
                <p>Points: ${t.points}</p>
                <a href="${t.link}" target="_blank">Go to Task</a>
                ${t.requires_screenshot ? `<input type="file" class="screenshot-upload" data-task-id="${t.id}">` : ''}
                <button class="report-btn" data-task-id="${t.id}">Report</button>
            `;
            container.appendChild(div);
        });
    }

    // Screenshot upload
    container.querySelectorAll('.report-btn').forEach(btn => {
        btn.addEventListener('click', async (e)=>{
            const taskId = e.target.dataset.taskId;
            const input = container.querySelector(`.screenshot-upload[data-task-id="${taskId}"]`);
            let screenshotUrl = null;
            if(input && input.files.length>0){
                const file = input.files[0];
                const { data, error } = await supabaseClient.storage.from('screenshots').upload(`${userId}/${Date.now()}_${file.name}`, file);
                if(error) { alert(error.message); return; }
                screenshotUrl = data.path;
            }

            await supabaseClient.from('activities').insert([{ user_id: userId, task_id: taskId, event: 'completed', meta_json: JSON.stringify({ screenshot: screenshotUrl }), points_awarded: t.points, created_at: new Date() }]);
            alert('Task reported. Admin will verify.');
        });
    });
}

// Logout function
async function logout(){
    await supabaseClient.auth.signOut();
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

// Call dashboard load if on dashboard page
if(document.getElementById('user-points')){
    loadDashboard();
}

// Call tasks load if on tasks page
if(document.getElementById('tasks-container')){
    loadTasks();
}

// Hamburger sidebar toggle (all pages)
const sidebarToggle = document.getElementById('hamburger');
if(sidebarToggle){
    sidebarToggle.addEventListener('click', ()=>{
        sidebar.classList.toggle('show');
    });
}

