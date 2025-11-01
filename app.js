// ===================== Appwrite SDK Setup =====================
import { Client, Account, Databases, Storage } from "https://cdn.jsdelivr.net/npm/appwrite@10.6.0/dist/appwrite.min.js";

// Appwrite client setup
const client = new Client();
client
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("69050375000bafcad6f1");

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Admin email
const adminEmail = "eyakemabi@gmail.com";

// ===================== Auth Functions =====================
export async function signup(email, password) {
    try {
        await account.create(email, password);
        alert("Signup successful! Please login.");
        window.location.href = "login.html";
    } catch (error) {
        alert(error.message);
    }
}

export async function login(email, password) {
    try {
        await account.createSession(email, password);
        window.location.href = "dashboard.html";
    } catch (error) {
        alert(error.message);
    }
}

export async function logout() {
    try {
        await account.deleteSession('current');
        window.location.href = "login.html";
    } catch (error) {
        console.log(error);
    }
}

// ===================== Dashboard Functions =====================
export async function loadDashboard() {
    try {
        const user = await account.get();

        // Show admin link if email matches
        if (user.email === adminEmail) {
            document.getElementById("adminLink")?.classList.remove("hidden");
        }

        // Load points
        const pointsData = await databases.getDocument("EarnEthiopiaDB", "User", user.$id);
        document.getElementById("pointsBalance")?.textContent = pointsData.points || 0;

        // Load referral code
        document.getElementById("userReferralCode")?.textContent = pointsData.referralCode || "N/A";

        // Load announcements
        const announcements = await databases.listDocuments("EarnEthiopiaDB", "Announcements");
        const announcementList = document.getElementById("announcementsList");
        const announcementListAdmin = document.getElementById("announcementsListAdmin");
        if (announcementList) {
            announcementList.innerHTML = announcements.documents.map(a => `<li>${a.title}: ${a.message}</li>`).join("");
        }
        if (announcementListAdmin) {
            announcementListAdmin.innerHTML = announcements.documents.map(a => `<div class="card">${a.title}: ${a.message}</div>`).join("");
        }

        // Load tasks
        const tasks = await databases.listDocuments("EarnEthiopiaDB", "Tasks");
        const tasksList = document.getElementById("tasksList");
        const tasksAdminList = document.getElementById("tasksListAdmin");
        if (tasksList) {
            tasksList.innerHTML = tasks.documents.map(task => `
                <div class="task-card">
                    <h3>${task.title}</h3>
                    <p>${task.description}</p>
                    <a href="${task.link}" target="_blank" class="btn-primary task-link" data-task-id="${task.$id}">Open Task</a>
                    <input type="file" class="screenshot-upload" data-task-id="${task.$id}" accept="image/*">
                    <button class="btn-secondary submit-screenshot" data-task-id="${task.$id}">Submit Screenshot</button>
                </div>
            `).join("");
        }
        if (tasksAdminList) {
            tasksAdminList.innerHTML = tasks.documents.map(task => `
                <div class="card">
                    <h4>${task.title}</h4>
                    <p>${task.description}</p>
                    <button class="btn-secondary" onclick="deleteTask('${task.$id}')">Delete</button>
                </div>
            `).join("");
        }

        // Load referrals
        const referralList = document.getElementById("referralList");
        const referralPoints = document.getElementById("referralPoints");
        if (referralList) {
            const referrals = await databases.listDocuments("EarnEthiopiaDB", "Referrals", [`userId=${user.$id}`]);
            referralList.innerHTML = referrals.documents.map(r => `<li>${r.referredUserEmail}</li>`).join("");
            referralPoints.textContent = referrals.documents.length * 5; // 5 points per referral
        }

        // Load users (Admin)
        const usersListAdmin = document.getElementById("usersListAdmin");
        if (usersListAdmin && user.email === adminEmail) {
            const users = await databases.listDocuments("EarnEthiopiaDB", "User");
            usersListAdmin.innerHTML = users.documents.map(u => `<div class="card">${u.email} - Points: ${u.points || 0} <button onclick="banUser('${u.$id}')">Ban</button></div>`).join("");
        }

        // Load pending screenshots (Admin)
        const screenshotsListAdmin = document.getElementById("screenshotsListAdmin");
        if (screenshotsListAdmin && user.email === adminEmail) {
            const submissions = await databases.listDocuments("EarnEthiopiaDB", "Screenshots");
            screenshotsListAdmin.innerHTML = submissions.documents.map(s => `
                <div class="card">
                    <p>User: ${s.userEmail}</p>
                    <img src="${s.fileUrl}" width="100">
                    <button onclick="approveScreenshot('${s.$id}')">Approve</button>
                </div>
            `).join("");
        }

        attachTaskScreenshotHandlers();
    } catch (error) {
        console.log(error);
        window.location.href = "login.html";
    }
}

