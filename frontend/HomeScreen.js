import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.teamBtn} onPress={() => console.log("test")}>
        <Text style={styles.buttonText}>Team 1</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.newTeamBtn} onPress={() => navigation.navigate("TeamViewScreen")}>
        <Text style={styles.buttonText}>Create a new team</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "red",
    alignItems: "center",
    justifyContent: "center",
  },
  teamBtn: {
    backgroundColor: "#007BFF",
    width: 300,
    paddingVertical: 20,
    borderRadius: 50,
    margin: 5,
    alignItems: "center",
  },
  newTeamBtn: {
    backgroundColor: "green",
    width: 300,
    paddingVertical: 20,
    borderRadius: 50,
    margin: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});
