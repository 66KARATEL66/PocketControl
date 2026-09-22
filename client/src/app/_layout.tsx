import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from "../stylesheet/styles";
import { Header } from "../component/Header";
import { ContextProvider } from '../data/context'

export default function Layout() {

  return (
    <SafeAreaView style={styles.base}>
      <Header />
      <View style={styles.baseParent}>
        <ContextProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: styles.base,
            }}
          />
        </ContextProvider>
      </View>
    </SafeAreaView>
  );
}