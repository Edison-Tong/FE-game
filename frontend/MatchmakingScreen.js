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
    setSelectedTeam(teamId);
    setCanPress(true);
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {teams.length === 0 ? (
          <View>
            <Text style={styles.infoText}>
              You have no finished teams available. A team must have 6 characters to be used.
            </Text>
          </View>
        ) : (
          <View style={styles.teamListContainer}>
            <Text style={styles.infoText}>Select the team you want to battle with.</Text>
            {teams.map((team) => {
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
          </View>
        )}

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
    backgroundColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  team: {
    backgroundColor: "#C9A66B",
    width: 300,
    paddingVertical: 18,
    borderRadius: 50,
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTeam: {
    backgroundColor: "#D4B36C",
    width: 300,
    paddingVertical: 18,
    borderRadius: 50,
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D4B36C",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 10,
  },
  buttons: {
    width: 300,
    paddingVertical: 18,
    borderRadius: 50,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A5A7A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    color: "#2B2B2B",
    fontSize: 16,
    textAlign: "center",
    width: "80%",
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#5A2A2A",
    shadowOpacity: 0.15,
  },
  infoText: {
    color: "#c0ad00ff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    fontWeight: "500",
  },

  teamListContainer: {
    alignItems: "center",
  },
});
