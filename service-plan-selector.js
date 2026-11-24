const serviceButtons = [
  ...document.querySelectorAll("[data-service-choice]"),
];
const servicePanels = [
  ...document.querySelectorAll("[data-service-panel]"),
];
const periodButtons = [
  ...document.querySelectorAll("[data-investor-period-choice]"),
];
const investorCards = [
  ...document.querySelectorAll("[data-investor-plan-card]"),
];
const params = new URLSearchParams(window.location.search);
const requestedPeriod = params.get("planPeriod");
const requestedService =
  params.get("serviceType") === "Account Maintain"
    ? "account-maintain"
    : "investors";

function chooseService(service) {
  serviceButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.serviceChoice === service),
    );
  });

  servicePanels.forEach((panel) => {
    panel.hidden = panel.dataset.servicePanel !== service;
  });
}

function choosePeriod(period) {
  if (!["Monthly", "Yearly"].includes(period)) {
    return;
  }

  periodButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.investorPeriodChoice === period),
    );
  });

  investorCards.forEach((card) => {
    card.dataset.planPeriod = period;
    card.querySelector("[data-investor-term-label]").textContent =
      `${period} plan`;
    card.querySelector("[data-investor-term-value]").textContent = period;

    const link = card.querySelector("[data-investor-plan-link]");
    const destination = new URL(link.href, window.location.href);
    destination.searchParams.set("serviceType", "Investors");
    destination.searchParams.set("plan", card.dataset.investorTier);
    destination.searchParams.set("planPeriod", period);
    link.href = `${destination.pathname}${destination.search}${destination.hash}`;
  });
}

serviceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    chooseService(button.dataset.serviceChoice);
  });
});

periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    choosePeriod(button.dataset.investorPeriodChoice);
  });
});

if (periodButtons.length && investorCards.length) {
  choosePeriod(requestedPeriod || "Monthly");
}

if (serviceButtons.length && servicePanels.length) {
  chooseService(requestedService);
}
