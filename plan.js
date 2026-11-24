import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  get,
  ref,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";
import { auth, database } from "./firebase.js?v=12";

const planStatus = document.querySelector("#plan-account-status");
const investorPlans = new Set(["Silver", "Gold", "Platinum", "Diamond"]);
const validPlanPeriods = new Set(["Monthly", "Yearly"]);
const validActivePlans = new Set([...investorPlans, "Account Maintain"]);
const planBadges = new Map();
for (const card of document.querySelectorAll("[data-plan]")) {
  const key =
    card.dataset.plan === "Investors"
      ? `Investors:${card.dataset.investorTier}`
      : card.dataset.plan;
  const badges = planBadges.get(key) || [];
  badges.push(card.querySelector(".plan-status-badge"));
  planBadges.set(key, badges);
}
let authGeneration = 0;

function showStatus(message, state) {
  planStatus.textContent = message;
  planStatus.className = `plan-account-status ${state}`;
  planStatus.hidden = false;
}

function markPlan(plan, label, state) {
  const badgeKey =
    plan === "Account Maintain"
      ? plan
      : investorPlans.has(plan)
        ? `Investors:${plan}`
        : null;
  const badges = badgeKey ? planBadges.get(badgeKey) : null;
  if (!badges) {
    return;
  }

  badges.forEach((badge) => {
    badge.textContent = label;
    badge.className = `plan-status-badge ${state}`;
    badge.hidden = false;
  });
}

function getSavedPlan(profile) {
  const serviceType = profile.serviceType || "Investors";

  if (serviceType === "Investors") {
    if (
      !investorPlans.has(profile.plan) ||
      (profile.serviceType &&
        !validPlanPeriods.has(profile.planPeriod))
    ) {
      return null;
    }

    return {
      serviceType,
      plan: profile.plan,
      period: validPlanPeriods.has(profile.planPeriod)
        ? profile.planPeriod
        : "",
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
      serviceType,
      plan: "Account Maintain",
      amount: profile.accountAmount,
      period: "",
    };
  }

  return null;
}

function describePlan(plan) {
  if (plan.serviceType === "Account Maintain") {
    return `Account Maintain request for PKR ${plan.amount.toLocaleString("en-PK")}`;
  }

  return `${plan.plan} Investor${plan.period ? ` (${plan.period})` : ""}`;
}

onAuthStateChanged(auth, async (user) => {
  const generation = ++authGeneration;
  planStatus.hidden = true;

  for (const badges of planBadges.values()) {
    badges.forEach((badge) => {
      badge.hidden = true;
    });
  }

  if (!user) {
    showStatus(
      "Sign in to see which plan ITC has confirmed for your account.",
      "guest",
    );
    return;
  }

  try {
    const profileSnapshot = await get(ref(database, `users/${user.uid}`));
    if (generation !== authGeneration) {
      return;
    }

    if (!profileSnapshot.exists()) {
      showStatus(
        "Your saved plan could not be verified. Please contact ITC.",
        "error",
      );
      return;
    }

    const profile = profileSnapshot.val();
    const savedPlan = profile && getSavedPlan(profile);
    if (!savedPlan) {
      showStatus(
        "Your saved plan could not be verified. Please contact ITC.",
        "error",
      );
      return;
    }

    const selectedDescription = describePlan(savedPlan);
    const serviceChoice =
      savedPlan.serviceType === "Account Maintain"
        ? "account-maintain"
        : "investors";
    document
      .querySelector(`[data-service-choice="${serviceChoice}"]`)
      ?.click();

    if (
      savedPlan.serviceType === "Investors" &&
      validPlanPeriods.has(savedPlan.period)
    ) {
      document
        .querySelector(
          `[data-investor-period-choice="${savedPlan.period}"]`,
        )
        ?.click();
    }
    markPlan(savedPlan.plan, "Selected", "selected");
    showStatus(
      `Your ${selectedDescription} is selected and awaiting ITC confirmation.`,
      "pending",
    );

    const activePlanSnapshot = await get(
      ref(database, `activePlans/${user.uid}`),
    );
    if (generation !== authGeneration) {
      return;
    }

    if (!activePlanSnapshot.exists()) {
      return;
    }

    const activePlan = activePlanSnapshot.val();
    if (typeof activePlan !== "string" || !validActivePlans.has(activePlan)) {
      showStatus(
        "The plan activation record could not be verified. Please contact ITC.",
        "error",
      );
      return;
    }

    markPlan(activePlan, "Active", "active");
    const activePlanDescription =
      activePlan === "Account Maintain"
        ? "Account Maintain"
        : `${activePlan} Investor`;
    showStatus(
      activePlan === savedPlan.plan
        ? `Your ${describePlan(savedPlan)} is active and confirmed by ITC.`
        : `ITC confirmed ${activePlanDescription} as active. Your selected request is ${selectedDescription}.`,
      "active",
    );
  } catch (error) {
    if (generation !== authGeneration) {
      return;
    }

    showStatus(
      `Unable to verify your plan status (${error.code || "database error"}).`,
      "error",
    );
  }
});