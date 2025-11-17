import { StyleSheet, Text, View, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from "react-native";
import React, { useState, useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "./AuthContext";
import { BACKEND_URL } from "@env";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigation = useNavigation();
  const { setUser } = useContext(AuthContext);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (username === "" || password === "") {
      alert("Please enter both username and password");
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.id) {
        setUser({ id: data.id, username: data.username });
        navigation.navigate("HomeScreen");
      } else {
        alert("Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong", err);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Create a user</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#AFAFAF"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#AFAFAF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor="#AFAFAF"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerText}>Create new user</Text>
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
    paddingHorizontal: 20,
  },
  input: {
    width: "100%",
    backgroundColor: "#3C3C3C",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
    color: "#F5F5F5",
  },
  registerButton: {
    backgroundColor: "#C9A66B",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  registerText: {
    color: "#2B2B2B",
    fontSize: 16,
    fontWeight: "bold",
  },
});
