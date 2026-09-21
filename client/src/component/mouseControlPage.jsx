import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import { getUniqueId } from "react-native-device-info";
import { useAuth } from "../data/context";
import { styles } from "../stylesheet/styles";

const HOLD_TIME = 300;
const MOVE_THRESHOLD = 10;
const MAX_RECONNECT_ATTEMPTS = 5;

export function MouseControlPage({ commandName: commandNameProp }) {
    const { session } = useAuth();
    const params = useLocalSearchParams();
    const routeCommandName = Array.isArray(params.command) ? params.command[0] : params.command;
    const commandName = commandNameProp || routeCommandName;
    const [connectionStatus, setConnectionStatus] = useState("connecting");
    const deviceId = useRef(null);
    const ws = useRef(null);
    const reconnectTimer = useRef(null);
    const reconnectAttempts = useRef(0);
    const sending = useRef(false);
    const pendingDelta = useRef(null);
    const touchStartTime = useRef(0);
    const isMoving = useRef(false);
    const lastTouchPosition = useRef(null);
    const touchStartPosition = useRef(null);

    const sendPosition = (dx, dy, isClick = false) => {
        if (ws.current?.readyState !== WebSocket.OPEN || !deviceId.current) {
            return;
        }

        if (sending.current) {
            if (!pendingDelta.current) {
                pendingDelta.current = { x: dx, y: dy };
            } else {
                pendingDelta.current.x += dx;
                pendingDelta.current.y += dy;
            }
            return;
        }

        sending.current = true;
        ws.current.send(JSON.stringify({
            id: `${Date.now()}-${Math.random()}`,
            command: commandName,
            args: { x: dx, y: dy, isClick },
            device_id: deviceId.current,
        }));
    };

    const connectWebSocket = () => {
        if (!session?.commandWebSocketRequest) {
            setConnectionStatus("disconnected");
            return;
        }

        setConnectionStatus("connecting");
        const socket = new WebSocket(session.commandWebSocketRequest);
        ws.current = socket;

        socket.onopen = () => {
            reconnectAttempts.current = 0;
            socket.send(JSON.stringify({ type: "auth", device_id: deviceId.current }));
        };

        socket.onmessage = (event) => {
            const response = JSON.parse(event.data);
            if (response.type === "auth") {
                if (response.success) {
                    setConnectionStatus("connected");
                } else {
                    setConnectionStatus("disconnected");
                    socket.close();
                }
                return;
            }

            sending.current = false;
            if (response.success && pendingDelta.current) {
                const { x, y } = pendingDelta.current;
                pendingDelta.current = null;
                sendPosition(x, y);
            }
        };

        socket.onerror = () => {
            setConnectionStatus("disconnected");
        };

        socket.onclose = () => {
            sending.current = false;
            pendingDelta.current = null;
            if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
                setConnectionStatus("disconnected");
                return;
            }

            reconnectAttempts.current += 1;
            const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
            reconnectTimer.current = setTimeout(connectWebSocket, delay);
        };
    };

    useEffect(() => {
        let mounted = true;
        getUniqueId().then((id) => {
            if (mounted) {
                deviceId.current = id;
                connectWebSocket();
            }
        });

        return () => {
            mounted = false;
            clearTimeout(reconnectTimer.current);
            reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS;
            ws.current?.close();
        };
    }, [session?.commandWebSocketRequest, commandName]);

    const onTouchStart = (event) => {
        const touch = event.nativeEvent.touches[0];
        if (!touch) return;
        touchStartTime.current = Date.now();
        isMoving.current = false;
        touchStartPosition.current = { x: touch.pageX, y: touch.pageY };
        lastTouchPosition.current = { x: touch.pageX, y: touch.pageY };
    };

    const onTouchMove = (event) => {
        const touch = event.nativeEvent.touches[0];
        if (!touch || !lastTouchPosition.current || !touchStartPosition.current) return;

        const dx = touch.pageX - lastTouchPosition.current.x;
        const dy = touch.pageY - lastTouchPosition.current.y;
        lastTouchPosition.current = { x: touch.pageX, y: touch.pageY };

        if (Date.now() - touchStartTime.current < HOLD_TIME) return;
        const totalDx = touch.pageX - touchStartPosition.current.x;
        const totalDy = touch.pageY - touchStartPosition.current.y;
        if (Math.hypot(totalDx, totalDy) >= MOVE_THRESHOLD) {
            isMoving.current = true;
        }
        if (isMoving.current) sendPosition(dx, dy);
    };

    const onTouchEnd = () => {
        if (Date.now() - touchStartTime.current < HOLD_TIME && !isMoving.current) {
            if (connectionStatus !== "connected") {
                Alert.alert("Mouse control disconnected", "Reconnect before clicking.");
            } else {
                sendPosition(0, 0, true);
            }
        }
        touchStartTime.current = 0;
        isMoving.current = false;
        lastTouchPosition.current = null;
        touchStartPosition.current = null;
    };

    return (
        <View style={styles.trackPadContainer}>
            <Text style={styles.connectionStatus}>Mouse control: {connectionStatus}</Text>
            <View style={styles.trackZone}>
                <View
                    style={styles.trackZoneActive}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <Text style={styles.trackZoneText}>Touch me</Text>
                </View>
            </View>
        </View>
    );
}
