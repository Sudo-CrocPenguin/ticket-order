import { StyleSheet } from "react-native";
import { colors } from "./colors";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "bold"
  },
  text: {
    color: colors.text
  }
});