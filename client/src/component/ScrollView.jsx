import { View, FlatList, Alert } from 'react-native'
import { useState } from 'react'
import { Button } from './Button';
import { styles } from '../stylesheet/styles'
import { router } from 'expo-router';
import * as commands from '../data/commands'
import { DATA as authData } from '../data/auth'
import { useAuth } from '@/data/context';
import { getUniqueId } from 'react-native-device-info'

export function ScrollView() {
    const { authStatus } = useAuth();
    const [isCommandsLoaded, setIsCommandsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const onPressAuthHandler = () => {
        router.push("/settings");
    }

    const onPressGetCommandsHandler = async () => {
        setIsLoading(true);

        try {
            await commands.getCommands();
            setIsCommandsLoaded(true);
        } catch (error) {
            Alert.alert("Unable to load commands", error.message);
        } finally {
            setIsLoading(false);
        }
    }

    const onPressCommandHandler = async (item) => {
        try {
            const response = await fetch(authData.commandRequest, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: item.id,
                    command: item.command,
                    args: item.args ?? null,
                    device_id: await getUniqueId(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Command failed with status ${response.status}`);
            }

            const result = await response.json();

            if (result.status !== "ok") {
                Alert.alert("Command failed", result.reason || "The command was rejected");
            }
        } catch (error) {
            Alert.alert("Command failed", error.message);
        }
    }

    return(
        <View>
            {!authStatus && (
                <Button item={{ title: "To start using the commands - Auth firstly", onPressHandler: onPressAuthHandler }} />
            )}
            {authStatus && !isCommandsLoaded && (
                <Button
                    item={{
                        title: isLoading ? "Loading commands..." : "Get Commands",
                        onPressHandler: isLoading ? undefined : onPressGetCommandsHandler,
                    }}
                />
            )}
            {isCommandsLoaded && (
                <FlatList
                    style={styles.scrollView}
                    data={commands.commandsData}
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <Button
                            item={{ title: item.command }}
                            onPress={() => onPressCommandHandler(item)}
                        />
                    )}
                />
            )}
        </View> 
    )
}