import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "./AuthContext";
import { useEffect } from "react";
import { BACKEND_URL } from "@env";

import Login from "./Login";
import Register from "./Register";
import HomeScreen from "./HomeScreen";
import TeamViewScreen from "./TeamViewScreen";
import CharCreation from "./CharCreation";

const Stack = createNativeStackNavigator();
export default function App() {
  // Warm up the backend
  useEffect(() => {
    fetch(`${BACKEND_URL}/ping`)
      .then(() => console.log("Backend warmed up"))
      .catch((err) => console.log("Warm-up failed:", err));
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="TeamViewScreen" component={TeamViewScreen} />
          <Stack.Screen name="CharCreation" component={CharCreation} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
