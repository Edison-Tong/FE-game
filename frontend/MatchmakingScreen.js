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
export default function MatchmakingScreen() {
  const { user } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
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

  const startPolling = (roomId) => {
    pollingInterval.current = setInterval(async () => {
      const res = await fetch(`${BACKEND_URL}/room-status?roomId=${roomId}`);
      const data = await res.json();

      if (data.joiner_id) {
        clearInterval(pollingInterval.current);
        clearTimeout(waitingAnimation.current);
        setShowHostModal(false);

        // When hosting:
        navigation.navigate("BattleScreen", {
          roomId,
          hostId: data.host_id,
          joinerId: data.joiner_id,
          userId: user.id,
        });
      }
    }, 1500);
  };

  const startWaitingAnimation = () => {
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

        // When joining:
        navigation.navigate("BattleScreen", {
          roomId: data.roomId,
          hostId: data.hostId,
          joinerId: user.id,
          userId: user.id,
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
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Enter Room Code</Text>

              <TextInput
                value={joinCode}
                onChangeText={(text) => setJoinCode(text.toUpperCase())}
                placeholder="ABCD"
                placeholderTextColor="#777"
                style={styles.input}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={4}
                keyboardType="default"
              />

              <TouchableOpacity style={styles.buttons} onPress={joinMatch}>
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
    width: 300,
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
    width: "100%",
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
