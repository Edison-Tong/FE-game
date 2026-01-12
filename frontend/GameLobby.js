import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "./AuthContext";
import { BACKEND_URL } from "@env";
export default function GameLobby() {
  const { user } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [previewTeam, setPreviewTeam] = useState(null);
  const [previewChars, setPreviewChars] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });

  const [canPress, setCanPress] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [showHostModal, setShowHostModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const waitingAnimation = useRef(null);
  const leftSword = useRef(new Animated.Value(-20)).current;
  const rightSword = useRef(new Animated.Value(20)).current;
  const clashShake = useRef(new Animated.Value(0)).current;

  let pollingInterval = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (roomId) {
        cancelRoom();
      }
    });

    return unsubscribe;
  }, [navigation, roomId]);

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

  const handleLongPress = async (team, event) => {
    try {
      const res = await fetch(`${BACKEND_URL}/get-characters?teamId=${team.id}`);
      const data = await res.json();
      const { pageX, pageY } = event.nativeEvent;

      setPreviewPos({
        x: pageX,
        y: pageY,
      });

      setPreviewTeam(team);
      setPreviewChars(data.characters);
      setShowPreview(true);
    } catch (err) {
      console.log("Preview error:", err);
    }
  };

  const handleRelease = () => {
    setShowPreview(false);
    setPreviewTeam(null);
    setPreviewChars([]);
  };

  const hostMatch = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/create-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, teamId: selectedTeam }),
      });

      const data = await res.json();

      setRoomId(data.roomId);
      setRoomCode(data.code);
      setShowHostModal(true);
      startWaitingAnimation();

      startPolling(data.roomId);
    } catch (err) {
      alert("Error hosting match");
      console.log(err);
    }
  };

  // Helper to duplicate a team for battle
  const duplicateTeamForBattle = async (teamId) => {
    const res = await fetch(`${BACKEND_URL}/duplicate-team-for-battle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, userId: user.id }),
    });
    const data = await res.json();
    return data.newTeamId;
  };

  const startPolling = (roomId) => {
    pollingInterval.current = setInterval(async () => {
      const res = await fetch(`${BACKEND_URL}/room-status?roomId=${roomId}`);
      const data = await res.json();

      if (data.joiner_id) {
        clearInterval(pollingInterval.current);
        clearTimeout(waitingAnimation.current);
        setShowHostModal(false);

        // Duplicate host team for battle (host's selectedTeam)
        const hostBattleTeamId = await duplicateTeamForBattle(selectedTeam);
        // Duplicate joiner team for battle (joiner's teamId should be fetched or passed)
        // If you have joiner's teamId, use it here. Otherwise, you may need to request it from backend or pass it from joiner.
        // For now, we'll assume joiner teamId is not available, so pass null or handle accordingly.
        // const joinerBattleTeamId = await duplicateTeamForBattle(joinerTeamId);

        navigation.navigate("BattleScreen", {
          roomId,
          hostId: data.host_id,
          joinerId: data.joiner_id,
          userId: user.id,
          hostBattleTeamId,
          // joinerBattleTeamId, // Uncomment and set if available
        });
      }
    }, 1500);
  };

  const startWaitingAnimation = () => {
    Animated.parallel([leftSword.stopAnimation(), rightSword.stopAnimation(), clashShake.stopAnimation()]);
    clearTimeout(waitingAnimation.current);

    const clash = () => {
      leftSword.setValue(-20);
      rightSword.setValue(20);
      clashShake.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(leftSword, {
            toValue: 30,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(rightSword, {
            toValue: -30,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),

        // CLASH SHAKE
        Animated.sequence([
          Animated.timing(clashShake, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(clashShake, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(clashShake, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]),

        // Reset
        Animated.parallel([
          Animated.timing(leftSword, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(rightSword, {
            toValue: 20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        waitingAnimation.current = setTimeout(clash, 500);
      });
    };

    clash();
  };

  const cancelRoom = async () => {
    try {
      await fetch(`${BACKEND_URL}/delete-room`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      clearInterval(pollingInterval.current);
      clearTimeout(waitingAnimation.current);
      setShowHostModal(false);
      setRoomId(null);
      setRoomCode("");
    } catch (err) {
      alert("Error canceling room");
      console.log(err);
    }
  };

  const joinMatch = async () => {
    if (!joinCode || joinCode.length < 4) {
      alert("Enter a valid room code");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/join-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          code: joinCode,
        }),
      });

      const data = await res.json();

      if (data.message === "Joined room") {
        setShowJoinModal(false);
        setJoinCode("");

        // Duplicate the selected team for battle
        const battleTeamId = await duplicateTeamForBattle(selectedTeam);

        navigation.navigate("BattleScreen", {
          roomId: data.roomId,
          hostId: data.hostId,
          joinerId: user.id,
          userId: user.id,
          battleTeamId,
        });
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Error joining room");
    }
  };

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
                  onLongPress={(e) => handleLongPress(team, e)}
                  onPressOut={() => handleRelease()}
                  delayLongPress={300}
                  style={[styles.buttons, selectedTeam === team.id ? styles.selectedTeam : styles.team]}
                >
                  <Text style={styles.buttonText}>{team.team_name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          onPress={hostMatch}
          style={[styles.buttons, !canPress && styles.disabledButton]}
          disabled={!canPress}
        >
          <Text style={styles.buttonText}>Host</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowJoinModal(true)}
          style={[styles.buttons, !canPress && styles.disabledButton]}
          disabled={!canPress}
        >
          <Text style={styles.buttonText}>Join</Text>
        </TouchableOpacity>
        {showHostModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Share This Code</Text>
              <Text style={styles.roomCode}>{roomCode}</Text>
              <Animated.View style={[styles.swordContainer, { transform: [{ translateX: clashShake }] }]}>
                <Animated.Text
                  style={[
                    styles.sword,
                    {
                      transform: [{ translateX: leftSword }, { rotate: "-180deg" }],
                    },
                  ]}
                >
                  🗡️
                </Animated.Text>

                <Animated.Text
                  style={[
                    styles.sword,
                    {
                      transform: [{ translateX: rightSword }, { rotate: "90deg" }],
                    },
                  ]}
                >
                  🗡️
                </Animated.Text>
              </Animated.View>

              <Text style={styles.waitingText}>Waiting for other player</Text>

              <TouchableOpacity style={styles.cancelButton} onPress={cancelRoom}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {showJoinModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.joinModal}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Enter Room Code</Text>
                <TextInput
                  style={styles.input}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  placeholder="Room Code"
                  placeholderTextColor="#777"
                  autoCapitalize="characters"
                  maxLength={6}
                  autoCorrect={false}
                  spellCheck={false}
                />
                <TouchableOpacity onPress={joinMatch} style={styles.buttons}>
                  <Text style={styles.buttonText}>Join Match</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { marginTop: 10 }]}
                  onPress={() => {
                    setShowJoinModal(false);
                    setJoinCode("");
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        {showPreview && previewTeam && (
          <View
            style={[
              styles.previewPopup,
              {
                position: "absolute",
                left: previewPos.x - 120,
                top: previewPos.y - 350,
              },
            ]}
          >
            {previewChars.map((char) => (
              <Text key={char.id} style={{ color: "#D4B36C", marginVertical: 4 }}>
                {char.name} — {char.base_weapon}
              </Text>
            ))}

            <Text style={{ color: "#777", marginTop: 15 }}>(Release to close)</Text>
          </View>
        )}
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
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    width: "80%",
    padding: 25,
    backgroundColor: "#2B2B2B",
    borderRadius: 20,
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 15,
    fontWeight: "bold",
  },
  previewPopup: {
    display: "flex",
    width: 240,
    padding: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4B36C",
    zIndex: 9999,
    elevation: 10,
  },

  roomCode: {
    color: "#D4B36C",
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 25,
  },
  cancelButton: {
    backgroundColor: "#C94A4A",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  cancelText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  swordContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    height: 60,
  },
  sword: {
    fontSize: 40,
    marginHorizontal: 10,
  },
  input: {
    width: 160, // fixed width for consistent size
    borderWidth: 1,
    borderColor: "#D4B36C",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 3,
  },
});
