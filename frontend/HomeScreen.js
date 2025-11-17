import React, { useContext, useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Button } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "./AuthContext";
import { BACKEND_URL } from "@env";

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  const [visible, setVisible] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchTeams = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/get-teams?userId=` + user.id);
          const data = await res.json();
          setTeams(data.teams);
        } catch (err) {
          console.error(err);
        }
      };

      fetchTeams();
    }, [])
  );

  const handleCreateTeam = () => {
    setVisible(true);
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
      {teams.map((team) => {
        return (
          <TouchableOpacity
            key={team.id}
            style={team.char_count === 6 ? styles.completeTeam : styles.teamBtn}
            onPress={() => goToTeam(team.id)}
          >
            <Text style={styles.buttonText}>{team.team_name}</Text>
            <Text style={styles.charCount}>{team.char_count}/6</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.newTeamBtn} onPress={handleCreateTeam}>
        <Text style={styles.buttonText}>Create a new team</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Create a New Team</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter team name"
              value={teamName}
              onChangeText={setTeamName}
              maxLength={20}
            />
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
    backgroundColor: "#2B2B2B",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  teamBtn: {
    backgroundColor: "#6B4C3C",
    width: 300,
    paddingVertical: 15,
    borderRadius: 50,
    margin: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  completeTeam: {
    backgroundColor: "#C9A66B",
    width: 300,
    paddingVertical: 15,
    borderRadius: 25,
    margin: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  charCount: {
    color: "#F5F5F5",
    position: "absolute",
    right: 10,
  },
  newTeamBtn: {
    backgroundColor: "#4A5A7A",
    width: 300,
    paddingVertical: 15,
    borderRadius: 25,
    margin: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#2B2B2B",
    fontSize: 16,
    textAlign: "center",
    width: "80%",
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(43, 43, 43, 0.85)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "#3C3C3C",
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: "center",
    color: "#C9A66B",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#AFAFAF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: "#2B2B2B",
    color: "#F5F5F5",
  },
  modalButton: {
    backgroundColor: "#C9A66B",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#2B2B2B",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#C0392B",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#F5F5F5",
    fontWeight: "bold",
    fontSize: 16,
  },
});
