import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  get,
  ref,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { auth, database } from "./firebase.js?v=12";

const sessionState = document.querySelector("#session-state");
const sessionMessage = document.querySelector("#session-message");
const sessionSignOut = document.querySelector("#session-signout");
const dashboard = document.querySelector("#dashboard");
const signOutButton = document.querySelector("#signout-button");
const investorPlans = new Set(["Silver", "Gold", "Platinum", "Diamond"]);
const investorPeriods = new Set(["Monthly", "Yearly"]);
let authGeneration = 0;

function getInitials(fullName) {
  return (
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "ITC"
  );
}

function showAccountError(message) {
  sessionMessage.textContent = message;
  sessionState.hidden = false;
  sessionSignOut.hidden = false;
}

async function handleSignOut(button) {
  button.disabled = true;
  button.textContent = "Signing out...";
  try {
    await signOut(auth);
  } catch (error) {
    button.disabled = false;
    button.textContent = "Sign out";
    showAccountError(
      `Could not sign out (${error.code || "authentication error"}).`,
    );
  }
}

onAuthStateChanged(auth, async (user) => {
  const generation = ++authGeneration;
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  sessionMessage.textContent = "Loading your profile...";

  try {
    const snapshot = await get(ref(database, `users/${user.uid}`));
    if (generation !== authGeneration) {
      return;
    }

    if (!snapshot.exists()) {
      showAccountError(
        "Your saved profile could not be verified. Contact ITC support.",
      );
      return;
    }

    const profile = snapshot.val();
    const serviceType = profile && (profile.serviceType || "Investors");
    const isInvestor = serviceType === "Investors";
    const isAccountMaintain = serviceType === "Account Maintain";
    const validInvestorPlan =
      isInvestor &&
      investorPlans.has(profile.plan) &&
      (!profile.serviceType || investorPeriods.has(profile.planPeriod));
    const validAccountMaintain =
      isAccountMaintain &&
      profile.plan === "Account Maintain" &&
      Number.isSafeInteger(profile.accountAmount) &&
      profile.accountAmount >= 1000 &&
      profile.accountAmount <= 1000000;
    if (
      !profile ||
      typeof profile.fullName !== "string" ||
      typeof profile.whatsappNumber !== "string" ||
      (!validInvestorPlan && !validAccountMaintain) ||
      !user.email
    ) {
      showAccountError(
        "Your saved profile details are incomplete. Contact ITC support.",
      );
      return;
    }

    const initials = getInitials(profile.fullName);
    const memberSince =
      typeof profile.createdAt === "number" &&
      Number.isFinite(profile.createdAt)
        ? new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(new Date(profile.createdAt))
        : "Not available";

    document.querySelector("#profile-name").textContent = profile.fullName;
    document.querySelector("#profile-full-name").textContent =
      profile.fullName;
    document.querySelector("#profile-email").textContent = user.email;
    document.querySelector("#profile-email-detail").textContent = user.email;
    document.querySelector("#profile-phone").textContent =
      profile.whatsappNumber;
    document.querySelector("#profile-service-type").textContent = serviceType;
    document.querySelector("#profile-plan").textContent = validInvestorPlan
      ? profile.plan
      : "Account Maintain";
    document.querySelector("#profile-plan-period-row").hidden =
      !validInvestorPlan;
    document.querySelector("#profile-plan-period").textContent =
      profile.planPeriod || "Term not recorded";
    document.querySelector("#profile-account-amount-row").hidden =
      !validAccountMaintain;
    if (validAccountMaintain) {
      document.querySelector("#profile-account-amount").textContent =
        `PKR ${profile.accountAmount.toLocaleString("en-PK")}`;
    }
    document.querySelector("#member-since").textContent = memberSince;
    document.querySelector("#profile-initials").textContent = initials;
    document.querySelector("#topbar-initials").textContent = initials;
    document.querySelector("#topbar-name").textContent = profile.fullName;

    sessionState.hidden = true;
    dashboard.hidden = false;
  } catch (error) {
    if (generation !== authGeneration) {
      return;
    }

    showAccountError(
      `Unable to verify your profile (${error.code || "database error"}). Please try again.`,
    );
  }
});

signOutButton.addEventListener("click", () => handleSignOut(signOutButton));
sessionSignOut.addEventListener("click", () =>
  handleSignOut(sessionSignOut),
);