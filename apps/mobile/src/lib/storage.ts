import * as SecureStore from "expo-secure-store";
export const readCredential = (key: string) => SecureStore.getItemAsync(key);
export const saveCredential = (key: string, value: string) =>
  SecureStore.setItemAsync(key, value);
export const deleteCredential = (key: string) =>
  SecureStore.deleteItemAsync(key);
