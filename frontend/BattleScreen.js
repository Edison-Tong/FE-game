import { View, Text, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { BACKEND_URL } from "@env";

export default function BattleScreen() {
  const route = useRoute();
  const { hostId, joinerId, userId } = route.params;
  const [opponentName, setOpponentName] = useState("");
  const isHost = userId === hostId;
  const myName = isHost ? "You (Host)" : "You (Joiner)";
  const opponentId = isHost ? joinerId : hostId;

  useEffect(() => {
    const fetchOpponent = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/get-user?userId=${opponentId}`);
        const data = await res.json();
        setOpponentName(data.username);
      } catch (err) {
        console.log("Error fetching opponent:", err);
        setOpponentName("Unknown");
      }
    };

    fetchOpponent();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{myName}</Text>
      <Text style={styles.subtitle}>Opponent: {opponentName}</Text>
      <Text style={styles.info}>Battle logic will go here...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 20,
  },
});
