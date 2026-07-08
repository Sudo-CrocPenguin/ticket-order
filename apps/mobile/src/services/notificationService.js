import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const getProjectId = () =>
  Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;

export const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === "web") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("tickets", {
      name: "Tickets",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2CB67D",
    });
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermissions.status;

  if (finalStatus !== "granted") {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId = getProjectId();

  if (!projectId) {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return {
    token: token.data,
    platform: Platform.OS,
  };
};
