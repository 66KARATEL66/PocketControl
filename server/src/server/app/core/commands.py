import pyautogui
import os

def volume_up():
    pyautogui.press("volumeup")

def volume_down():
    pyautogui.press("volumedown")

def move_mouse(x: int, y: int):
    pyautogui.moveTo(x, y)

def open_url(url: str):
    os.startfile(url)