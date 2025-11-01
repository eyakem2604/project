// -------------------- Appwrite Setup --------------------
import { Client, Account, Databases, Storage } from "https://cdn.jsdelivr.net/npm/appwrite@8.0.0/dist/appwrite.min.js";

const client = new Client();
client.setEndpoint("https://fra.cloud.appwrite.io/v1").setProject("69050375000bafcad6f1");

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// -------------------- GLOBAL --------------------
let userEmail = "";
let userPoints = 0;

// -------------------- HAMBURGER MENU --------------------
function toggleMenu() {
    const nav = document.querySelector("header nav");
    nav.classList.toggle("active");
}

// -------------------- LOGOUT --------------------
function logout() {
    account.deleteSession('current').then(() => {
        localStorage.clear();
        window.location.href = "login.html";
    });
}

// -------------------- SIGNUP --------------------
if(document.getElementById("signupForm")) {
    document.getElementById("signupForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("signupName").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;

        try {
            await account.create("unique()", email, password, name);
            localStorage.setItem("userEmail", email);
            localStorage.setItem("userPoints", 0);
            alert("Signup successful! Verify your email.");
            window.location.href = "verify.html";
        } catch (err) {
            alert(err.message);
        }
    });
}

// -------------------- VERIFY --------------------
if(document.getElementById("verifyForm")) {
    document.getElementById("verifyForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        alert("Email verified! You can login now.");
        window.location.href = "login.html";
    });
}

// -------------------- LOGIN --------------------
if(document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
            await account.createSession(email, password);
            localStorage.setItem("userEmail", email);
            if(!localStorage.getItem("userPoints")) localStorage.setItem("userPoints", 0);
            window.location.href = "dashboard.html";
        } catch (err) {
            alert(err.message);
        }
    });
}

// -------------------- DASHBOARD --------------------
if(document.getElementById("pointsBalance")) {
    userEmail = localStorage.getItem("userEmail") || "";
    userPoints = parseInt(localStorage.getItem("userPoints") || 0);

    document.getElementById("pointsBalance").innerText = userPoints;

    // Example announcements
    const announcements = ["Welcome to Earn Ethiopia!", "New tasks added today!"];
    const annList = document.getElementById("announcementsList");
    announcements.forEach(a=>{
        const li = document.createElement("li");
        li.innerText = a;
        annList.appendChild(li);
    });

    // Example recent tasks
    const recentTasks = ["Visit Website X", "Follow Telegram Y"];
    const taskList = document.getElementById("recentTasks");
    recentTasks.forEach(t=>{
        const li = document.createElement("li");
        li.innerText = t;
        taskList.appendChild(li);
    });

    // Referral info
    document.getElementById("referralCode").innerText = "ETHE1234";
    const referredUsers = ["user1@gmail.com","user2@gmail.com"];
    const refList = document.getElementById("referredUsers");
    referredUsers.forEach(r=>{
        const li = document.createElement("li");
        li.innerText = r;
        refList.appendChild(li);
    });

    // Admin link
    if(userEmail === "eyakemabi@gmail.com") {
        document.getElementById("adminLink").classList.remove("hidden");
    }
}

// -------------------- TASKS PAGE --------------------
if(document.getElementById("tasksList")) {
    const tasks = [
        {title:"Visit Website X", points:10, link:"https://example.com"},
        {title:"Follow Telegram Y", points:5, link:"https://t.me/PromotionEmpire"}
    ];
    const tasksList = document.getElementById("tasksList");
    tasks.forEach(t=>{
        const div = document.createElement("div");
        div.className = "profile-card";
        div.innerHTML = `<h4>${t.title}</h4><p>Points: ${t.points}</p><a href="${t.link}" target="_blank" class="btn">Go</a>`;
        tasksList.appendChild(div);
    });

    // Screenshot Upload
    if(document.getElementById("screenshotForm")) {
        document.getElementById("screenshotForm").addEventListener("submit", async (e)=>{
            e.preventDefault();
            const file = document.getElementById("screenshotFile").files[0];
            if(!file) return alert("Select a file");
            try{
                await storage.createFile("unique()", file);
                document.getElementById("screenshotStatus").innerText = "Screenshot uploaded! Pending admin approval.";
            }catch(err){
                alert(err.message);
            }
        });
    }
}

// -------------------- WALLET --------------------
if(document.getElementById("walletPoints")) {
    const points = parseInt(localStorage.getItem("userPoints")||0);
    const ETB = Math.floor(points/10);
    document.getElementById("walletPoints").innerText = points;
    document.getElementById("walletETB").innerText = ETB;
    document.getElementById("walletName").innerText = "Your Name";
    document.getElementById("walletPhone").innerText = "0912345678";

    document.getElementById("requestWithdrawalBtn").addEventListener("click", ()=>{
        localStorage.setItem("availableETB", ETB);
        window.location.href = "withdraw.html";
    });
}

