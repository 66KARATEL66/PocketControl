import { styles } from '../stylesheet/styles'
import { Pressable, Text } from 'react-native'

export function Button({ item, onPress }) {
    return(
        <Pressable
            style={styles.scrollViewerButton}
            onPress={onPress || item.onPressHandler}
            disabled={!onPress && !item.onPressHandler}
        >
            <Text style={styles.scrollViewerText}>{item.title}</Text>
        </Pressable>
    )
}