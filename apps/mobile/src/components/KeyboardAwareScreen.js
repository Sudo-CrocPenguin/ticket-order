import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../styles/styles";

export default function KeyboardAwareScreen({
  children,
  contentContainerStyle,
  edges = ["top"],
}) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom + 96, 120);

  return (
    <SafeAreaView edges={edges} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        style={styles.container}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[
            contentContainerStyle,
            { paddingBottom: bottomPadding },
          ]}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
