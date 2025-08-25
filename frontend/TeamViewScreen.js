import React from "react";
import PagerView from "react-native-pager-view";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "@env";

export default function TeamViewScreen(teamId) {
  const navigation = useNavigation();
  const [characters, setCharacters] = useState([]);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/get-characters?teamId=` + teamId.route.params.teamId);
        const data = await res.json();
        console.log(data.characters.length);
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
        <TouchableOpacity onPress={() => console.log(teamId)}>
          <View style={styles.addBtn}>
            <Text>{character.name}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  ));

  if (characters.length < 6) {
    pages.push(
      <View key="add" style={styles.container}>
        <View style={styles.charCard}>
          <TouchableOpacity onPress={() => navigation.navigate("CharCreation")}>
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
