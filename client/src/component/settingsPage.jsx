import { Alert, View, Text, Pressable } from 'react-native'
import { styles } from "../stylesheet/styles"
import * as auth from '../data/auth'
import { useAuth } from '../data/context'

export function SettingsPage() {
    const {authStatus, setAuthStatus} = useAuth();

    const handleAuthResult = (result) => {
        setAuthStatus(result.success);

        Alert.alert(result.success ? "Auth success" : "Auth failed");
    };

    return (
        <View style={styles.settingsPage}>
            <Pressable
                style={styles.settingsPageButton}
                onPress={async () => {
                    try {
                        await auth.scanBarcode(handleAuthResult);
                    } catch (error) {
                        Alert.alert("Authentication failed", error.message);
                    }
                }}
            >
                <Text style={styles.settingsPageText}>
                    {authStatus ? "Connected" : "Connect"}
                </Text>
            </Pressable>

            <Pressable style={styles.settingsPageButton}>
                <Text style={styles.settingsPageText}>About</Text>
            </Pressable>
        </View>
    );
}