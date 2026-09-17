import { styles, iconStyles } from '../stylesheet/styles'
import { Pressable, Text } from 'react-native'

export function Button({item}) {
    return(
        <Pressable style={styles.scrollViewerButton}>
            <Text style={styles.scrollViewerText}>{item.title}</Text>
        </Pressable>
    )
}