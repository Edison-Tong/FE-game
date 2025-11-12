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
import { useNavigation } from "@react-navigation/native";
import { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { BACKEND_URL } from "@env";

export default function Login() {
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useContext(AuthContext);

  const handleLogin = async () => {
    if (username === "" || password === "") {
      alert("Please enter both username and password");
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: "POST", // ✅ This is needed to send a body
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }), // ✅ login data
      });
      const result = await res.json(); // or res.json() if backend sends JSON

      if (result.message === "Login ok") {
        setUser({ id: result.id, username: result.username }); // 👈 store globally
        navigation.navigate("HomeScreen");
      } else {
        alert("Invalid username or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong while logging in.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <TextInput style={styles.input} placeholder="username" value={username} onChangeText={setUsername} />
        <TextInput
          style={styles.input}
          placeholder="password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Login" onPress={handleLogin} />
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.newUserBtn}>Create a user </Text>
        </TouchableOpacity>
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
