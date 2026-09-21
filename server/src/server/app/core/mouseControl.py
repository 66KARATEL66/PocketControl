import ctypes

user32 = ctypes.windll.user32

class POINT(ctypes.Structure):
    _fields_ = [
        ("x", ctypes.c_long),
        ("y", ctypes.c_long),
    ]


def get_mouse_position():
    point = POINT()
    user32.GetCursorPos(ctypes.byref(point))
    return point.x, point.y


def move_mouse(x: int, y: int):
    user32.SetCursorPos(x, y)


def click_mouse():
    user32.mouse_event(0x0002, 0, 0, 0, 0)  # left down
    user32.mouse_event(0x0004, 0, 0, 0, 0)  # left up


def mouseControl(x: int, y: int, isClick: bool):
    if isClick:
        click_mouse()
        return

    sensitivity = 25.0
    padding = 1

    current_x, current_y = get_mouse_position()

    screen_width = user32.GetSystemMetrics(0)
    screen_height = user32.GetSystemMetrics(1)

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

    move_mouse(int(target_x), int(target_y))