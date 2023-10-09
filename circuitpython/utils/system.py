import microcontroller
import supervisor
from adafruit_macropad import MacroPad

USBENABLEDFILE = "usbenabled"

class System():
    def enable_USB(macropad:MacroPad=None) -> None:
        try:
            with open(USBENABLEDFILE, "a") as f: pass
            System.hard_reset()
        except Exception:
            pass

    def soft_reset(macropad:MacroPad=None) -> None:
        supervisor.reload()

    def hard_reset(macropad:MacroPad=None) -> None:
        microcontroller.reset()

    def decrease_brightness(macropad:MacroPad=None) -> None:
        if macropad.display.brightness > 0:
            brightness = round(macropad.display.brightness * 10)
            macropad.display.brightness = (brightness - 1) / 10
            macropad.pixels.brightness = (brightness - 1) / 10
            macropad.pixels.show()

    def increase_brightness(macropad:MacroPad=None) -> None:
        if macropad.display.brightness < 1:
            brightness = round(macropad.display.brightness * 10)
            macropad.display.brightness = (brightness + 1) / 10
            macropad.pixels.brightness = (brightness + 1) / 10
            macropad.pixels.show()