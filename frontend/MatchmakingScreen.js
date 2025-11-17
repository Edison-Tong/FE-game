import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { BACKEND_URL } from "@env";
export default function MatchmakingScreen() {
  const { user } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);

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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {teams.map((team) => {
          console.log(team);
          return (
            <TouchableOpacity key={team.id} style={[styles.buttons, styles.team]}>
              <Text style={styles.buttonText}>{team.team_name}</Text>
            </TouchableOpacity>
          );
        })}

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
