import { styles } from './stylesheet/styles'
import { View, Text } from "react-native"

export function MouseControlPage()
{
    return(
        <View style={styles.trackPadContainer}>
            <Text style={styles.trackPadContainerText}>Position: x y</Text>
            <View style={styles.trackZone}>
                <Text style={styles.trackZoneText}>Touch me</Text>
            </View>
        </View>
    )
}