import { Alert, Pressable, Text, View } from "react-native";
import { styles } from "../stylesheet/styles";
import { useAuth } from "../data/context";

export function SettingsPage() {
    const { authStatus, status, connect, logout } = useAuth();

    const onPressConnect = async () => {
        try {
            await connect();
            Alert.alert("Connected", "The server connection is ready.");
        } catch (error) {
            Alert.alert("Authentication failed", error.message);
        }
    };

    const onPressLogout = async () => {
        await logout();
        Alert.alert("Disconnected", "Stored authentication has been cleared.");
    };

    return (
        <View style={styles.settingsPage}>
            <Text style={styles.settingsStatus}>
                {status === "loading"
                    ? "Connecting..."
                    : authStatus
                        ? "Connected"
                        : "Disconnected"}
            </Text>
            <Pressable
                style={styles.settingsPageButton}
                onPress={authStatus ? onPressLogout : onPressConnect}
                disabled={status === "loading"}
            >
                <Text style={styles.settingsPageText}>
                    {authStatus ? "Disconnect" : "Connect"}
                </Text>
            </Pressable>
        </View>
    );
}
