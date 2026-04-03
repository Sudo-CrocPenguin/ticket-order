import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050510",
    padding: 16,
  },

  card: {
    backgroundColor: "#0d0d1f",
    padding: 16,
    marginBottom: 14,
    borderRadius: 16,

    //  efecto neón
    borderWidth: 1,
    borderColor: "#7f5af0",

    shadowColor: "#7f5af0",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },

    elevation: 10,
  },

  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },

  text: {
    color: "#cfcfff",
    marginTop: 6,
  },

  button: {
    marginTop: 12,
    backgroundColor: "#2cb67d",
    padding: 10,
    borderRadius: 10,
  },

  buttonText: {
    color: "#000",
    textAlign: "center",
    fontWeight: "bold",
  },

  header: {
    color: "#00f0ff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },

  input: {
  backgroundColor: "#0d0d1f",
  borderWidth: 1,
  borderColor: "#7f5af0",
  color: "#fff",
  padding: 12,
  borderRadius: 10,
  marginBottom: 12,
},

});