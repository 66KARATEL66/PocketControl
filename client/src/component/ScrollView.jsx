import {View, FlatList} from 'react-native'
import { Button } from './Button';
import { styles} from '../stylesheet/styles'

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