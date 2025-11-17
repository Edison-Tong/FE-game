import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { BACKEND_URL } from "@env";
export default function MatchmakingScreen() {
  const { user } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [canPress, setCanPress] = useState(false);

  useEffect(() => {
    const fetchFinishedTeams = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/get-finished-teams?userId=` + user.id);
        const data = await res.json();
        setTeams(data.teams);
      } catch (err) {
        alert(err);
      }
    };
    fetchFinishedTeams();
  }, []);

  function chooseATeam(teamId) {
    console.log("TEST");
    setSelectedTeam(teamId);
    setCanPress(true);
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {teams.map((team) => {
          console.log(team);
          return (
            <TouchableOpacity
              key={team.id}
              onPress={() => chooseATeam(team.id)}
              style={[styles.buttons, selectedTeam === team.id ? styles.selectedTeam : styles.team]}
            >
              <Text style={styles.buttonText}>{team.team_name}</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={[styles.buttons, !canPress && styles.disabledButton]} disabled={!canPress}>
          <Text style={styles.buttonText}>Host</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.buttons, !canPress && styles.disabledButton]} disabled={!canPress}>
          <Text style={styles.buttonText}>Join</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5", // light neutral background
    alignItems: "center",
    justifyContent: "center",
  },
  team: {
    backgroundColor: "#4caf50", // nice green for unselected team
  },
  selectedTeam: {
    backgroundColor: "#ff9800", // bright orange to stand out
  },
  buttons: {
    width: 300,
    paddingVertical: 20,
    borderRadius: 50,
    margin: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000", // subtle shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    backgroundColor: "#2196f3", // bright blue when enabled
  },
  buttonText: {
    color: "#fff", // white text on colored buttons
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  disabledButton: {
    backgroundColor: "#9e9e9e", // muted gray for disabled
  },
});
