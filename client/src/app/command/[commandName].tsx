import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { MouseControlPage } from "../../component/mouseControlPage";
import { styles } from "../../stylesheet/styles";

function getCommandName(value: string | string[] | undefined) {
    const commandName = Array.isArray(value) ? value[0] : value;
    return typeof commandName === "string" ? commandName.trim() : "";
}

export default function CommandScreen() {
    const params = useLocalSearchParams();
    const commandName = getCommandName(params.commandName);

    if (!commandName) {
        return (
            <View style={styles.commandScreen}>
                <Text style={styles.commandScreenText}>Invalid command screen.</Text>
            </View>
        );
    }

    // Screen implementations are selected here, not in ScrollView. Adding a
    // new dedicated screen therefore does not change command-list rendering.
    if (commandName === "mouseControl") {
        return <MouseControlPage commandName={commandName} />;
    }

    return (
        <View style={styles.commandScreen}>
            <Text style={styles.commandScreenText}>
                No screen is registered for “{commandName}”.
            </Text>
        </View>
    );
}
