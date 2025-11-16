import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useState } from "react";

export default function MatchmakingScreen() {
  const [selectedTeam, setSelectedTeam] = useState(null);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <TouchableOpacity style={[styles.buttons, styles.team]}>
          <Text style={styles.buttonText}>Team 1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.buttons, styles.team]}>
          <Text style={styles.buttonText}>Team 2</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.buttons, styles.team]}>
          <Text style={styles.buttonText}>Team 3</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttons}>
          <Text style={styles.buttonText}>Host</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttons}>
          <Text style={styles.buttonText}>Join</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "red",
    alignItems: "center",
    justifyContent: "center",
  },
  team: {
    backgroundColor: "grey",
  },
  selectedTeam: {},
  buttons: {
    backgroundColor: "blue",
    width: 300,
    paddingVertical: 20,
    borderRadius: 50,
    margin: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    width: "80%",
  },
});
