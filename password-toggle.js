export function setupPasswordToggle(input, button) {
  button.addEventListener("click", () => {
    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";
    button.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
    button.setAttribute("aria-pressed", String(showPassword));
    button.querySelector("[data-eye-show]").hidden = showPassword;
    button.querySelector("[data-eye-hide]").hidden = !showPassword;
  });
}
