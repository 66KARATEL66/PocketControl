import { getUniqueId } from 'react-native-device-info'
import { DataScanner } from 'react-native-data-scanner'
import * as pako from "pako"

export let DATA = null;

export async function scanBarcode(handleAuthResult) {
    if (typeof handleAuthResult !== "function") {
        throw new TypeError("handleAuthResult must be a function");
    }

    const barcode = await DataScanner.scanBarcode({
        targetFormats: ['qr'],
        enableAutoZoom: true
    });

    if (barcode.value) {
        await auth(barcode.value, handleAuthResult);
    }
}

async function auth(barcode, handleAuthResult) {
    const data = decodeAuthData(barcode);

    const url = data.ip + data.authRequest;

    const body = {
        token: data.token,
        device_id: await getUniqueId()
    };

    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Authentication failed with status ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
        DATA = {
            commandRequest: data.ip + data.commandRequest,
            getCommandsRequest: data.ip + data.getCommandsRequest,
        }
    }

    handleAuthResult(result);

    return result.success;
}

function decodeAuthData(hex) {
    const bytes = new Uint8Array(
        hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );

    const decompressed = pako.inflate(bytes);

    const jsonString = new TextDecoder().decode(decompressed);

    return JSON.parse(jsonString);
}