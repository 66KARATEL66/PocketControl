import { styles, iconStyles} from '../stylesheet/styles';
import { router } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

export function Header() {
    const onPress = () => {
        router.push("/settings")
    }

    return(
        <View style={styles.header}>
            <Text style={styles.headerText}>Pocket Control</Text>
            <Pressable style={styles.settingsButton} onPress={onPress}><Ionicons name="settings" size={iconStyles.settings.size} style={{color: iconStyles.settings.color}}/></Pressable>
        </View>
    )
}