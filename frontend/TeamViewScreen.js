import React from "react";
import PagerView from "react-native-pager-view";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { BACKEND_URL } from "@env";

export default function TeamViewScreen(teamId) {
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/get-characters?teamId=` + teamId.route.params.teamId);
        const data = await res.json();
        setTeams(data.teams); // Example: [{ id:1, team_name:"Sharks" }, { id:2, team_name:"Dragons"}]
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    };
    fetchCharacters();
  });

  return (
    <PagerView style={styles.pagerView} initialPage={0}>
      <View key="add" style={styles.container}>
        <View style={styles.charCard}>
          <TouchableOpacity onPress={() => navigation.navigate("CharCreation")}>
            <View style={styles.addBtn}>
              <Text style={styles.addIcon}>+</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View key="char1" style={styles.container}>
        <View style={styles.charCard}>
          <TouchableOpacity onPress={() => console.log(teamId.route.params.teamId)}>
            <View style={styles.addBtn}>
              <Text style={styles.addIcon}>test</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
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