// -------------------- WITHDRAW PAGE --------------------
if(document.getElementById("withdrawForm")) {
    const form = document.getElementById("withdrawForm");
    const availableETB = parseInt(localStorage.getItem("availableETB")||0);
    const input = document.getElementById("withdrawAmount");
    input.setAttribute("max", availableETB);
    input.setAttribute("min",100);
    input.placeholder = `Amount (ETB, max ${availableETB})`;

    form.addEventListener("submit", async (e)=>{
        e.preventDefault();
        const name = document.getElementById("telebirrName").value;
        const phone = document.getElementById("telebirrPhone").value;
        const amount = parseInt(document.getElementById("withdrawAmount").value);
        if(amount < 100 || amount > availableETB) return alert("Invalid amount");

        try{
            await databases.createDocument("earn_eth_db","withdrawals","unique()",{
                name, phone, amount, status:"pending", email:userEmail
            });
            userPoints -= amount*10;
            localStorage.setItem("userPoints", userPoints);
            alert("Withdrawal request submitted!");
            window.location.href = "wallet.html";
        }catch(err){
            alert(err.message);
        }
    });
}

// -------------------- REFERRALS --------------------
if(document.getElementById("referredUsers")){
    document.getElementById("referralCode").innerText="ETHE1234";
    const referredUsers = ["user1@gmail.com","user2@gmail.com"];
    const list = document.getElementById("referredUsers");
    if(referredUsers.length===0) document.getElementById("noReferrals").style.display="block";
    else{
        document.getElementById("noReferrals").style.display="none";
        referredUsers.forEach(r=>{
            const li = document.createElement("li");
            li.innerText = r;
            list.appendChild(li);
        });
    }
}

// -------------------- PROFILE PAGE --------------------
if(document.getElementById("profileName")){
    document.getElementById("profileName").innerText="Your Name";
    document.getElementById("profileEmail").innerText=userEmail||"email@example.com";
    document.getElementById("profilePhone").innerText="0912345678";
    document.getElementById("profilePoints").innerText=localStorage.getItem("userPoints")||0;

    const editBtn = document.getElementById("editProfileBtn");
    const editSection = document.getElementById("editProfileSection");
    editBtn.addEventListener("click",()=>editSection.style.display="block");

    document.getElementById("editProfileForm").addEventListener("submit",(e)=>{
        e.preventDefault();
        const name = document.getElementById("editName").value;
        const phone = document.getElementById("editPhone").value;
        document.getElementById("profileName").innerText=name;
        document.getElementById("profilePhone").innerText=phone;
        document.getElementById("editStatus").innerText="Profile updated!";
    });
}

// -------------------- ADMIN PANEL --------------------
if(document.getElementById("announcementForm")){
    if(userEmail !== "eyakemabi@gmail.com") window.location.href="dashboard.html";

    const annForm=document.getElementById("announcementForm");
    const annList=document.getElementById("announcementListAdmin");
    annForm.addEventListener("submit",(e)=>{
        e.preventDefault();
        const text=document.getElementById("announcementInput").value;
        const li=document.createElement("li");
        li.innerText=text;
        annList.appendChild(li);
        document.getElementById("announcementInput").value="";
    });

    // Tasks Management
    const taskForm=document.getElementById("taskForm");
    const taskListAdmin=document.getElementById("tasksListAdmin");
    taskForm.addEventListener("submit",(e)=>{
        e.preventDefault();
        const title=document.getElementById("taskTitle").value;
        const link=document.getElementById("taskLink").value;
        const points=document.getElementById("taskPoints").value;
        const li=document.createElement("li");
        li.innerText=`${title} - ${points} pts`;
        taskListAdmin.appendChild(li);
        document.getElementById("taskTitle").value="";
        document.getElementById("taskLink").value="";
        document.getElementById("taskPoints").value="";
    });

    // Users and Withdrawals (Example Lists)
    const usersListAdmin=document.getElementById("usersListAdmin");
    const withdrawalsListAdmin=document.getElementById("withdrawalsListAdmin");
    const users=["user1@gmail.com","user2@gmail.com"];
    users.forEach(u=>{
        const li=document.createElement("li");
        li.innerText=u;
        const btn=document.createElement("button");
        btn.innerText="Ban";
        btn.className="btn";
        btn.onclick=()=>li.style.textDecoration="line-through";
        li.appendChild(btn);
        usersListAdmin.appendChild(li);
    });

    const withdrawals=[{email:"user1@gmail.com",amount:150,status:"pending"}];
    withdrawals.forEach(w=>{
        const li=document.createElement("li");
        li.innerText=`${w.email} requested ${w.amount} ETB - ${w.status}`;
        const approve=document.createElement("button");
        approve.innerText="Approve"; approve.className="btn";
        approve.onclick=()=>li.innerText+= " ✅ Approved";
        li.appendChild(approve);
        withdrawalsListAdmin.appendChild(li);
    });
}

// -------------------- CONTACT PAGE --------------------
if(document.getElementById("contactForm")){
    document.getElementById("contactForm").addEventListener("submit", async (e)=>{
        e.preventDefault();
        const name=document.getElementById("contactName").value;
        const email=document.getElementById("contactEmail").value;
        const message=document.getElementById("contactMessage").value;
        try{
            await databases.createDocument("earn_eth_db","contacts","unique()",{
                name,email,message
            });
            document.getElementById("contactStatus").innerText="Message sent!";
            document.getElementById("contactForm").reset();
        }catch(err){ alert(err.message); }
    });
}

