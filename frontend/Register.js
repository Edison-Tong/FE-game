import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";

export default function Register() {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Create a user</Text>
        <TextInput style={styles.input} placeholder="username" />
        <TextInput style={styles.input} placeholder="password" />
        <TextInput style={styles.input} placeholder="confirm password" />
        <Button title="Create new user" />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "red",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  newUserBtn: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
});
