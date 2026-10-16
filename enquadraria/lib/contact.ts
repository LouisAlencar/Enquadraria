export function isValidContact(value: string) {
  const contact = value.trim();
  const email =
    /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i.test(
      contact,
    );
  if (email) return true;

  if (!/^\+?[\d\s().-]+$/.test(contact)) return false;
  const digits = contact.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}
