export const WELCOME_SEEN_KEY = "lh:welcome-seen";

export function markWelcomeSeen() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
  }
}
