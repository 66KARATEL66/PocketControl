import { Alert, FlatList, View } from "react-native";
import { router } from "expo-router";
import { Button } from "./Button";
import { styles } from "../stylesheet/styles";
import { executeCommand } from "../data/commands";
import { useAuth } from "../data/context";

export function ScrollView() {
    const { session, commands, status, refreshCommands } = useAuth();

    const onPressCommand = async (command) => {
        if (command.isSolid === false) {
            if (
                typeof command.command !== "string" ||
                !/^[A-Za-z0-9_-]+$/.test(command.command)
            ) {
                Alert.alert("Invalid command", "This command does not have a valid screen name.");
                return;
            }

            router.push({
                pathname: "/command/[commandName]",
                params: { commandName: command.command },
            });
            return;
        }

        try {
            await executeCommand(session, command);
        } catch (error) {
            if (error.code === "auth_required") {
                await refreshCommands();
            }
            Alert.alert("Command failed", error.message);
        }
    };

    const onRefreshCommands = async () => {
        try {
            await refreshCommands();
        } catch (error) {
            Alert.alert("Unable to refresh commands", error.message);
        }
    };

    if (status === "loading") {
        return <Button item={{ title: "Connecting..." }} />;
    }

    if (status !== "authenticated") {
        return (
            <Button
                item={{
                    title: "Connect to a server",
                    onPressHandler: () => router.push("/settings"),
                }}
            />
        );
    }

    return (
        <View style={styles.commandListContainer}>
            <Button
                item={{ title: "Refresh commands", onPressHandler: onRefreshCommands }}
            />
            <FlatList
                style={styles.scrollView}
                data={commands}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                renderItem={({ item }) => (
                    <Button
                        item={{
                            title: item.command,
                            onPressHandler: () => onPressCommand(item),
                        }}
                    />
                )}
            />
        </View>
    );
}
