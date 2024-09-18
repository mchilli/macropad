import microcontroller
import supervisor

USBENABLEDFILE = "usbenabled"

class System():
    def enable_usb(app=None) -> None:
        try:
            with open(USBENABLEDFILE, "a") as f: pass
            System.hard_reset()
        except Exception:
            pass

    def soft_reset(app=None) -> None:
        supervisor.reload()

    def hard_reset(app=None) -> None:
        microcontroller.reset()

    def close_group(app=None) -> None:
        app.close_group()

    def go_to_root(app=None) -> None:
        app.go_to_root()

    def decrease_brightness(app=None) -> None:
        if app.macropad.display.brightness > 0:
            brightness = (round(app.macropad.display.brightness * 10) - 1) / 10
            app.macropad.display.brightness = brightness
            app.macropad.pixels.brightness = brightness
            app.macropad.pixels.show()

    def increase_brightness(app=None) -> None:
        if app.macropad.display.brightness < 1:
            brightness = (round(app.macropad.display.brightness * 10) + 1) / 10
            app.macropad.display.brightness = brightness
            app.macropad.pixels.brightness = brightness
            app.macropad.pixels.show()