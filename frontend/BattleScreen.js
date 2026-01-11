import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { BACKEND_URL } from "@env";

export default function BattleScreen() {
  const route = useRoute();
  const { hostId, joinerId, userId } = route.params;
  const [myTeam, setMyTeam] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const isHost = userId === hostId;
  const myName = isHost ? "You (Host)" : "You (Joiner)";

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Get user's teams and use the first completed team
        const teamsRes = await fetch(`${BACKEND_URL}/get-finished-teams?userId=${userId}`);
        const teamsData = await teamsRes.json();

        if (teamsData.teams && teamsData.teams.length > 0) {
          const teamId = teamsData.teams[0].id;
          const charRes = await fetch(`${BACKEND_URL}/get-characters?teamId=${teamId}`);
          const charData = await charRes.json();
          setMyTeam(charData.characters);
        }
      } catch (err) {
        console.log("Error fetching battle data:", err);
      }
    };

    fetchTeams();
  }, []);

  const CompactCharacter = ({ character, onPress }) => {
    const typeColor = character.type && character.type.toLowerCase() === "mage" ? "#9D4EDD" : "#FF0000";
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress}>
        <View style={styles.cardHeader}>
          <Text style={styles.charNameCompact}>{character.name}</Text>
          <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
        </View>
        <Text style={styles.charTypeCompact}>{character.type}</Text>
        <Text style={styles.hpCompact}>HP: {character.health}</Text>
      </TouchableOpacity>
    );
  };

  const DetailedStats = ({ character }) => (
    <ScrollView style={styles.statsContainer}>
      <Text style={styles.detailName}>{character.name}</Text>
      <Text style={styles.detailLabel}>
        {character.label} • {character.type}
      </Text>

      <View style={styles.hpBarContainer}>
        <View style={styles.hpBarLabelRow}>
          <Text style={styles.hpBarSideLabel}>0</Text>
          <Text style={styles.hpBarTitle}>HP</Text>
          <Text style={styles.hpBarSideLabel}>{character.health}</Text>
        </View>
        <View style={styles.hpBarBackground}>
          <View style={[styles.hpBarFill, { width: "100%" }]} />
          <View style={styles.ticksContainer}>
            {Array.from({ length: character.health }).map((_, i) => (
              <View key={i} style={styles.tick} />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.statsListContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabelList}>STR</Text>
          <Text style={styles.statValueList}>{character.strength}</Text>
          <Text style={styles.statLabelList}>DEF</Text>
          <Text style={styles.statValueList}>{character.defense}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabelList}>MAG</Text>
          <Text style={styles.statValueList}>{character.magick}</Text>
          <Text style={styles.statLabelList}>RES</Text>
          <Text style={styles.statValueList}>{character.resistance}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabelList}>SPD</Text>
          <Text style={styles.statValueList}>{character.speed}</Text>
          <Text style={styles.statLabelList}>SKL</Text>
          <Text style={styles.statValueList}>{character.skill}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabelList}>KNL</Text>
          <Text style={styles.statValueList}>{character.knowledge}</Text>
          <Text style={styles.statLabelList}>LCK</Text>
          <Text style={styles.statValueList}>{character.luck}</Text>
        </View>
      </View>

      <View style={styles.weaponSection}>
        <Text style={styles.weaponTitle}>⚔️ {character.base_weapon}</Text>
        <Text style={styles.abilityText}>{character.weapon_ability1}</Text>
        <Text style={styles.abilityText}>{character.weapon_ability2}</Text>
      </View>

      <View style={styles.miscSection}>
        <Text style={styles.miscText}>
          Size: {character.size} | Move: {character.move_value}
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{myName}</Text>
        <Text style={styles.teamCount}>{myTeam ? myTeam.length : 0} characters</Text>
      </View>

      <ScrollView style={styles.teamsContainer} scrollEnabled={true} horizontal={false}>
        <View style={styles.teamColumn}>
          <Text style={styles.sectionTitle}>Your Team</Text>
          {myTeam &&
            myTeam.map((char) => (
              <CompactCharacter key={char.id} character={char} onPress={() => setSelectedCharacter(char)} />
            ))}
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
    backgroundColor: "#1a1a1a",
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
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
    maxHeight: "50%",
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
});
