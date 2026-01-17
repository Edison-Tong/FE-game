import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useEffect, useState, useRef } from "react";
import { BACKEND_URL } from "@env";

export default function BattleScreen() {
  const route = useRoute();
  const { userId, roomId } = route.params || {};
  const [currentTurnUserId, setCurrentTurnUserId] = useState(null);
  const [isEndingTurn, setIsEndingTurn] = useState(false);
  const [teams, setTeams] = useState([]);
  const [attacked, setAttacked] = useState({});
  const [selectedAttackerId, setSelectedAttackerId] = useState(null);
  const [opponentOrder, setOpponentOrder] = useState({});
  const pollRef = useRef(null);

  const handleAttack = async (targetId) => {
    if (!selectedAttackerId) {
      Alert.alert("Select Attacker", "Please select a character to attack with.");
      return;
    }
    if (currentTurnUserId !== userId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/attack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, attackerId: selectedAttackerId, targetId, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.attacked) setAttacked(data.attacked);
        if (data.updatedTarget) {
          // update teams with the updated target character
          setTeams((prev) =>
            prev.map((t) => ({
              ...t,
              characters: t.characters.map((c) => (c.id === data.updatedTarget.id ? data.updatedTarget : c)),
            }))
          );
        }
        // clear selection after attack
        setSelectedAttackerId(null);
      } else {
        let msg = "Could not perform attack";
        try {
          const errJson = await res.json();
          if (errJson && errJson.message) msg = errJson.message;
        } catch (e) {}
        Alert.alert("Attack Failed", msg);
      }
    } catch (err) {
      console.log("attack error", err);
      Alert.alert("Network Error", "Could not contact server. Try again.");
    }
  };

  useEffect(() => {
    const fetchState = async () => {
      if (!roomId) return;
      try {
        const res = await fetch(`${BACKEND_URL}/battle-state?roomId=${roomId}`);
        if (!res.ok) return;
        const data = await res.json();
        setCurrentTurnUserId(data.currentTurnUserId || null);
        setAttacked(data.attacked || {});
        setTeams(data.teams || []);
        // preserve opponent ordering per-team so characters stay in the same slots
        try {
          const opponent = (data.teams || []).find((t) => String(t.user_id) !== String(userId));
          if (opponent) {
            const teamKey = String(opponent.id);
            setOpponentOrder((prev) => {
              const existing = prev[teamKey] || [];
              const idsNow = (opponent.characters || []).map((c) => c.id);
              // keep existing order, append any new ids at the end
              const merged = [...existing, ...idsNow.filter((id) => !existing.includes(id))];
              // also ensure merged only contains ids that currently exist (preserve slots for present chars)
              const filtered = merged.filter((id) => idsNow.includes(id));
              return { ...prev, [teamKey]: filtered };
            });
          }
        } catch (e) {
          // ignore ordering errors
        }
        // clear selection if that character just attacked
        if (selectedAttackerId && data.attacked && data.attacked[selectedAttackerId]) {
          setSelectedAttackerId(null);
        }
      } catch (err) {
        // ignore network errors here; MatchmakingScreen handles earlier checks
        console.log("BattleScreen: error fetching battle-state", err);
      }
    };

    fetchState();
    pollRef.current = setInterval(fetchState, 1500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roomId]);

  let turnText = "Waiting...";
  if (currentTurnUserId) {
    turnText = currentTurnUserId === userId ? "It is your turn" : "It is your opponent's turn";
  }

  return (
    <View style={styles.container}>
      <View style={styles.turnBanner}>
        <Text style={styles.turnText}>{turnText}</Text>
      </View>
      {/* Player's characters shown at top half when it's their turn */}
      {currentTurnUserId === userId && (
        <View style={styles.playerArea}>
          <Text style={styles.caption}>Select a character to attack with</Text>
          <View style={styles.charactersRow}>
            {(() => {
              const myTeam = teams.find((t) => String(t.user_id) === String(userId));
              if (!myTeam || !myTeam.characters) return <Text style={styles.noChars}>No characters</Text>;
              return myTeam.characters.map((c) => {
                const hasAttacked = attacked && attacked[c.id];
                const isSelected = selectedAttackerId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.charCard,
                      hasAttacked ? styles.charCardDisabled : null,
                      isSelected ? styles.charCardSelected : null,
                    ]}
                    disabled={hasAttacked}
                    onPress={() => {
                      if (hasAttacked) return;
                      setSelectedAttackerId(c.id);
                    }}
                  >
                    <Text style={styles.charName}>{c.name || `Char ${c.id}`}</Text>
                    <Text style={styles.charStat}>HP: {c.health}</Text>
                    <Text style={styles.charStat}>STR: {c.strength}</Text>
                  </TouchableOpacity>
                );
              });
            })()}
          </View>
        </View>
      )}

      {/* Opponent area at bottom half */}
      <View style={styles.opponentArea}>
        <Text style={styles.caption}>Select the character you are attacking</Text>
        <View style={styles.charactersRow}>
          {(() => {
            const opponentTeam = teams.find((t) => String(t.user_id) !== String(userId));
            if (!opponentTeam || !opponentTeam.characters) return <Text style={styles.noChars}>No opponent</Text>;
            // render opponent characters using preserved order if available
            const teamKey = String(opponentTeam.id);
            const order = opponentOrder[teamKey] || opponentTeam.characters.map((c) => c.id);
            const charsById = {};
            opponentTeam.characters.forEach((c) => (charsById[c.id] = c));
            const ordered = order.map((id) => charsById[id]).filter(Boolean);
            // append any characters not present in the stored order
            const missing = opponentTeam.characters.filter((c) => !order.includes(c.id));
            const finalList = [...ordered, ...missing];
            return finalList.map((c) => {
              const isDead = (c.health || 0) <= 0;
              const canBeTargeted = currentTurnUserId === userId && selectedAttackerId && !isDead;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.charCard}
                  disabled={!canBeTargeted}
                  onPress={() => {
                    if (!canBeTargeted) return;
                    handleAttack(c.id);
                  }}
                >
                  <Text style={styles.charName}>{c.name || `Char ${c.id}`}</Text>
                  <Text style={styles.charStat}>HP: {c.health}</Text>
                  <Text style={styles.charStat}>STR: {c.strength}</Text>
                  {isDead && <Text style={styles.charKO}>KO</Text>}
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      </View>
      <View style={styles.bottomSpacer} />

      <TouchableOpacity
        style={[styles.endTurnButton, currentTurnUserId !== userId ? styles.endTurnButtonDisabled : null]}
        activeOpacity={0.8}
        disabled={currentTurnUserId !== userId || isEndingTurn}
        onPress={() => {
          if (currentTurnUserId !== userId) return;
          Alert.alert(
            "End Turn",
            "Are you sure you want to end your turn?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Yes",
                onPress: async () => {
                  try {
                    setIsEndingTurn(true);
                    const res = await fetch(`${BACKEND_URL}/end-turn`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ roomId, userId }),
                    });
                    if (res.ok) {
                      // let the polling update the turn; optionally read returned state
                      try {
                        const data = await res.json();
                        if (data && data.currentTurnUserId) setCurrentTurnUserId(data.currentTurnUserId);
                      } catch (err) {
                        // ignore JSON parse errors
                      }
                    } else {
                      let msg = "Could not end turn. Try again.";
                      try {
                        const errJson = await res.json();
                        if (errJson && errJson.message) msg = errJson.message;
                      } catch (e) {}
                      console.log("end-turn: server returned", res.status, msg);
                      Alert.alert("Error", msg);
                    }
                  } catch (err) {
                    console.log("end-turn error", err);
                    Alert.alert("Network Error", "Could not contact server. Try again.");
                  } finally {
                    setIsEndingTurn(false);
                  }
                },
              },
            ],
            { cancelable: true }
          );
        }}
      >
        {isEndingTurn ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.endTurnText}>{currentTurnUserId === userId ? "End Turn" : "Waiting..."}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "flex-start",
    backgroundColor: "#2B2B2B",
    paddingTop: 56,
  },
  turnBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    paddingVertical: 10,
    backgroundColor: "#3C3C3C",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#272727",
    zIndex: 20,
  },
  turnText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 80,
  },
  endTurnButton: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 24,
    height: 56,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
  endTurnButtonDisabled: {
    backgroundColor: "#888888",
  },
  endTurnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  playerArea: {
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 12,
    alignItems: "center",
  },
  caption: {
    color: "#DDD",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
    textAlign: "center",
  },
  charactersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  charCard: {
    width: 110,
    minHeight: 80,
    backgroundColor: "#444",
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  charCardDisabled: {
    backgroundColor: "#2F2F2F",
    opacity: 0.5,
  },
  charCardSelected: {
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  charName: {
    color: "#FFF",
    fontWeight: "700",
    marginBottom: 6,
  },
  charStat: {
    color: "#CCC",
    fontSize: 12,
  },
  noChars: {
    color: "#999",
  },
  charKO: {
    color: "#FF6666",
    fontWeight: "700",
    marginTop: 4,
  },
  opponentArea: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 96,
    alignItems: "center",
    paddingBottom: 8,
  },
});
