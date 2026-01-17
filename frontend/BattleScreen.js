import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function BattleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Battle Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2B2B2B",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
});
