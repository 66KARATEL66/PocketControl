import {View, FlatList, Text, Pressable, useState} from 'react-native'
import { Button } from './Button';
import { styles} from '../stylesheet/styles'
import jsonData from ''
import { router } from 'expo-router';
import * as commands from '../data/commands'
import { useAuth } from '@/data/context';
import { getUniqueId } from 'react-native-device-info'


export function ScrollView() {
    const [authStatus, setAuthStatus] = useAuth();
    const [isCommandsLoaded, setIsCommandsLoaded] = useState(false);

    onPressAuthHandler = () => {
        router.push("/settings");
    }

    onPressGetCommandsHandler = () => {
        if(commands.getCommands === true)
        {
            setIsCommandsLoaded(true);
        }
    }

    return(
        <View>
            {authStatus || <Button item={{title: "To start using the commands - Auth firstly", onPressHandler: onPressAuthHandler}}></Button>}
            {isCommandsLoaded || <Button item={{title: "Get Commands", onPressHandler: onPressGetCommandsHandler}}></Button>}
            {isCommandsLoaded && (
                <FlatList
                    style={styles.scrollView}
                    data={buttonList}
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <Button
                            item={item}
                            onPress={async () => {
                                const response = await fetch(DATA.commandRequest, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        command: item.command,
                                        device_id: await getUniqueId(),
                                    }),
                                });

                                const result = await response.json();

                                console.log("COMMAND RESPONSE:", result);
                            }}
                        />
                    )}
                />
            )}
        </View> 
    )
}