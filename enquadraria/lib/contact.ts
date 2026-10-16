export function isValidContact(value: string) {
  const contact = value.trim();
  const email =
    /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i.test(
      contact,
    );
  if (email) return true;

  if (!/^\+?[\d\s().-]+$/.test(contact)) return false;
  const digits = contact.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return false;

  // Reject obvious test values such as 123123123 or 5555555555.
  if (/^(\d{3,4})\1+$/.test(digits) || /^(\d)\1+$/.test(digits)) return false;

  return true;
}
