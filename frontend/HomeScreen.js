import React, { useContext, useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "./AuthContext";
import { BACKEND_URL } from "@env";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  const [visible, setVisible] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/get-teams?userId=` + user.id);
        const data = await res.json();
        setTeams(data.teams); // Example: [{ id:1, team_name:"Sharks" }, { id:2, team_name:"Dragons"}]
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    };

    fetchTeams();
  }, [teamName]);

  const handleCreateTeam = () => {
    setVisible(true); // open modal
  };

  const handleCreate = async () => {
    if (!teamName.trim()) {
      alert("Please enter a team name");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/create-team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamName, userId: user.id }),
      });

      const data = await res.json();
      if (data.message === "Team created successfully") {
        alert(`Team "${teamName}" created successfully!`);
        setVisible(false);
        setTeamName("");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
      alert(error);
    }
  };

  const handleClose = () => {
    setTeamName("");
    setVisible(false);
  };

  const goToTeam = async (teamId) => {
    navigation.navigate("TeamViewScreen", { teamId });
  };

  return (
    <View style={styles.container}>
      {teams.map((team) => (
        <TouchableOpacity key={team.id} style={styles.teamBtn} onPress={() => goToTeam(team.id)}>
          <Text style={styles.buttonText}>{team.team_name}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.newTeamBtn} onPress={handleCreateTeam}>
        <Text style={styles.buttonText}>Create a new team</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Create a New Team</Text>
            <TextInput style={styles.input} placeholder="Enter team name" value={teamName} onChangeText={setTeamName} />
            <Button title="Create Team" onPress={handleCreate} />
            <Button title="Cancel" onPress={handleClose} color="red" />
          </View>
        </View>
      </Modal>
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
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
});
