import React from "react";
import PagerView from "react-native-pager-view";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
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

  const pages = characters.map((character, i) => (
    <View key={i} style={styles.container}>
      <View style={styles.charCard}>
        <Text style={styles.charName}>{character.name}</Text>
        <Text style={styles.charLabel}>{character.label}</Text>
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
    backgroundColor: "red",
  },
  charCard: {
    backgroundColor: "grey",
    flex: 1,
    borderRadius: 50,
    margin: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  charName: {
    position: "absolute",
    width: "45%",
    padding: 10,
    fontSize: 16,
    top: "1%",
    left: "10%",
    color: "white",
    fontSize: 25,
  },
  charLabel: {
    position: "absolute",
    width: "40%",
    padding: 10,
    fontSize: 16,
    top: "1%",
    left: "60%",
    color: "white",
    fontSize: 25,
  },
  charImage: {
    position: "absolute",
    height: "15%",
    width: "30%",
    backgroundColor: "white",
    top: "7%",
    left: "10%",
  },
  charLvl: {
    position: "absolute",
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    top: "8%",
    right: "20%",
  },
  charMove: {
    position: "absolute",
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    top: "13%",
    right: "20%",
  },
  charSize: {
    position: "absolute",
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    top: "18%",
    right: "20%",
  },
  charType: {
    position: "absolute",
    width: "45%",
    top: "23%",
    color: "white",
    fontSize: 25,
  },
  baseStatsBtn: {
    position: "absolute",
    backgroundColor: "darkgrey",
    height: "5%",
    width: "30%",
    top: "32%",
    left: "3%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "black",
  },
  atkStatsBtn: {
    position: "absolute",
    backgroundColor: "lightgrey",
    height: "5%",
    width: "30%",
    top: "32%",
    left: "33%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "black",
  },
  notPressed: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopColor: "#fff", // Light on top
    borderLeftColor: "#fff",
    borderBottomColor: "#666", // Dark on bottom
    borderRightColor: "#666",
    backgroundColor: "#ccc",
  },
  pressed: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopColor: "#666", // Dark on top
    borderLeftColor: "#666",
    borderBottomColor: "#fff", // Light on bottom
    borderRightColor: "#fff",
    backgroundColor: "#ccc",
  },
  statsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    width: "100%", // ensure full width is used
    position: "absolute",
    top: "40%",
  },
  baseStatsContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    flex: 1,
    marginRight: 5,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  statsLabel: {
    width: "65%",
    fontSize: 16,
  },
  statsValue: {
    width: 30,
    textAlign: "center",
    fontSize: 16,
  },
  abilityTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  attackWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  attackContainer: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 10,
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
  },
  abilityStatsLabel: {
    fontSize: 14,
    flex: 1,
    textAlign: "left",
  },
  weaponStatsContainer: {
    backgroundColor: "#f0f4ff",
    borderRadius: 10,
    padding: 10,
    flex: 1,
    marginLeft: 5,
  },
  weaponName: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 8,
  },
  attackWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    top: "15%",
  },
  attackContainer: {
    backgroundColor: "white",
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
  addBtn: {
    backgroundColor: "darkgrey",
    height: 100,
    width: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  addIcon: {
    bottom: 3,
    fontSize: 50,
    color: "black",
  },
});
