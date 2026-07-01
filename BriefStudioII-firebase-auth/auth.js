// ── auth.js ────────────────────────────────────────────────────────────────
// Firebase Auth gate for AdsBrief Studio.
// Access is only granted to buyers whose account was created by the
// lynk-webhook backend (see /api/lynk-webhook.js) after a successful
// purchase on Lynk.id. This file just handles: login form, "set/forgot
// password" email, logout, and showing/hiding #app-content.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB_v6I9trCeGQigOzQZoOm57818lVt6HPw",
  authDomain: "briefstudio.firebaseapp.com",
  projectId: "briefstudio",
  storageBucket: "briefstudio.firebasestorage.app",
  messagingSenderId: "263763148388",
  appId: "1:263763148388:web:ec2f2b8ccdb62338832971",
  measurementId: "G-E6D4CWY487",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const gate = document.getElementById("auth-gate");
const content = document.getElementById("app-content");
const form = document.getElementById("auth-login-form");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const loginBtn = document.getElementById("auth-login-btn");
const errorBox = document.getElementById("auth-error");
const infoBox = document.getElementById("auth-info");
const forgotBtn = document.getElementById("auth-forgot-btn");
const logoutBtn = document.getElementById("auth-logout-btn");
const userEmailLabel = document.getElementById("auth-user-email");

function showError(msg) {
  infoBox.style.display = "none";
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}
function showInfo(msg) {
  errorBox.style.display = "none";
  infoBox.textContent = msg;
  infoBox.style.display = "block";
}
function clearMessages() {
  errorBox.style.display = "none";
  infoBox.style.display = "none";
}

function friendlyError(err) {
  switch (err.code) {
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Email/password salah, atau akun kamu belum dibuat. Pastikan kamu sudah beli produk ini di Lynk.id dan cek email untuk link set password.";
    case "auth/wrong-password":
      return "Password salah.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.";
    default:
      return "Gagal masuk: " + err.message;
  }
}

// ── Login ────────────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessages();
  loginBtn.disabled = true;
  loginBtn.textContent = "Memproses...";
  try {
    await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
    // onAuthStateChanged below will handle showing the app.
  } catch (err) {
    showError(friendlyError(err));
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Masuk";
  }
});

// ── Forgot / first-time set password ───────────────────────────────────
forgotBtn.addEventListener("click", async () => {
  clearMessages();
  const email = emailInput.value.trim();
  if (!email) {
    showError("Isi email kamu dulu di kolom email di atas, lalu klik tombol ini lagi.");
    return;
  }
  forgotBtn.disabled = true;
  try {
    await sendPasswordResetEmail(auth, email);
    showInfo("Kalau email itu terdaftar, link untuk set password baru sudah dikirim. Cek inbox (dan folder spam) ya.");
  } catch (err) {
    // Firebase intentionally can report user-not-found here; keep the
    // message generic so we don't leak which emails are registered.
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
      showInfo("Kalau email itu terdaftar, link untuk set password baru sudah dikirim. Cek inbox (dan folder spam) ya.");
    } else {
      showError("Gagal mengirim email: " + err.message);
    }
  } finally {
    forgotBtn.disabled = false;
  }
});

// ── Logout ───────────────────────────────────────────────────────────────
logoutBtn.addEventListener("click", () => signOut(auth));

// ── Auth state ───────────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    gate.classList.add("hidden");
    content.style.display = "";
    userEmailLabel.textContent = user.email || "";
  } else {
    gate.classList.remove("hidden");
    content.style.display = "none";
    userEmailLabel.textContent = "";
    passwordInput.value = "";
  }
});
