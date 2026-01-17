import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "./AuthContext";
import { BACKEND_URL } from "@env";

/* Removed hardcoded test opponent team; BattleScreen now relies on server-provided teams */

export default function BattleScreen() {
  const route = useRoute();
  const { hostId, joinerId, userId, roomId, hostBattleTeamId, battleTeamId, joinerBattleTeamId } = route.params;
  const [myTeam, setMyTeam] = useState([]);
  const [myTeamName, setMyTeamName] = useState("My Team");
  const [opponentTeam, setOpponentTeam] = useState([]);
  const [opponentTeamName, setOpponentTeamName] = useState("Opponent Team");
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const isHost = userId === hostId;
  const myName = isHost ? "You (Host)" : "You (Joiner)";
  const opponentName = isHost ? "Opponent" : "Host";
  const [myReady, setMyReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);
  const [currentTurnUserId, setCurrentTurnUserId] = useState(null);
  const [attackedMap, setAttackedMap] = useState({});
  const [selectedAttacker, setSelectedAttacker] = useState(null);
  const navigation = useNavigation();
  const roomMissingHandled = useRef(false);
  const myBattleTeamIdRef = useRef(null);
  const oppBattleTeamIdRef = useRef(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Prefer any explicit battle team IDs passed in params (these are duplicated teams)
        // Determine current player's battle team id
        let myBattleTeamId = null;
        let opponentBattleTeamId = null;

        if (isHost) {
          myBattleTeamId = hostBattleTeamId || null;
          opponentBattleTeamId = joinerBattleTeamId || null;
        } else {
          myBattleTeamId = battleTeamId || null; // joiner passed 'battleTeamId' param
          opponentBattleTeamId = hostBattleTeamId || null;
        }

        // If we have the team ids, fetch characters directly
        myBattleTeamIdRef.current = myBattleTeamId;
        oppBattleTeamIdRef.current = opponentBattleTeamId;

        if (myBattleTeamId) {
          const myCharsRes = await fetch(`${BACKEND_URL}/get-characters?teamId=${myBattleTeamId}`);
          const myCharsData = await myCharsRes.json();
          setMyTeam(myCharsData.characters);
          // Try to set a friendly name if available
          // (backend duplicate returns team_name when duplicating; navigation params may include it later)
        }

        if (opponentBattleTeamId) {
          const oppRes = await fetch(`${BACKEND_URL}/get-characters?teamId=${opponentBattleTeamId}`);
          const oppData = await oppRes.json();
          setOpponentTeam(oppData.characters);
        }

        // If we still don't have both teams, but have a roomId, fetch all battle teams for the room
        if ((!myBattleTeamId || !opponentBattleTeamId) && roomId) {
          const roomRes = await fetch(`${BACKEND_URL}/get-battle-teams?roomId=${roomId}`);
          const roomData = await roomRes.json();
          if (roomData.teams && roomData.teams.length > 0) {
            // Find teams by user_id matching host/joiner
            for (const t of roomData.teams) {
              if (t.user_id === userId) {
                setMyTeam(t.characters);
                setMyTeamName(t.team_name || myTeamName);
              } else {
                setOpponentTeam(t.characters);
                setOpponentTeamName(t.team_name || opponentTeamName);
              }
            }
          }
        }

        // No test fallback — rely on server data only
      } catch (err) {
        console.log("Error fetching battle data:", err);
      }
    };

    fetchTeams();

    // Fetch ready state once immediately
    const fetchReady = async () => {
      if (!roomId) return;
      try {
        const res = await fetch(`${BACKEND_URL}/room-ready?roomId=${roomId}`);
        if (!res.ok) return;
        const data = await res.json();
        const state = data.ready || { host_ready: false, joiner_ready: false };
        setMyReady(isHost ? state.host_ready : state.joiner_ready);
        setOpponentReady(isHost ? state.joiner_ready : state.host_ready);
      } catch (err) {
        console.log("Error fetching ready state:", err);
      }
    };
    fetchReady();

    // If both ready, attempt to start battle (server will validate readiness)
    const tryStartBattle = async () => {
      if (!roomId) return;
      if (!myReady || !opponentReady) return;
      if (battleStarted) return;
      try {
        const res = await fetch(`${BACKEND_URL}/start-battle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });
        if (res.ok) {
          const json = await res.json();
          setBattleStarted(true);
          setCurrentTurnUserId(json.currentTurnUserId);
          // fetch full battle state immediately
          fetchBattleState();
        }
      } catch (err) {
        console.log("Error starting battle:", err);
      }
    };
    tryStartBattle();

    // Poll for teams if one or both are missing (handles race where duplication finishes after navigation)
    let teamsPoll = null;
    if (roomId) {
      teamsPoll = setInterval(async () => {
        try {
          if (myTeam.length > 0 && opponentTeam.length > 0) {
            clearInterval(teamsPoll);
            return;
          }

          const roomRes = await fetch(`${BACKEND_URL}/get-battle-teams?roomId=${roomId}`);
          if (!roomRes.ok) return;
          const roomData = await roomRes.json();
          if (roomData.teams && roomData.teams.length > 0) {
            for (const t of roomData.teams) {
              if (t.user_id === userId) {
                if (!myTeam.length) setMyTeam(t.characters);
                if (t.team_name) setMyTeamName(t.team_name);
              } else {
                if (!opponentTeam.length) setOpponentTeam(t.characters);
                if (t.team_name) setOpponentTeamName(t.team_name);
              }
            }
            if (myTeam.length > 0 && opponentTeam.length > 0) {
              clearInterval(teamsPoll);
            }
          }
        } catch (err) {
          console.log("Error polling battle teams:", err);
        }
      }, 1500);
    }

    // Poll room status to detect if the room gets deleted (other player left)
    let poll = null;
    if (roomId) {
      poll = setInterval(async () => {
        try {
          // Primary check: room status
          const res = await fetch(`${BACKEND_URL}/room-status?roomId=${roomId}`);
          if (res.status === 404) {
            if (!roomMissingHandled.current) {
              roomMissingHandled.current = true;
              Alert.alert("Room closed", "The other player left the room.", [
                {
                  text: "OK",
                  onPress: () => navigation.pop(1),
                },
              ]);
            }
            return;
          }

          // Secondary check: if opponent's duplicated team was removed, treat room as closed
          const oppId = oppBattleTeamIdRef.current;
          if (oppId) {
            try {
              const cRes = await fetch(`${BACKEND_URL}/get-characters?teamId=${oppId}`);
              if (!cRes.ok) {
                if (!roomMissingHandled.current) {
                  roomMissingHandled.current = true;
                  Alert.alert("Room closed", "The other player left the room.", [
                    { text: "OK", onPress: () => navigation.pop(1) },
                  ]);
                }
                return;
              }
              const cJson = await cRes.json();
              if (!cJson.characters || cJson.characters.length === 0) {
                if (!roomMissingHandled.current) {
                  roomMissingHandled.current = true;
                  Alert.alert("Room closed", "The other player left the room.", [
                    { text: "OK", onPress: () => navigation.pop(1) },
                  ]);
                }
                return;
              }
            } catch (err) {
              console.log("Error checking opponent team:", err);
            }
          }

          // also poll ready state and battle state (if started)
          try {
            const rres = await fetch(`${BACKEND_URL}/room-ready?roomId=${roomId}`);
            if (rres.ok) {
              const rjson = await rres.json();
              const state = rjson.ready || { host_ready: false, joiner_ready: false };
              setMyReady(isHost ? state.host_ready : state.joiner_ready);
              setOpponentReady(isHost ? state.joiner_ready : state.host_ready);

              // If both players ready and battle hasn't started yet, request start
              if (state.host_ready && state.joiner_ready && !battleStarted) {
                try {
                  const sres = await fetch(`${BACKEND_URL}/start-battle`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomId }),
                  });
                  if (sres.ok) {
                    const sj = await sres.json();
                    setBattleStarted(true);
                    setCurrentTurnUserId(sj.currentTurnUserId);
                    await fetchBattleState();
                  }
                } catch (err) {
                  console.log("Error starting battle from poll:", err);
                }
              }
            }
          } catch (err) {
            // ignore
          }

          // If battle started, refresh battle state
          try {
            if (battleStarted) {
              await fetchBattleState();
            }
          } catch (err) {
            // ignore
          }
        } catch (err) {
          console.log("Error polling room status:", err);
        }
      }, 1500);
    }

    return () => {
      if (poll) clearInterval(poll);
    };
  }, [hostId, roomId, userId, hostBattleTeamId, battleTeamId, joinerBattleTeamId]);

  const fetchBattleState = async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/battle-state?roomId=${roomId}`);
      if (!res.ok) return;
      const data = await res.json();
      setCurrentTurnUserId(data.currentTurnUserId);
      setAttackedMap(data.attacked || {});
      // update teams from server state
      if (data.teams && data.teams.length > 0) {
        for (const t of data.teams) {
          if (t.user_id === userId) {
            setMyTeam(t.characters);
            if (t.team_name) setMyTeamName(t.team_name);
          } else {
            setOpponentTeam(t.characters);
            if (t.team_name) setOpponentTeamName(t.team_name);
          }
        }
      }
    } catch (err) {
      console.log("Error fetching battle state:", err);
    }
  };

  const CompactCharacter = ({ character, onPress }) => {
    const typeColor = character.type && character.type.toLowerCase() === "mage" ? "#9D4EDD" : "#FF0000";
    return (
      <TouchableOpacity style={[styles.compactCard, { borderLeftColor: typeColor }]} onPress={onPress}>
        <View style={styles.cardHeader}>
          <Text style={styles.charNameCompact}>{character.name}</Text>
          <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
        </View>
        <Text style={styles.charTypeCompact}>{character.type}</Text>
        <Text style={styles.hpCompact}>HP: {character.health}</Text>
      </TouchableOpacity>
    );
  };

  const DetailedStats = ({ character }) => {
    if (!character) return null;
    return (
      <View style={styles.statsContainerNoScroll}>
        <Text style={styles.detailName}>{character.name}</Text>
        <Text style={styles.detailLabel}>
          {character.label} • {character.type}
        </Text>
        <Text style={{ color: "#fff", marginTop: 8 }}>HP: {character.health}</Text>
        <Text style={{ color: "#C9A66B", marginTop: 6 }}>
          STR: {character.strength} DEF: {character.defense}
        </Text>
        <Text style={{ color: "#C9A66B" }}>
          MAG: {character.magick} RES: {character.resistance}
        </Text>
        <Text style={{ color: "#C9A66B" }}>
          SPD: {character.speed} SKL: {character.skill}
        </Text>
        <Text style={{ color: "#C9A66B" }}>
          KNL: {character.knowledge} LCK: {character.luck}
        </Text>
        <Text style={{ color: "#fff", marginTop: 8 }}>Weapon: {character.base_weapon}</Text>
      </View>
    );
  };

  const attackTarget = async (attackerId, targetId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/attack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, attackerId, targetId, userId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        Alert.alert("Attack failed", json.message || "Could not perform attack");
        return;
      }
      const json = await res.json();
      setAttackedMap(json.attacked || {});
      setSelectedAttacker(null);
      // refresh teams / characters
      await fetchBattleState();
    } catch (err) {
      console.log("Error performing attack:", err);
    }
  };

  const onOppCharPress = (char) => {
    // If we have an attacker selected and it's our turn, attack this target
    if (battleStarted && currentTurnUserId === userId && selectedAttacker) {
      attackTarget(selectedAttacker.id, char.id);
      return;
    }

    // otherwise show details
    setSelectedCharacter(char);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.teamSection}>
          <Text style={styles.title}>{myName}</Text>
          <Text style={styles.teamCount}>{myTeam ? myTeam.length : 0} characters</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.teamSection}>
          <Text style={styles.title}>{opponentName}</Text>
          <Text style={styles.teamCount}>{opponentTeam ? opponentTeam.length : 0} characters</Text>
        </View>
      </View>

      <ScrollView style={styles.teamsContainer} scrollEnabled={true} horizontal={false}>
        <View style={styles.teamsWrapper}>
          <View style={styles.teamColumn}>
            <Text style={styles.sectionTitle}>{myTeamName}</Text>
            {myTeam &&
              myTeam.map((char) => (
                <CompactCharacter key={char.id} character={char} onPress={() => onMyCharPress(char)} />
              ))}
            <View style={styles.readyRow}>
              <TouchableOpacity
                style={[styles.readyButton, myReady ? styles.readyOn : styles.readyOff]}
                onPress={async () => {
                  try {
                    const res = await fetch(`${BACKEND_URL}/set-ready`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ roomId, userId, ready: !myReady }),
                    });
                    if (res.ok) {
                      setMyReady(!myReady);
                    }
                  } catch (err) {
                    console.log("Error setting ready:", err);
                  }
                }}
              >
                <Text style={styles.readyText}>{myReady ? "Unready" : "Ready"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.teamColumn}>
            <Text style={styles.sectionTitle}>{opponentTeamName}</Text>
            {opponentTeam &&
              opponentTeam.map((char) => (
                <CompactCharacter key={char.id} character={char} onPress={() => onOppCharPress(char)} />
              ))}
            <View style={styles.readyRow}>
              <Text style={[styles.opponentReadyText, opponentReady ? styles.readyOnText : null]}>
                {opponentReady ? "Ready" : "Waiting"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={selectedCharacter !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCharacter(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedCharacter(null)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            {selectedCharacter && <DetailedStats character={selectedCharacter} />}

            <TouchableOpacity style={styles.closeModal} onPress={() => setSelectedCharacter(null)}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
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
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    padding: 15,
    justifyContent: "space-around",
    alignItems: "center",
  },
  teamSection: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 2,
    height: 50,
    backgroundColor: "#C9A66B",
    marginHorizontal: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 4,
  },
  teamCount: {
    fontSize: 12,
    color: "#AAA",
  },
  teamsContainer: {
    flex: 1,
    padding: 10,
  },
  teamsWrapper: {
    flexDirection: "row",
  },
  teamColumn: {
    flex: 1,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C9A66B",
    marginBottom: 10,
    textAlign: "center",
    minHeight: 40,
    justifyContent: "center",
  },
  compactCard: {
    backgroundColor: "#3C3C3C",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#C9A66B",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  charNameCompact: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFD700",
    flex: 1,
  },
  charTypeCompact: {
    fontSize: 12,
    color: "#AAA",
    marginTop: 2,
  },
  hpCompact: {
    fontSize: 12,
    color: "#fff",
    marginTop: 4,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#2B2B2B",
    borderRadius: 12,
    padding: 15,
    maxHeight: "62%", // was 50%
    maxWidth: "80%",
    borderWidth: 2,
    borderColor: "#C9A66B",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeText: {
    fontSize: 20,
    color: "#FFD700",
    fontWeight: "bold",
  },
  statsContainer: {
    marginTop: 5,
    maxHeight: "70%",
  },
  detailName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: "#C9A66B",
    marginBottom: 12,
  },
  hpBarContainer: {
    marginBottom: 12,
  },
  hpBarLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  hpBarTitle: {
    fontSize: 11,
    color: "#C9A66B",
    fontWeight: "600",
  },
  hpBarSideLabel: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
    width: 24,
    textAlign: "center",
  },
  hpBarBackground: {
    height: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#444",
    position: "relative",
  },
  hpBarFill: {
    height: "100%",
    backgroundColor: "#00FF00",
  },
  ticksContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    paddingHorizontal: 0,
  },
  tick: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    marginHorizontal: 0.5,
  },
  statsListContainer: {
    marginBottom: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 4,
  },
  statLabelList: {
    fontSize: 11,
    color: "#C9A66B",
    fontWeight: "600",
    width: "25%",
  },
  statValueList: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    width: "25%",
  },
  weaponSection: {
    backgroundColor: "#3C3C3C",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  weaponTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 4,
  },
  abilityText: {
    fontSize: 10,
    color: "#C9A66B",
    marginBottom: 2,
  },
  miscSection: {
    backgroundColor: "#3C3C3C",
    padding: 8,
    borderRadius: 6,
  },
  miscText: {
    fontSize: 10,
    color: "#fff",
  },
  closeModal: {
    backgroundColor: "#C9A66B",
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
  },
  closeModalText: {
    color: "#2B2B2B",
    fontWeight: "bold",
    fontSize: 12,
  },
  statsContainerNoScroll: {
    marginTop: 2,
    maxHeight: 280,
    minWidth: 220,
    justifyContent: "flex-start",
  },
  readyRow: {
    marginTop: 10,
    alignItems: "center",
  },
  readyButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C9A66B",
  },
  readyOn: {
    backgroundColor: "#2ECC71",
  },
  readyOff: {
    backgroundColor: "#444",
  },
  readyText: {
    color: "#fff",
    fontWeight: "700",
  },
  opponentReadyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ddd",
  },
  readyOnText: {
    color: "#2ECC71",
  },
});
