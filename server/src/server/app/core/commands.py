import pyautogui
import os
from server.app.core.mouseControl import mouseControl as mouseControlCommand

def volume_up():
    pyautogui.press("volumeup")

def volume_down():
    pyautogui.press("volumedown")

def mouseControl(x: int, y: int, isClick: bool):
    mouseControlCommand(x, y, isClick)

def open_url(url: str):
    os.startfile(url)
