/** Canonical id for the on-page interest / registration form section */
export const REGISTRATION_FORM_ID = "registration-form";

/** Legacy id kept as fallback for older links */
const LEGACY_FORM_ID = "lead-form";

export function getRegistrationSection(): HTMLElement | null {
  return (
    document.getElementById(REGISTRATION_FORM_ID) ??
    document.getElementById(LEGACY_FORM_ID)
  );
}

/** Smooth-scroll to the registration section and focus "שם מלא". */
export function scrollToRegistrationForm(options?: { focus?: boolean }) {
  const section = getRegistrationSection();
  if (!section) return false;

  section.scrollIntoView({ behavior: "smooth", block: "start" });

  if (options?.focus !== false) {
    window.setTimeout(() => {
      const nameInput = section.querySelector<HTMLInputElement>(
        'input[autocomplete="name"], input[type="text"]'
      );
      nameInput?.focus({ preventScroll: true });
    }, 450);
  }

  return true;
}
