import pyautogui
import os

def volume_up():
    pyautogui.press("volumeup")

def volume_down():
    pyautogui.press("volumedown")

def mouseControl(x: int, y: int, isClick: bool):
    if isClick:
        pyautogui.click()
        return

    sensitivity = 50.0
    padding = 1

    current_x, current_y = pyautogui.position()
    screen_width, screen_height = pyautogui.size()

    target_x = current_x + x * sensitivity
    target_y = current_y + y * sensitivity

    target_x = max(
        padding,
        min(screen_width - 1 - padding, target_x)
    )

    target_y = max(
        padding,
        min(screen_height - 1 - padding, target_y)
    )

    pyautogui.moveTo(target_x, target_y)

def open_url(url: str):
    os.startfile(url)
