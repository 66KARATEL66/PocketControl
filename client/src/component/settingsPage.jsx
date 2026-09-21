import { View, Text, Pressable } from 'react-native'
import { styles } from "../stylesheet/styles"
import { DataScanner } from 'react-native-data-scanner'
import * as pako from "pako"
import { useState } from 'react'
import * as auth from '../data/auth'
import { useAuth } from '../data/context'

export function SettingsPage() {
    const {authStatus, setAuthStatus} = useAuth();

    const handleAuthResult = (result) => {
        setAuthStatus(result.success);

        if (result.success) {
            alert("Auth success");
        } else {
            alert("Auth failed");
        }
    };

    return (
        <View style={styles.settingsPage}>
            <Pressable
                style={styles.settingsPageButton}
                onPress={() => auth.scanBarcode(handleAuthResult)}
            >
                <Text style={styles.settingsPageText}>
                    {authStatus ? "Connected" : "Connect"}
                </Text>
            </Pressable>

            <Pressable style={styles.settingsPageButton}>
                <Text style={styles.settingsPageText}>About</Text>
            </Pressable>
        </View>
    );
}