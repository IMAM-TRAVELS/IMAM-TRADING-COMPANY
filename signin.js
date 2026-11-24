import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  ref,
  serverTimestamp,
  set,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { auth, database } from "./firebase.js?v=12";
import { setupPasswordToggle } from "./password-toggle.js?v=1";

const accountRequestForm = document.querySelector("#signup-form");
const formMessage = document.querySelector("#form-message");
const passwordInput = document.querySelector("#password");
const submitButton = accountRequestForm.querySelector('button[type="submit"]');
const serviceTypeSelect = document.querySelector("#service-type");
const investorFields = document.querySelector("#investor-fields");
const accountMaintainFields = document.querySelector(
  "#account-maintain-fields",
);
const investorPlanSelect = document.querySelector("#plan");
const planPeriodSelect = document.querySelector("#plan-period");
const accountAmountInput = document.querySelector("#account-amount");
setupPasswordToggle(
  passwordInput,
  accountRequestForm.querySelector(".password-toggle"),
);

const investorPlans = new Set(["Gold", "Platinum"]);
const investorPeriods = new Set(["Monthly", "Yearly"]);

function updateServiceFields() {
  const isInvestor = serviceTypeSelect.value === "Investors";
  const isAccountMaintain = serviceTypeSelect.value === "Account Maintain";

  investorFields.hidden = !isInvestor;
  investorPlanSelect.disabled = !isInvestor;
  investorPlanSelect.required = isInvestor;
  planPeriodSelect.disabled = !isInvestor;
  planPeriodSelect.required = isInvestor;

  accountMaintainFields.hidden = !isAccountMaintain;
  accountAmountInput.disabled = !isAccountMaintain;
  accountAmountInput.required = isAccountMaintain;
}

const requestedService = new URLSearchParams(window.location.search).get(
  "serviceType",
);
if (["Investors", "Account Maintain"].includes(requestedService)) {
  serviceTypeSelect.value = requestedService;
}

const requestedPlan = new URLSearchParams(window.location.search).get("plan");
if (investorPlans.has(requestedPlan)) {
  investorPlanSelect.value = requestedPlan;
}

const requestedPeriod = new URLSearchParams(window.location.search).get(
  "planPeriod",
);
if (investorPeriods.has(requestedPeriod)) {
  planPeriodSelect.value = requestedPeriod;
}

serviceTypeSelect.addEventListener("change", updateServiceFields);
updateServiceFields();

function getPasswordError(password) {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Add at least one capital letter.";
  if (!/[0-9]/.test(password)) return "Add at least one number.";
  if (!/[^A-Za-z0-9\s]/.test(password)) return "Add at least one symbol.";
  return "";
}

function getAuthErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use":
      "An account with this email already exists. Please sign in.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/operation-not-allowed":
      "Email/password sign-up is not enabled for this Firebase project.",
    "auth/configuration-not-found":
      "Firebase Authentication is not initialized. The project owner must open Firebase Console, choose Authentication > Get started, then enable Email/Password.",
    "auth/weak-password": "Choose a stronger password.",
    "auth/network-request-failed":
      "Network error. Check your connection and try again.",
    "auth/too-many-requests":
      "Too many attempts. Wait a while and try again.",
  };

  return (
    messages[error.code] ||
    `Could not create your account (${error.code || "unknown Firebase error"}).`
  );
}

accountRequestForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  formMessage.textContent = "";
  const formData = new FormData(accountRequestForm);
  const fullName = String(formData.get("name")).trim();
  const email = String(formData.get("email")).trim();
  const password = passwordInput.value;
  const whatsappNumber = String(formData.get("phone")).trim();
  const serviceType = String(formData.get("serviceType") || "");
  const passwordError = getPasswordError(password);

  if (!fullName || fullName.length > 120) {
    formMessage.textContent = "Enter a full name of no more than 120 characters.";
    return;
  }

  if (whatsappNumber.length < 7 || whatsappNumber.length > 24) {
    formMessage.textContent =
      "Enter a WhatsApp number between 7 and 24 characters.";
    return;
  }

  if (!["Investors", "Account Maintain"].includes(serviceType)) {
    formMessage.textContent = "Select one of the available service types.";
    return;
  }

  let plan;
  let planPeriod;
  let accountAmount;
  if (serviceType === "Investors") {
    plan = String(formData.get("plan") || "");
    planPeriod = String(formData.get("planPeriod") || "");
    if (!investorPlans.has(plan)) {
      formMessage.textContent = "Select one of the available investor tiers.";
      return;
    }

    if (!investorPeriods.has(planPeriod)) {
      formMessage.textContent = "Select a monthly or yearly investor term.";
      return;
    }
  } else {
    plan = "Account Maintain";
    accountAmount = Number(formData.get("accountAmount"));
    if (
      !Number.isSafeInteger(accountAmount) ||
      accountAmount < 1000 ||
      accountAmount > 1000000
    ) {
      formMessage.textContent =
        "Enter an account amount from PKR 1,000 to PKR 1,000,000.";
      accountAmountInput.focus();
      return;
    }
  }

  if (passwordError) {
    formMessage.textContent = passwordError;
    passwordInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Creating account...";
  let accountCreated = false;

  try {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    accountCreated = true;

    const profile = {
      fullName,
      email: user.email,
      whatsappNumber,
      serviceType,
      plan,
      createdAt: serverTimestamp(),
    };

    if (serviceType === "Investors") {
      profile.planPeriod = planPeriod;
    } else {
      profile.accountAmount = accountAmount;
    }

    await set(ref(database, `users/${user.uid}`), profile);

    accountRequestForm.reset();
    updateServiceFields();
    const selection =
      serviceType === "Investors"
        ? `${plan} (${planPeriod})`
        : `Account Maintain request for PKR ${accountAmount.toLocaleString("en-PK")}`;
    formMessage.textContent =
      `Account created. Your ${selection} request is saved and awaiting ITC confirmation.`;
  } catch (error) {
    formMessage.textContent = accountCreated
      ? `Your login was created, but saving your profile failed (${error.code || "database error"}). Please do not register again; contact ITC support.`
      : getAuthErrorMessage(error);
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Make an account <span>→</span>';
  }
});
