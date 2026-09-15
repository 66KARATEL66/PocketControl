import { View, Text, Pressable } from 'react-native'
import { styles } from "./stylesheet/styles"

export function SettingsPage()
{
    return(
        <View style={styles.settingsPage}>
            <Pressable style={styles.settingsPageButton}>
                <Text style={styles.settingsPageText}>Connect</Text>
            </Pressable>
            <Pressable style={styles.settingsPageButton}>
                <Text style={styles.settingsPageText}>About</Text>
            </Pressable>
        </View>
    )
}