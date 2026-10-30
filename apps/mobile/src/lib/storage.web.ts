// Browser credentials remain in HTTP-only cookies. Only nonsecret coordinator metadata persists.
export async function readCredential(key: string) {
  return ["coordinator", "appearance"].includes(key)
    ? localStorage.getItem(key)
    : null;
}
export async function saveCredential(key: string, value: string) {
  if (["coordinator", "appearance"].includes(key))
    localStorage.setItem(key, value);
}
export async function deleteCredential(key: string) {
  localStorage.removeItem(key);
}
