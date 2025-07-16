import React from "react";
import PagerView from "react-native-pager-view";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

export default function TeamViewScreen() {
  return (
    <PagerView style={styles.pagerView} initialPage={1}>
      <View key="add" style={styles.container}>
        <View style={styles.charCard}>
          <TouchableOpacity>
            <View style={styles.addBtn}>
              <Text style={styles.addIcon}>+</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View key="char1" style={styles.container}>
        <View style={styles.charCard}>
          <TouchableOpacity>
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
