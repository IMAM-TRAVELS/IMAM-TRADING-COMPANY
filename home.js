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

const investorPlans = {
  Silver: { range: "PKR 1,000 – 9,999", profitShare: "50%" },
  Gold: { range: "PKR 10,000 – 49,999", profitShare: "60%" },
  Platinum: { range: "PKR 50,000 – 249,999", profitShare: "70%" },
  Diamond: { range: "PKR 250,000 – 5,000,000", profitShare: "80%" },
};
const investorPeriods = new Set(["Monthly", "Yearly"]);

function getPlanDetails(profile) {
  const serviceType = profile.serviceType || "Investors";

  if (serviceType === "Investors") {
    const investorPlan = investorPlans[profile.plan];
    if (
      !investorPlan ||
      (profile.serviceType && !investorPeriods.has(profile.planPeriod))
    ) {
      return null;
    }

    return {
      title: `${profile.plan} Investor plan`,
      label: `${profile.plan} · ${profile.planPeriod || "Term not recorded"}`,
      range: investorPlan.range,
      period: profile.planPeriod || "",
      profitShare: investorPlan.profitShare,
      isInvestor: true,
    };
  }

  if (
    serviceType === "Account Maintain" &&
    profile.plan === "Account Maintain" &&
    Number.isSafeInteger(profile.accountAmount) &&
    profile.accountAmount >= 1000 &&
    profile.accountAmount <= 1000000
  ) {
    return {
      title: "Account Maintain",
      label: "Account Maintain",
      range: `Requested amount: PKR ${profile.accountAmount.toLocaleString("en-PK")}`,
      amount: `PKR ${profile.accountAmount.toLocaleString("en-PK")}`,
      isInvestor: false,
    };
  }

  return null;
}

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
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  sessionMessage.textContent = "Loading your account details...";

  try {
    const snapshot = await get(ref(database, `users/${user.uid}`));
    if (!snapshot.exists()) {
      showAccountError(
        "Your saved account details could not be verified. Contact ITC support.",
      );
      return;
    }

    const profile = snapshot.val();
    const planDetails = profile && getPlanDetails(profile);
    if (
      !profile ||
      typeof profile.fullName !== "string" ||
      typeof profile.whatsappNumber !== "string" ||
      !planDetails ||
      !user.email
    ) {
      showAccountError(
        "Your saved account details are incomplete. Contact ITC support.",
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

    document.querySelector("#welcome-name").textContent =
      profile.fullName.trim().split(/\s+/)[0];
    document.querySelector("#profile-name").textContent = profile.fullName;
    document.querySelector("#profile-email").textContent = user.email;
    document.querySelector("#profile-phone").textContent =
      profile.whatsappNumber;
    document.querySelector("#member-since").textContent = memberSince;
    document.querySelector("#profile-plan").textContent = planDetails.label;
    document.querySelector("#plan-title").textContent = planDetails.title;
    document.querySelector("#plan-range").textContent = planDetails.range;
    const planPeriod = document.querySelector("#plan-period");
    planPeriod.hidden = !planDetails.period;
    planPeriod.textContent = planDetails.period
      ? `Investor term: ${planDetails.period}`
      : "";
    document.querySelector("#profit-share").textContent =
      planDetails.profitShare || "";
    document.querySelector("#profit-share-metric").hidden =
      !planDetails.isInvestor;
    document.querySelector("#loss-share-metric").hidden =
      !planDetails.isInvestor;
    document.querySelector("#account-amount-metric").hidden =
      planDetails.isInvestor;
    document.querySelector("#management-terms-metric").hidden =
      planDetails.isInvestor;
    if (!planDetails.isInvestor) {
      document.querySelector("#account-amount").textContent =
        planDetails.amount;
    }
    document.querySelector("#profile-initials").textContent = initials;
    document.querySelector("#topbar-initials").textContent = initials;
    document.querySelector("#topbar-name").textContent = profile.fullName;

    sessionState.hidden = true;
    dashboard.hidden = false;
  } catch (error) {
    showAccountError(
      `Unable to verify your account details (${error.code || "database error"}). Please try again.`,
    );
  }
});

signOutButton.addEventListener("click", () => handleSignOut(signOutButton));
sessionSignOut.addEventListener("click", () =>
  handleSignOut(sessionSignOut),
);
