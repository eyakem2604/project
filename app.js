Eyakem, [10/26/2025 1:44 PM]
if (task.video_link) {
      const btn = document.createElement("button");
      btn.innerText = "Open Link";
      btn.onclick = () => window.open(task.video_link, "_blank");
      div.appendChild(btn);
    }
    if (task.requires_screenshot) {
      const uploadInput = document.createElement("input");
      uploadInput.type = "file";
      uploadInput.accept = "image/*";
      uploadInput.onchange = async (e) => {
        const file = e.target.files[0];
        const user = supabase.auth.getUser();
        const { data: userData } = await supabase.auth.getUser();
        const path = uploads/${userData.user.id}/${Date.now()}_${file.name};
        const { error: uploadError } = await supabase.storage.from("uploads").upload(path, file);
        if (uploadError) return alert(uploadError.message);
        const { data: fileData } = supabase.storage.from("uploads").getPublicUrl(path);
        await supabase.from("activities").insert([{ user_id: userData.user.id, task_id: task.id, event: "screenshot_upload", meta_json: { url: fileData.publicUrl }, created_at: new Date() }]);
        alert("Screenshot uploaded! Admin will review and award points.");
      };
      div.appendChild(uploadInput);
    }
    taskListDiv.appendChild(div);
  });
}
loadTasks();

// -------------------------
// Wallet & Withdrawals
// -------------------------
const withdrawForm = document.getElementById("withdrawForm");
if (withdrawForm) {
  withdrawForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const points = parseInt(document.getElementById("withdraw_points").value);
    const telebirr_number = document.getElementById("telebirr_number").value;
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return alert("Login first");
    const { data: userRow } = await supabase.from("users").select("*").eq("id", userData.user.id).single();
    if (userRow.points_balance < points) return alert("Not enough points");
    const etb = points / 10;
    if (etb < 100) return alert("Minimum withdrawal is 100 ETB");

    // Create withdrawal request
    await supabase.from("withdrawals").insert([{ user_id: userData.user.id, points, etb_amount: etb, telebirr_number, status: "pending", created_at: new Date() }]);
    alert("Withdrawal request sent to admin");
  });
}

// -------------------------
// Admin Panel
// -------------------------
async function loadAdminPanel() {
  const panel = document.getElementById("adminPanel");
  if (!panel) return;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user || userData.user.email !== ADMIN_EMAIL) return panel.innerHTML = "Access denied";

  panel.innerHTML = <h4>Admin Controls</h4>;

  // Load Users
  const { data: users } = await supabase.from("users").select("*");
  const userList = document.createElement("ul");
  users.forEach(u => {
    const li = document.createElement("li");
    li.innerHTML = ${u.display_name} (${u.email}) - Points: ${u.points_balance} - Banned: ${u.is_banned}
      <button onclick="banUser('${u.id}', ${!u.is_banned})">${u.is_banned ? 'Unban' : 'Ban'}</button>;
    userList.appendChild(li);
  });
  panel.appendChild(userList);

  // Load tasks admin can manage
  const { data: tasks } = await supabase.from("tasks").select("*");
  const taskList = document.createElement("ul");
  tasks.forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = ${t.title} - Points: ${t.points} - Screenshot Required: ${t.requires_screenshot}
      <button onclick="deleteTask('${t.id}')">Delete</button>;
    taskList.appendChild(li);
  });
  panel.appendChild(taskList);
}

async function banUser(userId, ban) {
  await supabase.from("users").update({ is_banned: ban }).eq("id", userId);
  alert(User ${ban ? "banned" : "unbanned"});
  loadAdminPanel();
}

async function deleteTask(taskId) {
  await supabase.from("tasks").delete().eq("id", taskId);
  alert("Task deleted");
  loadAdminPanel();
}

loadAdminPanel();

Eyakem, [10/26/2025 1:44 PM]
// -------------------------
// Track Page Activities
// -------------------------
window.addEventListener("beforeunload", async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) await trackActivity(userData.user.id, null, "page_close");
});