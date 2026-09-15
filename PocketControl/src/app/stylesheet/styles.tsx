import {StyleSheet} from 'react-native'
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const styles = StyleSheet.create({
    base: {
        flex: 1,
        backgroundColor: "#0D1117",
    },

    header: {
        height: "10%",
        width: "100%",
        backgroundColor: "#161B22",

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        paddingHorizontal: 20,

        borderBottomWidth: 1,
        borderBottomColor: "#30363D",
    },

    headerText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#E6EDF3",
    },

    settingsButton: {
        width: width * 0.1,
        height: width * 0.1,

        justifyContent: "center",
        alignItems: "center",
    },

    baseParent: {
        flex: 1,
        width: "100%",

        backgroundColor: "#0D1117",
    },

    scrollView: {},

    scrollViewerButton: {
        width: "40%",
        margin: 20,
        aspectRatio: 1,

        backgroundColor: "#21262D",

        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 10,

        justifyContent: "center",
        alignItems: "center",
    },

    scrollViewerText: {
        fontSize: 16,
        color: "#E6EDF3",
        fontWeight: "500",
    },

    trackPadContainer: {
        flex: 1,
        marginTop: height * 0.2,
        alignItems: "center"
    },

    trackPadContainerText: {
        fontSize: 24,
        textAlign: "center",
        color: "white"
    },

    trackZoneText: {
        fontSize: 16,
        color: "white",
        textAlign: "center"
    },

    trackZone: {
        marginTop: height * 0.09,
        width: width * 0.8,
        height: width * 0.8,
        backgroundColor: "#2e343d",
        alignContent: "center",
        justifyContent: "center"
    },

    settingsPage: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 50,
    },

    settingsPageButton: {
        width: "60%",
        height: "15%",
        backgroundColor: "#21262D",
        justifyContent: "center",

        borderWidth: 1,
        borderColor: "#30363D",
        borderRadius: 10,
        
        marginBottom: 20,
        marginTop: 75, 
    },
    
    settingsPageText: {
        textAlign: "center",
        fontSize: 18,
        color: "white"
    },
});

export const iconStyles = {
    settings: {
        size: width * 0.1,
        color: "#8B949E",
    },
};