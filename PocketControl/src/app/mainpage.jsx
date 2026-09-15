import { FlatList, View, Pressable, Text, Image } from 'react-native';
import { styles, iconStyles } from './stylesheet/styles'
import { startTransition } from 'react';
import { MaterialIcons } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context";
import {MouseControlPage} from "./mouseControlPage"
import { SettingsPage } from './settingsPage';

const buttonList = [
    {
        id: "1",
        title: "First"
    },
    {
        id: "2",
        title: "Second"
    },
    {
        id: "3",
        title: "Third"
    },
    {
        id: "4",
        title: "Fourth"
    },
];

function Button({item}) {
    return(
        <Pressable style={styles.scrollViewerButton}>
            <Text style={styles.scrollViewerText}>{item.title}</Text>
        </Pressable>
    )
}

function Header() {
    return(
        <View style={styles.header}>
            <Text style={styles.headerText}>Pocket Control</Text>
            <Pressable style={styles.settingsButton}><MaterialIcons name="settings" size={iconStyles.settings.size} style={{color: iconStyles.settings.color}}/></Pressable>
        </View>
    )
}

function ScrollView() {
    return(
        <View>
            <FlatList style={styles.scrollView} 
                data={buttonList}
                keyExtractor={item => item.id}
                numColumns={2}
                renderItem={({item}) => (
                    <Button item={item}/>
                )}
            />
        </View>
    )
}

export function MainPage()
{
    return(
        <SafeAreaView style={styles.base}>
            <Header />
            <View style={styles.baseParent}>
                {/* <ScrollView /> */}
                {/* < MouseControlPage /> */}
                <SettingsPage />
            </View>
        </SafeAreaView>
    )
}