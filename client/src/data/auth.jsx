import { getUniqueId } from "react-native-device-info";
import { DataScanner } from "react-native-data-scanner";
import * as SecureStore from "expo-secure-store";
import * as pako from "pako";
import { Platform } from "react-native";

export const SESSION_STORAGE_KEY = "pocketcontrol.session";

async function getStoredValue() {
    if (Platform.OS === "web") {
        return globalThis.localStorage?.getItem(SESSION_STORAGE_KEY) || null;
    }
    return SecureStore.getItemAsync(SESSION_STORAGE_KEY);
}

async function setStoredValue(value) {
    if (Platform.OS === "web") {
        globalThis.localStorage?.setItem(SESSION_STORAGE_KEY, value);
        return;
    }
    await SecureStore.setItemAsync(SESSION_STORAGE_KEY, value);
}

async function deleteStoredValue() {
    if (Platform.OS === "web") {
        globalThis.localStorage?.removeItem(SESSION_STORAGE_KEY);
        return;
    }
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}

function createSession(data, deviceId) {
    return {
        deviceId,
        commandRequest: data.ip + data.commandRequest,
        getCommandsRequest: data.ip + data.getCommandsRequest,
        commandWebSocketRequest: data.ip.replace(/^http/, "ws") + data.commandWebSocketRequest,
    };
}

export async function scanBarcode() {
    const barcode = await DataScanner.scanBarcode({
        targetFormats: ["qr"],
        enableAutoZoom: true,
    });

    if (!barcode?.value) {
        throw new Error("No QR code was scanned");
    }

    return authenticate(barcode.value);
}

export async function authenticate(barcode) {
    const data = decodeAuthData(barcode);
    const deviceId = await getUniqueId();
    const response = await fetch(data.ip + data.authRequest, {
        method: "POST",
        body: JSON.stringify({
            token: data.token,
            device_id: deviceId,
        }),
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Authentication failed with status ${response.status}`);
    }

    const result = await response.json();
    if (result.success !== true) {
        throw new Error(result.reason || "Authentication was rejected");
    }

    return createSession(data, deviceId);
}

export async function loadStoredSession() {
    const rawSession = await getStoredValue();
    if (!rawSession) {
        return null;
    }

    try {
        const session = JSON.parse(rawSession);
        if (
            typeof session.deviceId !== "string" ||
            typeof session.commandRequest !== "string" ||
            typeof session.getCommandsRequest !== "string" ||
            typeof session.commandWebSocketRequest !== "string"
        ) {
            throw new Error("Stored authentication data is incomplete");
        }

        return session;
    } catch (error) {
        await clearStoredSession();
        throw new Error(`Stored authentication data is invalid: ${error.message}`);
    }
}

export async function saveSession(session) {
    await setStoredValue(JSON.stringify(session));
}

export async function clearStoredSession() {
    await deleteStoredValue();
}

function decodeAuthData(hex) {
    if (typeof hex !== "string" || !/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
        throw new Error("The scanned QR code is invalid");
    }

    const bytes = new Uint8Array(
        hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
    );
    const decompressed = pako.inflate(bytes);
    return JSON.parse(new TextDecoder().decode(decompressed));
}