// ===================== Task Screenshot Submission =====================
function attachTaskScreenshotHandlers() {
    const submitButtons = document.querySelectorAll(".submit-screenshot");
    submitButtons.forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const taskId = e.target.dataset.taskId;
            const fileInput = document.querySelector(`.screenshot-upload[data-task-id='${taskId}']`);
            if (!fileInput.files[0]) return alert("Please select a screenshot.");

            const file = fileInput.files[0];
            const fileUploaded = await storage.createFile("EarnEthiopiaBucket", file.name + Date.now(), file);
            const user = await account.get();

            await databases.createDocument("EarnEthiopiaDB", "Screenshots", "unique()", {
                userId: user.$id,
                userEmail: user.email,
                taskId: taskId,
                fileId: fileUploaded.$id,
                fileUrl: fileUploaded.$id ? fileUploaded.$id : ""
            });

            alert("Screenshot submitted successfully!");
        });
    });
}

// ===================== Withdraw =====================
export async function requestWithdrawal(amount) {
    try {
        const user = await account.get();
        const userDoc = await databases.getDocument("EarnEthiopiaDB", "User", user.$id);

        const points = userDoc.points || 0;
        const requiredPoints = amount * 10; // 10 points = 1 ETB

        if (amount < 100) return alert("Minimum withdrawal is 100 ETB.");
        if (points < requiredPoints) return alert("Insufficient points.");

        // Deduct points
        await databases.updateDocument("EarnEthiopiaDB", "User", user.$id, {
            points: points - requiredPoints
        });

        // Create withdrawal request
        await databases.createDocument("EarnEthiopiaDB", "Withdrawals", "unique()", {
            userId: user.$id,
            userEmail: user.email,
            amountETB: amount,
            status: "pending",
            timestamp: new Date().toISOString()
        });

        alert("Withdrawal requested successfully!");
        window.location.href = "wallet.html";
    } catch (error) {
        console.log(error);
        alert("Error processing withdrawal.");
    }
}

// ===================== Admin Functions =====================
export async function deleteTask(taskId) {
    await databases.deleteDocument("EarnEthiopiaDB", "Tasks", taskId);
    alert("Task deleted!");
    loadDashboard();
}

export async function banUser(userId) {
    await databases.updateDocument("EarnEthiopiaDB", "User", userId, { banned: true });
    alert("User banned!");
    loadDashboard();
}

export async function approveScreenshot(screenshotId) {
    const screenshot = await databases.getDocument("EarnEthiopiaDB", "Screenshots", screenshotId);
    const taskDoc = await databases.getDocument("EarnEthiopiaDB", "Tasks", screenshot.taskId);
    const userDoc = await databases.getDocument("EarnEthiopiaDB", "User", screenshot.userId);

    const newPoints = (userDoc.points || 0) + (taskDoc.points || 10);
    await databases.updateDocument("EarnEthiopiaDB", "User", screenshot.userId, { points: newPoints });

    // Delete screenshot after approval
    await databases.deleteDocument("EarnEthiopiaDB", "Screenshots", screenshotId);
    alert("Screenshot approved!");
    loadDashboard();
}

// ===================== Event Listeners =====================
document.getElementById("logoutBtn")?.addEventListener("click", logout);
document.getElementById("withdrawForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseInt(document.getElementById("withdrawAmount").value);
    requestWithdrawal(amount);
});

// ===================== Initialization =====================
if (document.body.contains(document.querySelector(".dashboard")) || 
    document.body.contains(document.querySelector(".tasks")) || 
    document.body.contains(document.querySelector(".wallet")) ||
    document.body.contains(document.querySelector(".referrals")) ||
    document.body.contains(document.querySelector(".admin-panel"))) {
    loadDashboard();
}

