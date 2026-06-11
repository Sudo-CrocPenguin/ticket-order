import { Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/colors";
import { styles } from "../styles/styles";

export default function SearchBox({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.searchRow}>
      <Ionicons name="search" size={20} color={colors.textDim} />
      <TextInput
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        returnKeyType="search"
        style={styles.searchInput}
        value={value}
      />
      {value ? (
        <Pressable
          accessibilityLabel="Limpiar busqueda"
          accessibilityRole="button"
          onPress={() => onChangeText("")}
          style={styles.iconButton}
        >
          <Ionicons name="close-circle" size={20} color={colors.textDim} />
        </Pressable>
      ) : null}
    </View>
  );
}
