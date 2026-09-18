import {View, FlatList, Text, Pressable} from 'react-native'
import { Button } from './Button';
import { styles} from '../stylesheet/styles'
import jsonData from ''
import { router } from 'expo-router';


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

export function ScrollView() {
    return(
        <View>
            <Button item={{title: "To start using the commands - Auth firstly", onPressHandler = () => router.push("/settings")}}></Button>
        </View>

        // <View>
        //     <FlatList style={styles.scrollView} 
        //         data={buttonList}
        //         keyExtractor={item => item.id}
        //         numColumns={2}
        //         renderItem={({item}) => (
        //             <Button item={item}/>
        //         )}
        //     />
        // </View>
    )
}

function getCommands()
{
    const reader = new FileReader();
    reader.
}