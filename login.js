import {
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { auth } from "./firebase.js?v=12";
import { setupPasswordToggle } from "./password-toggle.js?v=1";

const loginForm = document.querySelector("#login-form");
const formMessage = document.querySelector("#form-message");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const rememberInput = document.querySelector('[name="remember"]');
const submitButton = loginForm.querySelector('button[type="submit"]');
setupPasswordToggle(
  passwordInput,
  loginForm.querySelector(".password-toggle"),
);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  formMessage.textContent = "";
  submitButton.disabled = true;

  try {
    await setPersistence(
      auth,
      rememberInput.checked
        ? browserLocalPersistence
        : browserSessionPersistence,
    );
    const { user } = await signInWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value,
    );
    if (!user.email) {
      formMessage.textContent =
        "Your account does not have an email address. Contact ITC support.";
      return;
    }

    window.location.replace("home.html");
  } catch (error) {
    const messages = {
      "auth/invalid-credential": "The email or password is incorrect.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/user-disabled": "This account is disabled. Contact ITC support.",
      "auth/too-many-requests":
        "Too many attempts. Wait a while and try again.",
      "auth/network-request-failed":
        "Network error. Check your connection and try again.",
      "auth/configuration-not-found":
        "Firebase Authentication is not initialized. The project owner must open Firebase Console, choose Authentication > Get started, then enable Email/Password.",
      "auth/operation-not-allowed":
        "Email/password sign-in is not enabled for this Firebase project.",
    };
    formMessage.textContent =
      messages[error.code] ||
      `Could not sign in (${error.code || "unknown Firebase error"}).`;
  } finally {
    submitButton.disabled = false;
  }
});

document
  .querySelector("#forgot-password")
  .addEventListener("click", async (event) => {
    event.preventDefault();

    if (!emailInput.value.trim() || !emailInput.checkValidity()) {
      formMessage.textContent = "Enter your email address first.";
      emailInput.focus();
      return;
    }

    try {
      await sendPasswordResetEmail(auth, emailInput.value.trim());
      formMessage.textContent =
        "If an account exists for this email, password reset instructions have been sent.";
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        formMessage.textContent =
          "If an account exists for this email, password reset instructions have been sent.";
      } else {
        formMessage.textContent =
          error.code === "auth/invalid-email"
            ? "Enter a valid email address."
            : error.code === "auth/configuration-not-found"
              ? "Firebase Authentication is not initialized. The project owner must enable it in Firebase Console."
              : `Could not send the reset email (${error.code || "unknown Firebase error"}).`;
      }
    }
  });
