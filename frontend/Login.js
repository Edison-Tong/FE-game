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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const result = await res.json();

      if (result.message === "Login ok") {
        setUser({ id: result.id, username: result.username });
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
        <TextInput
          style={styles.input}
          placeholder="username"
          placeholderTextColor="#AFAFAF"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="password"
          placeholderTextColor="#AFAFAF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
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
    color: "#C9A66B",
  },
  container: {
    flex: 1,
    backgroundColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#3C3C3C",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
    color: "#F5F5F5",
  },
  loginButton: {
    backgroundColor: "#C9A66B",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  loginText: {
    color: "#2B2B2B",
    fontSize: 16,
    fontWeight: "bold",
  },
  newUserBtn: {
    color: "#C0392B",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
});
