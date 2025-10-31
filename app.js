// ----------------- Supabase Setup -----------------
const SUPABASE_URL = "https://dsdhriyfhbgwvfqfozzm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.K9AkSOB7qF7fSSERAfMy6Xmp4prcKd1sNaTbBazrdns";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----------------- Auth Functions -----------------
async function signup(fullName, email, password) {
  try {
    const { data, error } = await supabase.auth.signUp(
      { email, password },
      { data: { full_name: fullName } }
    );

    if (error) return alert("Signup failed: " + error.message);

    alert("Signup successful! Check your email to verify.");
    window.location.href = "verify.html";
  } catch (err) {
    alert("Unexpected error: " + err.message);
  }
}

async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert("Login failed: " + error.message);

    // Check if email is verified
    if (!data.user.email_confirmed_at) {
      alert("Please verify your email first!");
      window.location.href = "verify.html";
      return;
    }

    window.location.href = "dashboard.html";
  } catch (err) {
    alert("Unexpected error: " + err.message);
  }
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

// ----------------- Dashboard -----------------
async function loadDashboard() {
  const user = supabase.auth.user();
  if (!user) return window.location.href = "login.html";

  const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
  document.getElementById('welcomeMsg').innerText = `Welcome, ${userData.full_name}!`;
  document.getElementById('points').innerText = userData.points;

  // Admin link
  if (user.email === "eyakemabi@gmail.com") {
    document.getElementById('adminLink').style.display = "block";
  }

  // Load announcements
  const { data: announcements } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
  document.getElementById('announcements').innerHTML = announcements.map(a => `<div>${a.content}</div>`).join('');
}

// ----------------- Tasks -----------------
async function loadTasks() {
  const user = supabase.auth.user();
  if (!user) return window.location.href = "login.html";

  const { data: tasks } = await supabase.from('tasks').select('*');
  document.getElementById('tasksList').innerHTML = tasks.map(t => `
    <div class="taskCard">
      <h3>${t.title}</h3>
      <p>Reward: ${t.reward} points</p>
      <a href="${t.link}" target="_blank">Go to Task</a>
      <input type="file" onchange="uploadScreenshot(event, '${t.id}')">
    </div>
  `).join('');
}

async function uploadScreenshot(event, taskId) {
  const file = event.target.files[0];
  const user = supabase.auth.user();
  if (!file) return;
  const { data, error } = await supabase.storage.from('screenshots').upload(`${user.id}/${taskId}/${file.name}`, file);
  if (error) return alert(error.message);
  alert("Screenshot uploaded!");
}

// ----------------- Wallet -----------------
async function requestWithdrawal(name, number) {
  const user = supabase.auth.user();
  if (!user) return window.location.href = "login.html";

  const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
  if (userData.points < 10) return alert("You need at least 10 points to withdraw!");

  const etbAmount = Math.floor(userData.points / 10);
  const { error } = await supabase.from('withdrawals').insert({
    user_id: user.id,
    telebirr_name: name,
    telebirr_number: number,
    amount: etbAmount
  });
  if (error) return alert(error.message);

  alert(`Withdrawal requested: ${etbAmount} ETB`);
}

// ----------------- Referrals -----------------
async function loadReferral() {
  const user = supabase.auth.user();
  if (!user) return window.location.href = "login.html";

  document.getElementById('refLink').innerText = `${window.location.origin}/signup.html?ref=${user.id}`;
  const { data: referrals } = await supabase.from('referrals').select('*').eq('user_id', user.id);
  document.getElementById('refCount').innerText = referrals.length;
}

// ----------------- Admin -----------------
async function adminAddTask(title, link, reward) {
  await supabase.from('tasks').insert({ title, link, reward });
  alert("Task added!");
  loadTasks();
}

async function adminAddAnnouncement(content) {
  await supabase.from('announcements').insert({ content });
  alert("Announcement added!");
  loadDashboard();
}

async function loadSubmissions() {
  const { data } = await supabase.storage.from('screenshots').list('');
  document.getElementById('submissions').innerHTML = data.map(d => `<div>${d.name}</div>`).join('');
}

