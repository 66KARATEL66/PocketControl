import { View, Text, Pressable } from 'react-native'
import { styles } from "../stylesheet/styles"
import { DataScanner } from 'react-native-data-scanner'
import * as pako from "pako"
import { getUniqueId } from 'react-native-device-info'
import { useState } from 'react'

export function SettingsPage() {
    const [authStatus, setAuthStatus] = useState(null);

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
                onPress={() => scanBarcode(handleAuthResult)}
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

async function scanBarcode(handleAuthResult) {
    const barcode = await DataScanner.scanBarcode({
        targetFormats: ['qr'],
        enableAutoZoom: true
    });

    if (barcode.value) {
        console.log ("QR is scanned")
        await auth(barcode.value, handleAuthResult);
    }
}

async function auth(barcode, setAuthStatus)
{
    const data = decodeAuthData(barcode);

    const url = data.ip + data.request;

    const body = {
        token: data.token,
        device_id: await getUniqueId()
    };

    console.log("Sent post request")
    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    });

    console.log("AUTH STATUS:", response.status);

    const result = await response.json();

    console.log("AUTH RESPONSE:", result);

    setAuthStatus(result);

    return result.success;
}

function decodeAuthData(hex)
{
    const bytes = new Uint8Array(
        hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );

    const decompressed = pako.inflate(bytes);

    const jsonString = new TextDecoder().decode(decompressed);

    console.log("QR decoded");

    return JSON.parse(jsonString);
}