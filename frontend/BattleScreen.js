import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { BACKEND_URL } from "@env";

export default function BattleScreen() {
  const route = useRoute();
  const { hostId, joinerId, userId, battleTeamId, opponentTeamId, opponentId } = route.params;
  const [myTeam, setMyTeam] = useState(null);
  const [opponentTeam, setOpponentTeam] = useState(null);
  const [opponentName, setOpponentName] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const isHost = userId === hostId;
  const myName = isHost ? "You (Host)" : "You (Joiner)";

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Get my team
        const myRes = await fetch(`${BACKEND_URL}/get-characters?teamId=${battleTeamId}`);
        const myData = await myRes.json();
        setMyTeam(myData.characters);

        // Get opponent's username
        const userRes = await fetch(`${BACKEND_URL}/get-user?userId=${opponentId}`);
        const userData = await userRes.json();
        setOpponentName(userData.username);

        // Get opponent's team
        const oppRes = await fetch(
          `${BACKEND_URL}/get-opponent-team?opponentId=${opponentId}&battleTeamId=${opponentTeamId}`
        );
        const oppData = await oppRes.json();
        setOpponentTeam(oppData.characters);
      } catch (err) {
        console.log("Error fetching battle data:", err);
        setOpponentName("Unknown");
      }
    };

    fetchTeams();
  }, []);

  const CompactCharacter = ({ character, onPress }) => (
    <TouchableOpacity style={styles.compactCard} onPress={onPress}>
      <Text style={styles.charNameCompact}>{character.name}</Text>
      <Text style={styles.charTypeCompact}>{character.type}</Text>
      <Text style={styles.hpCompact}>HP: {character.health}</Text>
    </TouchableOpacity>
  );

  const DetailedStats = ({ character }) => (
    <ScrollView style={styles.statsContainer}>
      <Text style={styles.detailName}>{character.name}</Text>
      <Text style={styles.detailLabel}>
        {character.label} • {character.type}
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabelDetailed}>HP</Text>
          <Text style={styles.statValueDetailed}>{character.health}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabelDetailed}>STR</Text>
          <Text style={styles.statValueDetailed}>{character.strength}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabelDetailed}>DEF</Text>
          <Text style={styles.statValueDetailed}>{character.defense}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabelDetailed}>MAG</Text>
          <Text style={styles.statValueDetailed}>{character.magick}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabelDetailed}>RES</Text>
          <Text style={styles.statValueDetailed}>{character.resistance}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabelDetailed}>SPD</Text>
          <Text style={styles.statValueDetailed}>{character.speed}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabelDetailed}>SKL</Text>
          <Text style={styles.statValueDetailed}>{character.skill}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabelDetailed}>KNL</Text>
          <Text style={styles.statValueDetailed}>{character.knowledge}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabelDetailed}>LCK</Text>
          <Text style={styles.statValueDetailed}>{character.luck}</Text>
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
            <Text style={styles.sectionTitle}>Your Team</Text>
            {myTeam &&
              myTeam.map((char) => (
                <CompactCharacter key={char.id} character={char} onPress={() => setSelectedCharacter(char)} />
              ))}
          </View>

          <View style={styles.teamColumn}>
            <Text style={styles.sectionTitle}>Opponent Team</Text>
            {opponentTeam &&
              opponentTeam.map((char) => (
                <CompactCharacter key={char.id} character={char} onPress={() => setSelectedCharacter(char)} />
              ))}
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
  },
  compactCard: {
    backgroundColor: "#3C3C3C",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#C9A66B",
  },
  charNameCompact: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFD700",
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
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
    justifyContent: "space-between",
  },
  statBox: {
    width: "30%",
    backgroundColor: "#3C3C3C",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    alignItems: "center",
  },
  statLabelDetailed: {
    fontSize: 10,
    color: "#AAA",
  },
  statValueDetailed: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 2,
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
