# Third-party licenses and notices

PocketControl uses third-party software and resources. They remain under
their respective licenses; the root [`LICENSE`](LICENSE) applies only to
original PocketControl code and original project material.

Versions below are the resolved versions in `client/package-lock.json` and
`server/uv.lock` where applicable. This document is an attribution/reference
list, not a replacement for the license files distributed with the
dependencies.

## Dependencies

| Dependency | Version | Purpose | License | Source |
| --- | ---: | --- | --- | --- |
| Expo | 57.0.22 | Mobile/web application runtime and build tooling | MIT | https://github.com/expo/expo |
| Expo Router | 57.0.21 | File-based navigation | MIT | https://github.com/expo/router |
| React | 19.2.3 | Client UI runtime | MIT | https://github.com/facebook/react |
| React DOM | 19.2.3 | Web renderer | MIT | https://github.com/facebook/react |
| React Native | 0.86.3 | Native UI runtime | MIT | https://github.com/facebook/react-native |
| `@expo/vector-icons` | 15.1.1 | Header icons | MIT | https://github.com/expo/vector-icons |
| `expo-secure-store` | 57.0.4 | Native session storage | MIT | https://github.com/expo/expo |
| `expo-splash-screen` | 57.0.9 | Native splash screen configured in `client/app.json` | MIT | https://github.com/expo/expo |
| `react-native-data-scanner` | 0.1.2 | QR/barcode scanning | MIT | https://www.npmjs.com/package/react-native-data-scanner |
| `react-native-device-info` | 15.0.2 | Device identifier | MIT | https://github.com/react-native-device-info/react-native-device-info |
| `react-native-safe-area-context` | 5.7.0 | Safe-area layout | MIT | https://github.com/AppAndFlow/react-native-safe-area-context |
| `pako` | 3.0.2 | QR payload compression | MIT and Zlib | https://github.com/nodeca/pako |
| FastAPI | 0.141.1 | HTTP and WebSocket API | MIT | https://github.com/fastapi/fastapi |
| Uvicorn | 0.53.0 | ASGI server | BSD-3-Clause | https://github.com/encode/uvicorn |
| Pydantic | 2.13.5 | Request validation and data models | MIT | https://github.com/pydantic/pydantic |
| PyAutoGUI | 0.9.54 | Local mouse and keyboard control | BSD-3-Clause-style BSD | https://github.com/asweigart/pyautogui |
| qrcode | 8.2 | Pairing QR generation | BSD-3-Clause | https://github.com/lincolnloop/python-qrcode |

The client also declares native Expo and React Native support packages used by
the Expo build configuration and platform integration. Their license metadata
is recorded in `client/package-lock.json`; the packages are not relicensed by
PocketControl.

## Project license

Original PocketControl code and original project material are licensed under
the [MIT License](LICENSE). This license does not relicense third-party
dependencies or resources; those remain under their respective licenses.