import { getUniqueId } from 'react-native-device-info'

export var DATA;

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

    const url = data.ip + data.authRequest;

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

    if(result.success)
    {
        DATA = {
            commandRequest: data.ip + data.commandRequest,
            getCommandsRequest: data.ip + data.getCommandsRequest,
        }
    }

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