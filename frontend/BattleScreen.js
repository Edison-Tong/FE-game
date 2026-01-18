import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useEffect, useState, useRef, useMemo } from "react";
import { BACKEND_URL } from "@env";
import { weaponsData } from "./WeaponsData";

export default function BattleScreen() {
  const route = useRoute();
  const { userId, roomId } = route.params || {};
  const [currentTurnUserId, setCurrentTurnUserId] = useState(null);
  const [isEndingTurn, setIsEndingTurn] = useState(false);
  const [teams, setTeams] = useState([]);
  const [attacked, setAttacked] = useState({});
  const [selectedAttackerId, setSelectedAttackerId] = useState(null);
  const [opponentOrder, setOpponentOrder] = useState({});
  const [initialHealths, setInitialHealths] = useState({});
  const [statModalVisible, setStatModalVisible] = useState(false);
  const [statModalChar, setStatModalChar] = useState(null);
  const [battleModalVisible, setBattleModalVisible] = useState(false);
  const [battleAttackerId, setBattleAttackerId] = useState(null);
  const [battleDefenderId, setBattleDefenderId] = useState(null);
  const [isPerformingAttack, setIsPerformingAttack] = useState(false);
  const pollRef = useRef(null);
  const battleModalAttackerRef = useRef(null);
  const battleModalDefenderRef = useRef(null);
  const statModalCharRef = useRef(null);
  // helper: weapon lookup
  const getWeaponStats = (character) => {
    try {
      const key = (character.base_weapon || "").toLowerCase();
      return (weaponsData.weapons && weaponsData.weapons[key] && weaponsData.weapons[key].stats) || {};
    } catch (e) {
      return {};
    }
  };

  // Consolidated stats computation: power, protection, and advanced stats
  const computeAllStats = (character) => {
    const weapon = getWeaponStats(character);
    const isMage = character.type && String(character.type).toLowerCase() === "mage";

    // Power
    const power = isMage
      ? (Number(character.magick) || 0) + (Number(weapon.mgk) || 0)
      : (Number(character.strength) || 0) + (Number(weapon.str) || 0);

    // Protection
    const prot = {
      melee: (Number(character.defense) || 0) + (Number(weapon.def) || 0),
      magic: (Number(character.resistance) || 0) + (Number(weapon.res) || 0),
    };

    // Advanced stats
    const spd = (Number(character.speed) || 0) + (Number(weapon.spd) || 0);
    const skl = (Number(character.skill) || 0) + (Number(weapon.skl) || 0);
    const knl = (Number(character.knowledge) || 0) + (Number(weapon.knl) || 0);
    const lck = (Number(character.luck) || 0) + (Number(weapon.lck) || 0);
    const def = (Number(character.defense) || 0) + (Number(weapon.def) || 0);
    const res = (Number(character.resistance) || 0) + (Number(weapon.res) || 0);

    return {
      power,
      protection: prot,
      agility: spd,
      accuracy: Math.ceil(0.5 * spd + 0.5 * skl + 1 * knl + 0.5 * lck),
      evasion: Math.ceil(0.5 * spd + 1 * skl + 0.5 * knl + 0.5 * lck),
      critical: Math.ceil(0.5 * spd + 0.5 * skl + 0.5 * knl + 1 * lck),
      block: def + res + lck,
    };
  };

  const computeAdvancedStats = (character) => {
    const weapon = getWeaponStats(character);
    const spd = (Number(character.speed) || 0) + (Number(weapon.spd) || 0);
    const skl = (Number(character.skill) || 0) + (Number(weapon.skl) || 0);
    const knl = (Number(character.knowledge) || 0) + (Number(weapon.knl) || 0);
    const lck = (Number(character.luck) || 0) + (Number(weapon.lck) || 0);
    const def = (Number(character.defense) || 0) + (Number(weapon.def) || 0);
    const res = (Number(character.resistance) || 0) + (Number(weapon.res) || 0);

    return {
      agility: spd,
      accuracy: Math.ceil(0.5 * spd + 0.5 * skl + 1 * knl + 0.5 * lck),
      evasion: Math.ceil(0.5 * spd + 1 * skl + 0.5 * knl + 0.5 * lck),
      critical: Math.ceil(0.5 * spd + 0.5 * skl + 0.5 * knl + 1 * lck),
      block: def + res + lck,
    };
  };

  const renderHealthBar = (character) => {
    const maxHealth =
      initialHealths && initialHealths[character.id] != null
        ? initialHealths[character.id]
        : character.max_health || character.maxHealth || 20;
    const health = Math.max(0, Number(character.health) || 0);
    const percent = Math.max(0, Math.min(1, health / maxHealth));
    const ticks = 10;
    const filledTicks = Math.round(percent * ticks);

    return (
      <View style={barStyles.hpBarContainer}>
        <View style={barStyles.hpBarBackground}>
          <View style={[barStyles.hpBarFill, { width: `${percent * 100}%` }]} />
          <View style={barStyles.ticksContainer} pointerEvents="none">
            {Array.from({ length: ticks }).map((_, i) => (
              <View key={i} style={[barStyles.tick, i < filledTicks ? { opacity: 0 } : { opacity: 0.4 }]} />
            ))}
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 4 }}>
          <Text style={{ color: "#fff", fontSize: 11 }}>{health}</Text>
          <Text style={{ color: "#aaa", fontSize: 11, marginLeft: 6 }}>/ {maxHealth}</Text>
        </View>
      </View>
    );
  };

  const getWeaponStatLabel = (key) => {
    const labels = {
      str: "Strength",
      mgk: "Magick",
      def: "Defense",
      res: "Resistance",
      spd: "Speed",
      skl: "Skill",
      knl: "Knowledge",
      lck: "Luck",
    };
    if (labels[key]) return labels[key];
    if (!key || typeof key !== "string") return String(key);
    // Capitalize only the first letter for unknown keys (e.g. "range" -> "Range")
    return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
  };

  const handleAttack = async (targetId, attackerId = null) => {
    const attacker = attackerId || selectedAttackerId;
    if (!attacker) {
      Alert.alert("Select Attacker", "Please select a character to attack with.");
      return;
    }
    if (currentTurnUserId !== userId) return;

    setIsPerformingAttack(true);
    try {
      const res = await fetch(`${BACKEND_URL}/attack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, attackerId: attacker, targetId, userId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.attacked) setAttacked(data.attacked);
        if (data.updatedTarget) {
          setTeams((prev) =>
            prev.map((t) => ({
              ...t,
              characters: t.characters.map((c) => (c.id === data.updatedTarget.id ? data.updatedTarget : c)),
            }))
          );
        }
        setSelectedAttackerId(null);
        setBattleAttackerId(null);
        setBattleDefenderId(null);
        setBattleModalVisible(false);
        battleModalAttackerRef.current = null;
        battleModalDefenderRef.current = null;
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
    } finally {
      setIsPerformingAttack(false);
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

        try {
          const allChars = (data.teams || []).flatMap((t) => t.characters || []);
          if (allChars && allChars.length) {
            setInitialHealths((prev) => {
              const next = { ...prev };
              for (const c of allChars) {
                if (next[c.id] == null) next[c.id] = Number(c.health) || 0;
              }
              return next;
            });
          }
        } catch (e) {}

        try {
          const opponent = (data.teams || []).find((t) => String(t.user_id) !== String(userId));
          if (opponent) {
            const teamKey = String(opponent.id);
            setOpponentOrder((prev) => {
              const existing = prev[teamKey] || [];
              const idsNow = (opponent.characters || []).map((c) => c.id);
              const merged = [...existing, ...idsNow.filter((id) => !existing.includes(id))];
              const filtered = merged.filter((id) => idsNow.includes(id));
              return { ...prev, [teamKey]: filtered };
            });
          }
        } catch (e) {}

        if (selectedAttackerId && data.attacked && data.attacked[selectedAttackerId]) setSelectedAttackerId(null);
      } catch (err) {
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
  if (currentTurnUserId) turnText = currentTurnUserId === userId ? "It is your turn" : "It is your opponent's turn";

  const openStatModal = (char) => {
    statModalCharRef.current = char;
    setStatModalChar(char);
    setStatModalVisible(true);
  };
  const closeStatModal = () => {
    setStatModalVisible(false);
    setStatModalChar(null);
    statModalCharRef.current = null;
  };

  if (currentTurnUserId) {
    turnText = currentTurnUserId === userId ? "It is your turn" : "It is your opponent's turn";
  }

  // Local modal components so they can access computeAllStats, computeAdvancedStats, renderHealthBar
  const LocalStatModal = ({ visible, character, onClose }) => {
    if (!character) return null;
    const weapon = ((weaponsData.weapons || {})[(character.base_weapon || "").toLowerCase()] || {}).stats || {};
    const allStats = computeAllStats(character);
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
              <Text style={modalStyles.closeText}>×</Text>
            </TouchableOpacity>
            <ScrollView>
              <Text style={modalStyles.detailName}>{character.name}</Text>
              <Text style={modalStyles.detailLabel}>
                {character.label} • {character.type}
              </Text>
              <View style={{ marginBottom: 8 }}>{renderHealthBar(character)}</View>
              <View style={{ height: 8 }} />
              <View>
                <Text style={{ color: "#C9A66B", fontWeight: "700", marginBottom: 6 }}>Stats</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Strength</Text>
                      <Text style={modalStyles.statValue}>{character.strength}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Defense</Text>
                      <Text style={modalStyles.statValue}>{character.defense}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Speed</Text>
                      <Text style={modalStyles.statValue}>{character.speed}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Knowledge</Text>
                      <Text style={modalStyles.statValue}>{character.knowledge}</Text>
                    </View>
                  </View>
                  <View style={{ width: 1, backgroundColor: "#444", marginHorizontal: 4 }} />
                  <View style={{ flex: 1, paddingLeft: 8 }}>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Magick</Text>
                      <Text style={modalStyles.statValue}>{character.magick}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Resistance</Text>
                      <Text style={modalStyles.statValue}>{character.resistance}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Skill</Text>
                      <Text style={modalStyles.statValue}>{character.skill}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Luck</Text>
                      <Text style={modalStyles.statValue}>{character.luck}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={{ height: 8 }} />
              <View>
                <Text style={{ color: "#C9A66B", fontWeight: "700", marginBottom: 6 }}>Weapon</Text>
                <Text style={{ color: "#fff", marginBottom: 6 }}>{character.base_weapon}</Text>
                {weapon && Object.keys(weapon).length > 0 && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      {Object.entries(weapon)
                        .slice(0, Math.ceil(Object.entries(weapon).length / 2))
                        .map(([k, v]) => (
                          <View key={k} style={modalStyles.statRow}>
                            <Text style={modalStyles.statLabel}>{getWeaponStatLabel(k)}</Text>
                            <Text style={modalStyles.statValue}>{String(v)}</Text>
                          </View>
                        ))}
                    </View>
                    <View style={{ width: 1, backgroundColor: "#444", marginHorizontal: 4 }} />
                    <View style={{ flex: 1, paddingLeft: 8 }}>
                      {Object.entries(weapon)
                        .slice(Math.ceil(Object.entries(weapon).length / 2))
                        .map(([k, v]) => (
                          <View key={k} style={modalStyles.statRow}>
                            <Text style={modalStyles.statLabel}>{getWeaponStatLabel(k)}</Text>
                            <Text style={modalStyles.statValue}>{String(v)}</Text>
                          </View>
                        ))}
                    </View>
                  </View>
                )}
              </View>
              <View style={{ height: 8 }} />
              <View>
                <Text style={{ color: "#C9A66B", fontWeight: "700", marginBottom: 6 }}>Advanced Stats</Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Power</Text>
                      <Text style={modalStyles.statValue}>{allStats.power}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Protection (Mel)</Text>
                      <Text style={modalStyles.statValue}>{allStats.protection.melee}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Protection (Mag)</Text>
                      <Text style={modalStyles.statValue}>{allStats.protection.magic}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Evasion</Text>
                      <Text style={modalStyles.statValue}>{allStats.evasion}</Text>
                    </View>
                  </View>
                  <View style={{ width: 1, backgroundColor: "#444", marginHorizontal: 4 }} />
                  <View style={{ flex: 1, paddingLeft: 8 }}>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Agility</Text>
                      <Text style={modalStyles.statValue}>{allStats.agility}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Accuracy</Text>
                      <Text style={modalStyles.statValue}>{allStats.accuracy}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Critical</Text>
                      <Text style={modalStyles.statValue}>{allStats.critical}</Text>
                    </View>
                    <View style={modalStyles.statRow}>
                      <Text style={modalStyles.statLabel}>Block</Text>
                      <Text style={modalStyles.statValue}>{allStats.block}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const LocalBattleModal = ({ visible, attacker, defender, onCancel, onConfirm, isBusy }) => {
    if (!attacker || !defender) return null;
    const atkStats = computeAllStats(attacker);
    const defStats = computeAllStats(defender);
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.content, { flexDirection: "row", padding: 12 }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={modalStyles.detailName}>{attacker.name}</Text>
              <Text style={modalStyles.detailLabel}>
                {attacker.label} • {attacker.type}
              </Text>
              {renderHealthBar(attacker)}
              <View style={{ height: 8 }} />
              <View style={modalStyles.statRow}>
                <Text style={modalStyles.statLabel}>Power</Text>
                <Text style={modalStyles.statValue}>{atkStats.power}</Text>
              </View>
              <View style={modalStyles.statRow}>
                <Text style={modalStyles.statLabel}>Prot (M)</Text>
                <Text style={modalStyles.statValue}>{atkStats.protection.melee}</Text>
              </View>
              <View style={modalStyles.statRow}>
                <Text style={modalStyles.statLabel}>Prot (R)</Text>
                <Text style={modalStyles.statValue}>{atkStats.protection.magic}</Text>
              </View>
            </View>
            <View style={{ width: 1, backgroundColor: "#444", marginHorizontal: 8 }} />
            <View style={{ flex: 1, paddingLeft: 8 }}>
              <Text style={modalStyles.detailName}>{defender.name}</Text>
              <Text style={modalStyles.detailLabel}>
                {defender.label} • {defender.type}
              </Text>
              {renderHealthBar(defender)}
              <View style={{ height: 8 }} />
              <View style={modalStyles.statRow}>
                <Text style={modalStyles.statLabel}>Power</Text>
                <Text style={modalStyles.statValue}>{defStats.power}</Text>
              </View>
              <View style={modalStyles.statRow}>
                <Text style={modalStyles.statLabel}>Prot (M)</Text>
                <Text style={modalStyles.statValue}>{defStats.protection.melee}</Text>
              </View>
              <View style={modalStyles.statRow}>
                <Text style={modalStyles.statLabel}>Prot (R)</Text>
                <Text style={modalStyles.statValue}>{defStats.protection.magic}</Text>
              </View>
            </View>
            <TouchableOpacity style={modalStyles.closeButton} onPress={onCancel}>
              <Text style={modalStyles.closeText}>×</Text>
            </TouchableOpacity>
            <View
              style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                right: 12,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={[styles.endTurnButton, { flex: 0.45, backgroundColor: "#444" }]}
                onPress={onCancel}
              >
                <Text style={styles.endTurnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.endTurnButton, { flex: 0.45 }]}
                onPress={() => onConfirm(attacker.id, defender.id)}
                disabled={isBusy}
              >
                {isBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.endTurnText}>Confirm Attack</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.turnBanner}>
        <Text style={styles.turnText}>{turnText}</Text>
      </View>
      {/* Player's characters shown at top half (always visible). Disabled when not player's turn. */}
      <View style={styles.playerArea}>
        <Text style={styles.caption}>
          {currentTurnUserId === userId ? "Select a character to attack" : "Your characters"}
        </Text>
        <View style={styles.charactersRow}>
          {(() => {
            const myTeam = teams.find((t) => String(t.user_id) === String(userId));
            if (!myTeam || !myTeam.characters) return <Text style={styles.noChars}>No characters</Text>;
            return myTeam.characters.map((c) => {
              const hasAttacked = attacked && attacked[c.id];
              const isSelected = selectedAttackerId === c.id && currentTurnUserId === userId;
              const canSelect = !hasAttacked && currentTurnUserId === userId;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.charCard,
                    hasAttacked ? styles.charCardDisabled : null,
                    isSelected ? styles.charCardSelected : null,
                  ]}
                  onPress={() => {
                    if (canSelect) setSelectedAttackerId(c.id);
                  }}
                  onLongPress={() => openStatModal(c)}
                >
                  <Text style={styles.charName}>{c.name || `Char ${c.id}`}</Text>
                  {renderHealthBar(c)}
                  <Text style={styles.weaponType}>{((c.base_weapon || "").toString() || "").toUpperCase()}</Text>
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      </View>

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
                  onPress={() => {
                    if (!canBeTargeted) return;
                    // if an attacker is selected, open the Battle Modal instead of immediate attack
                    if (selectedAttackerId) {
                      // find attacker object
                      const myTeam = teams.find((t) => String(t.user_id) === String(userId));
                      const attackerObj = myTeam
                        ? myTeam.characters.find((ch) => String(ch.id) === String(selectedAttackerId))
                        : null;
                      // Store the full character objects in refs so they persist across polling updates
                      battleModalAttackerRef.current = attackerObj;
                      battleModalDefenderRef.current = c;
                      setBattleAttackerId(attackerObj ? attackerObj.id : null);
                      setBattleDefenderId(c.id);
                      setBattleModalVisible(true);
                      return;
                    }
                  }}
                  onLongPress={() => openStatModal(c)}
                >
                  <Text style={styles.charName}>{c.name || `Char ${c.id}`}</Text>
                  {renderHealthBar(c)}
                  <Text style={styles.weaponType}>{((c.base_weapon || "").toString() || "").toUpperCase()}</Text>
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
      {/* Modals (local implementations) */}
      {useMemo(() => {
        const character = statModalCharRef.current;
        return <LocalStatModal visible={statModalVisible} character={character} onClose={closeStatModal} />;
      }, [statModalVisible])}
      {useMemo(() => {
        // Prefer character objects from refs (stored when modal was opened) to avoid flicker from polling updates
        const attacker = battleModalAttackerRef.current;
        const defender = battleModalDefenderRef.current;

        // Fall back to finding from current teams if refs are empty (should rarely happen)
        if (!attacker || !defender) {
          const allChars = (teams || []).flatMap((t) => t.characters || []);
          const attackerObj = battleAttackerId
            ? allChars.find((ch) => String(ch.id) === String(battleAttackerId))
            : null;
          const defenderObj = battleDefenderId
            ? allChars.find((ch) => String(ch.id) === String(battleDefenderId))
            : null;

          const makePlaceholder = (id) => ({
            id,
            name: `Char ${id}`,
            health: initialHealths && initialHealths[id] != null ? initialHealths[id] : 0,
            max_health: initialHealths && initialHealths[id] != null ? initialHealths[id] : 20,
            base_weapon: "",
            type: "",
            label: "",
            strength: 0,
            magick: 0,
            defense: 0,
            resistance: 0,
          });

          const finalAttacker = attackerObj || (battleAttackerId ? makePlaceholder(battleAttackerId) : null);
          const finalDefender = defenderObj || (battleDefenderId ? makePlaceholder(battleDefenderId) : null);

          return (
            <LocalBattleModal
              visible={battleModalVisible}
              attacker={finalAttacker}
              defender={finalDefender}
              onCancel={() => {
                setBattleModalVisible(false);
                setBattleAttackerId(null);
                setBattleDefenderId(null);
                battleModalAttackerRef.current = null;
                battleModalDefenderRef.current = null;
              }}
              onConfirm={(attId, defId) => handleAttack(defId, attId)}
              isBusy={isPerformingAttack}
            />
          );
        }

        return (
          <LocalBattleModal
            visible={battleModalVisible}
            attacker={attacker}
            defender={defender}
            onCancel={() => {
              setBattleModalVisible(false);
              setBattleAttackerId(null);
              setBattleDefenderId(null);
              battleModalAttackerRef.current = null;
              battleModalDefenderRef.current = null;
            }}
            onConfirm={(attId, defId) => handleAttack(defId, attId)}
            isBusy={isPerformingAttack}
          />
        );
      }, [battleModalVisible, isPerformingAttack])}
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
  cardStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  cardStatLabel: {
    color: "#C9A66B",
    fontSize: 11,
    fontWeight: "600",
    marginRight: 4,
  },
  cardStatValue: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  /* compact variants for uncluttered card */
  cardStatsRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  cardStatLabelCompact: {
    color: "#C9A66B",
    fontSize: 10,
    fontWeight: "600",
    marginRight: 6,
  },
  cardStatValueCompact: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    marginRight: 8,
  },
  weaponType: {
    color: "#AAA",
    fontSize: 10,
    fontWeight: "700",
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

// LocalStatModal is declared inside the component; the module-level export was removed.

// LocalBattleModal is declared inside the component; the exported BattleModal was removed.

const barStyles = StyleSheet.create({
  hpBarContainer: {
    width: 110,
    alignItems: "center",
  },
  hpBarBackground: {
    width: "100%",
    height: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 6,
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
    marginHorizontal: 1,
  },
});

// Stat modal styles reuse some patterns from matchmaking
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "#2B2B2B",
    borderRadius: 12,
    padding: 15,
    maxHeight: "80%",
    width: "86%",
    borderWidth: 2,
    borderColor: "#C9A66B",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
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
  detailName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: "#C9A66B",
    marginBottom: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  statLabel: { color: "#C9A66B" },
  statValue: { color: "#fff", fontWeight: "700" },
});
/* Modal component rendered at bottom of file via state */
