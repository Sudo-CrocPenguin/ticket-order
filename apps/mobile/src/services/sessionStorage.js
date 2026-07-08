import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "@ticket_order/session";
const CACHE_KEY = "@ticket_order/workspace_cache";
const ACTIVE_COMPANY_KEY = "@ticket_order/active_company";

export const loadSession = async () => {
  const rawSession = await AsyncStorage.getItem(SESSION_KEY);
  return rawSession ? JSON.parse(rawSession) : null;
};

export const saveSession = async (session) => {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = async () => {
  await AsyncStorage.removeItem(SESSION_KEY);
};

export const loadWorkspaceCache = async () => {
  const rawCache = await AsyncStorage.getItem(CACHE_KEY);
  return rawCache ? JSON.parse(rawCache) : null;
};

export const saveWorkspaceCache = async (cache) => {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

export const loadActiveCompanyId = async () => {
  return AsyncStorage.getItem(ACTIVE_COMPANY_KEY);
};

export const saveActiveCompanyId = async (companyId) => {
  if (!companyId) {
    await AsyncStorage.removeItem(ACTIVE_COMPANY_KEY);
    return;
  }

  await AsyncStorage.setItem(ACTIVE_COMPANY_KEY, companyId);
};
