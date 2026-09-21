import { styles } from '../stylesheet/styles'
import { View, Text } from "react-native"
import { DATA as authData } from '../data/auth'
import { getUniqueId } from 'react-native-device-info'
import { useEffect, useState, useRef } from 'react'


export function MouseControlPage({ item }) {
    const [position, setPosition] = useState({
        x: 0,
        y: 0
    });

    const [deviceId, setDeviceId] = useState(null);

    const sending = useRef(false);
    const pendingDelta = useRef(null);
    const ws = useRef(null);

    const touchStartTime = useRef(0);
    const isMoving = useRef(false);
    const lastTouchPosition = useRef(null);

    const HOLD_TIME = 300;

    const MOVE_THRESHOLD = 10;
    const touchStartPosition = useRef(null);

    // =========================
    // Mouse movement
    // =========================

    const sendPosition = (dx, dy, isClick = false) => {
        if (
            !deviceId ||
            !ws.current ||
            ws.current.readyState !== WebSocket.OPEN
        ) {
            return;
        }

        // Якщо попередня команда ще виконується,
        // накопичуємо рух замість його втрати.
        if (sending.current) {
            if (!pendingDelta.current) {
                pendingDelta.current = {
                    x: dx,
                    y: dy
                };
            } else {
                pendingDelta.current.x += dx;
                pendingDelta.current.y += dy;
            }

            return;
        }

        sending.current = true;

        ws.current.send(JSON.stringify({
            id: item.id,
            command: item.command,
            args: {
                x: dx,
                y: dy,
                isClick
            },
            device_id: deviceId
        }));
    };


    const onTouchMoveHandler = (e) => {
        const touch = e.nativeEvent.touches[0];

        if (!touch || !lastTouchPosition.current) {
            return;
        }

        const elapsed =
            Date.now() - touchStartTime.current;

        const dx =
            touch.pageX - lastTouchPosition.current.x;

        const dy =
            touch.pageY - lastTouchPosition.current.y;

        lastTouchPosition.current = {
            x: touch.pageX,
            y: touch.pageY
        };

        if (elapsed < HOLD_TIME) {
            return;
        }

        const totalDx =
            touch.pageX - touchStartPosition.current.x;

        const totalDy =
            touch.pageY - touchStartPosition.current.y;

        const distance = Math.sqrt(
            totalDx * totalDx +
            totalDy * totalDy
        );

        if (distance >= MOVE_THRESHOLD) {
            isMoving.current = true;
        }

        if (!isMoving.current) {
            return;
        }

        sendPosition(dx, dy);
    };

    // =========================
    // Touch
    // =========================

    const onTouchStartHandler = (e) => {
        const touch = e.nativeEvent.touches[0];

        const x = touch.pageX;
        const y = touch.pageY;

        touchStartTime.current = Date.now();
        isMoving.current = false;

        touchStartPosition.current = {
            x,
            y
        };

        lastTouchPosition.current = {
            x,
            y
        };
    };


    const onTouchEndHandler = () => {
        const elapsed =
            Date.now() - touchStartTime.current;

        if (
            elapsed < HOLD_TIME &&
            !isMoving.current
        ) {
            sendPosition(0, 0, true);
        }

        touchStartTime.current = 0;
        isMoving.current = false;
        lastTouchPosition.current = null;
        touchStartPosition.current = null;
    };


    // =========================
    // WebSocket
    // =========================

    useEffect(() => {
        const loadDeviceId = async () => {
            const id = await getUniqueId();
            setDeviceId(id);
        };

        const connectWebSocket = () => {
            ws.current = new WebSocket(
                authData.commandWebSocketRequest
            );

            ws.current.onopen = () => {
                console.log("WebSocket connected");
            };

            ws.current.onmessage = (event) => {
                const response = JSON.parse(event.data);

                if (!response.success) {
                    sending.current = false;
                    return;
                }

                sending.current = false;

                // Відправляємо весь рух,
                // який накопичився поки виконувалась команда.
                if (pendingDelta.current) {
                    const { x, y } = pendingDelta.current;

                    pendingDelta.current = null;

                    sendPosition(x, y);
                }
            };

            ws.current.onerror = (error) => {
                console.log("WebSocket error:", error);

                sending.current = false;
                pendingDelta.current = null;
            };

            ws.current.onclose = () => {
                console.log("WebSocket disconnected");

                sending.current = false;
                pendingDelta.current = null;
            };
        };

        loadDeviceId();
        connectWebSocket();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);


    // =========================
    // Render
    // =========================

    return (
        <View style={styles.trackPadContainer}>

            {/* <Text style={styles.trackPadContainerText}>
                Position: {position.x}, {position.y}
            </Text> */}

            <View style={styles.trackZone}>
                <View
                    style={styles.trackZoneActive}
                    pointerEvents="box-only"
                    onTouchStart={onTouchStartHandler}
                    onTouchMove={onTouchMoveHandler}
                    onTouchEnd={onTouchEndHandler}
                >
                    <Text
                        style={styles.trackZoneText}
                        pointerEvents="none"
                    >
                        Touch me
                    </Text>
                </View>
            </View>

        </View>
    );
}