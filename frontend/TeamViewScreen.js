import React from "react";
import PagerView from "react-native-pager-view";
import { FontAwesome } from "@expo/vector-icons";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState, useMemo } from "react";
import { BACKEND_URL } from "@env";
import { weaponsData } from "./WeaponsData.js";

export default function TeamViewScreen() {
  const navigation = useNavigation();
  const [characters, setCharacters] = useState([]);
  const route = useRoute();
  const { teamId } = route.params;

  const [statsView, setStatsView] = useState("base");

  const baseStats = {
    Hlth: "Health",
    Str: "Strength",
    Def: "Defense",
    Mgk: "Magick",
    Res: "Resistance",
    Spd: "Speed",
    Skl: "Skill",
    Knl: "Knowledge",
    Lck: "Luck",
  };

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/get-characters?teamId=` + teamId);
        const data = await res.json();
        setCharacters(data.characters);
      } catch (err) {
        alert(err);
      }
    };
    fetchCharacters();
  }, []);

  const deleteCharacter = (characterId) => {
    Alert.alert("Delete Character", "Are you sure you want to delete this character?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${BACKEND_URL}/delete-character`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ characterId }),
            });

            const data = await res.json();

            if (data.success) {
              alert("Character deleted successfully");
              await fetch(`${BACKEND_URL}/decrement-char-count`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId }),
              });

              setCharacters((prev) => prev.filter((c) => c.id !== characterId));
            } else {
              alert("Could not delete character");
            }
          } catch (err) {
            console.log(err);
            alert("Error deleting character");
          }
        },
      },
    ]);
  };

  const pages = characters.map((character, i) => (
    <View key={i} style={styles.container}>
      <View style={styles.charCard}>
        <Text style={styles.charName}>{character.name}</Text>
        <Text style={styles.charLabel}>{character.label}</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteCharacter(character.id)}>
          <FontAwesome name="trash" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.charImage}>
          <Text>Character Image</Text>
        </View>
        <Text style={styles.charLvl}>Level: 1</Text>
        <Text style={styles.charMove}>Move: {character.move_value}</Text>
        <Text style={styles.charSize}>Size: {character.size}</Text>
        <Text style={styles.charType}>{character.type}</Text>
        <TouchableOpacity
          style={[styles.baseStatsBtn, statsView === "base" ? styles.pressed : styles.notPressed]}
          onPress={() => setStatsView("base")}
        >
          <View>
            <Text>Base</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.atkStatsBtn, statsView === "atk" ? styles.pressed : styles.notPressed]}
          onPress={() => setStatsView("atk")}
        >
          <View>
            <Text>Attacks</Text>
          </View>
        </TouchableOpacity>
        {statsView === "base" ? (
          <View style={styles.statsWrapper}>
            <View style={styles.baseStatsContainer}>
              <Text style={styles.statsTitle}>Base Stats</Text>
              {Object.entries(baseStats).map(([statLabel, value]) => (
                <View key={statLabel} style={styles.statRow}>
                  <Text style={styles.statsLabel}>{baseStats[statLabel]}</Text>
                  <Text style={styles.statsValue}>{character[value.toLowerCase()]}</Text>
                </View>
              ))}
            </View>
            <View style={styles.weaponStatsContainer}>
              <Text style={styles.statsTitle}>Base Attack</Text>
              <Text style={styles.weaponName}>{character.base_weapon}</Text>
              {Object.entries(weaponsData.weapons[character.base_weapon.toLowerCase()].stats).map(([label, value]) => (
                <View key={label} style={styles.statRow}>
                  <Text style={styles.statsLabel}>{label}</Text>
                  <Text style={styles.statsValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.attackWrapper}>
            <View style={styles.attackContainer}>
              {Object.entries(
                weaponsData.weaponAbilities[character.base_weapon].find(
                  (ability) => ability.name === character.weapon_ability1
                )
              ).map(([label, value]) => {
                if (label === "name")
                  return (
                    <View key={label}>
                      <Text style={styles.abilityTitle}>{value}</Text>
                    </View>
                  );
                return (
                  <View key={label} style={styles.abilityStatRow}>
                    <Text style={styles.abilityStatsValue}>{label}</Text>
                    <Text style={styles.abilityStatsValue}>{value}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.attackContainer}>
              {Object.entries(
                weaponsData.weaponAbilities[character.base_weapon].find(
                  (ability) => ability.name === character.weapon_ability2
                )
              ).map(([label, value]) => {
                if (label === "name")
                  return (
                    <View key={label}>
                      <Text style={styles.abilityTitle}>{value}</Text>
                    </View>
                  );
                return (
                  <View key={label} style={styles.abilityStatRow}>
                    <Text style={styles.abilityStatsValue}>{label}</Text>
                    <Text style={styles.abilityStatsValue}>{value}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  ));

  if (characters.length < 6) {
    pages.push(
      <View key="add" style={styles.container}>
        <View style={styles.charCard}>
          <TouchableOpacity onPress={() => navigation.navigate("CharCreation", { teamId })}>
            <View style={styles.addBtn}>
              <Text style={styles.addIcon}>+</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <PagerView style={styles.pagerView} initialPage={0}>
      {pages}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  pagerView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#2B2B2B",
  },
  charCard: {
    backgroundColor: "#3C3C3C",
    flex: 1,
    borderRadius: 25,
    margin: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  charName: {
    position: "absolute",
    width: "45%",
    padding: 10,
    fontSize: 25,
    top: "1%",
    left: "10%",
    color: "#F5F5F5",
    fontWeight: "bold",
  },
  charLabel: {
    position: "absolute",
    width: "40%",
    padding: 10,
    fontSize: 25,
    top: "1%",
    left: "60%",
    color: "#F5F5F5",
    fontWeight: "bold",
  },
  deleteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#C94A4A",
    height: 35,
    width: 35,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 6,
  },
  deleteText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  charImage: {
    position: "absolute",
    height: "15%",
    width: "30%",
    backgroundColor: "#C9A66B",
    top: "7%",
    left: "10%",
    justifyContent: "center",
    alignItems: "center",
  },
  charLvl: {
    position: "absolute",
    color: "#F5F5F5",
    fontSize: 20,
    fontWeight: "bold",
    top: "8%",
    right: "20%",
  },
  charMove: {
    position: "absolute",
    color: "#F5F5F5",
    fontSize: 20,
    fontWeight: "bold",
    top: "13%",
    right: "20%",
  },
  charSize: {
    position: "absolute",
    color: "#F5F5F5",
    fontSize: 20,
    fontWeight: "bold",
    top: "18%",
    right: "20%",
  },
  charType: {
    position: "absolute",
    width: "45%",
    top: "23%",
    color: "#F5F5F5",
    fontSize: 25,
  },
  baseStatsBtn: {
    position: "absolute",
    backgroundColor: "#C9A66B",
    height: "5%",
    width: "30%",
    top: "32%",
    left: "3%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
  atkStatsBtn: {
    position: "absolute",
    backgroundColor: "#C9A66B",
    height: "5%",
    width: "30%",
    top: "32%",
    left: "33%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
  },
  notPressed: {
    backgroundColor: "#D4B36C",
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopColor: "#FFF1C9",
    borderLeftColor: "#FFF1C9",
    borderBottomColor: "#9C823F",
    borderRightColor: "#9C823F",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },

  pressed: {
    backgroundColor: "#B8974B",
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopColor: "#9C823F",
    borderLeftColor: "#9C823F",
    borderBottomColor: "#FFF1C9",
    borderRightColor: "#FFF1C9",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },

  statsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    width: "100%",
    position: "absolute",
    top: "40%",
  },
  baseStatsContainer: {
    backgroundColor: "#5A4C3C",
    borderRadius: 10,
    padding: 10,
    flex: 1,
    marginRight: 5,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#C9A66B",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  statsLabel: {
    width: "65%",
    fontSize: 16,
    color: "#F5F5F5",
  },
  statsValue: {
    width: 30,
    textAlign: "center",
    fontSize: 16,
    color: "#F5F5F5",
  },
  abilityTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#C9A66B",
  },
  attackWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    top: "15%",
  },
  attackContainer: {
    backgroundColor: "#5A4C3C",
    borderRadius: 10,
    padding: 12,
    margin: 8,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  abilityStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginVertical: 2,
    flexWrap: "wrap",
  },
  abilityStatsValue: {
    fontSize: 16,
    flexShrink: 1,
    textAlign: "right",
    maxWidth: "60%",
    marginBottom: 4,
    color: "#F5F5F5",
  },
  weaponStatsContainer: {
    backgroundColor: "#5A4C3C",
    borderRadius: 10,
    padding: 10,
    flex: 1,
    marginLeft: 5,
  },
  weaponName: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 8,
    color: "#F5F5F5",
  },
  addBtn: {
    backgroundColor: "#C9A66B",
    height: 100,
    width: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  addIcon: {
    fontSize: 50,
    color: "#2B2B2B",
  },
});
