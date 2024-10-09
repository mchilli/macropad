"""
    @Author: MCHilli   <https://github.com/mchilli>
"""

import json
import time

import displayio
import terminalio
import storage
import supervisor
import usb_cdc

from adafruit_bitmap_font.bitmap_font import load_font
from adafruit_display_text.label import Label
from adafruit_macropad import MacroPad
from adafruit_hid.consumer_control_code import ConsumerControlCode
from adafruit_hid.mouse import Mouse

from utils.devices import Encoder, Key
from utils.system import System

supervisor.runtime.autoreload = False

VERSION = "1.3.0"
# The file in which the settings are saved
SETTINGSFILE = "settings.json"
# The file in which the macros are saved
MACROFILE = "macros.json"

SETTINGS = {
    # Time in seconds until the display turns off
    "sleeptime": 2,
    # Supported keyboard layouts: br, cz, da, de, es, fr, hu, it, po, sw, tr, uk, us
    "keyboardlayout": "us",
    # Use a unicode bitmap font, which will increas the initial load time!
    "useunicodefont": False,
    # Flips the rotation of the device by 180 degrees
    "fliprotation": False,
    # Set the LCD and LED Brightness
    "brightness": 0.1
}

try:
    with open(SETTINGSFILE, "r") as f:
        settings = json.load(f)
        for key in SETTINGS:
            if key in settings:
                SETTINGS[key] = settings[key]
except Exception:
    pass

if SETTINGS["keyboardlayout"] == "br":
    from adafruit_hid.keyboard_layout_win_br import KeyboardLayout
    from adafruit_hid.keycode_win_br import Keycode
elif SETTINGS["keyboardlayout"] == "cz":
    from adafruit_hid.keyboard_layout_win_cz import KeyboardLayout
    from adafruit_hid.keycode_win_cz import Keycode
elif SETTINGS["keyboardlayout"] == "da":
    from adafruit_hid.keyboard_layout_win_da import KeyboardLayout
    from adafruit_hid.keycode_win_da import Keycode
elif SETTINGS["keyboardlayout"] == "de":
    from adafruit_hid.keyboard_layout_win_de import KeyboardLayout
    from adafruit_hid.keycode_win_de import Keycode
elif SETTINGS["keyboardlayout"] == "es":
    from adafruit_hid.keyboard_layout_win_es import KeyboardLayout
    from adafruit_hid.keycode_win_es import Keycode
elif SETTINGS["keyboardlayout"] == "fr":
    from adafruit_hid.keyboard_layout_win_fr import KeyboardLayout
    from adafruit_hid.keycode_win_fr import Keycode
elif SETTINGS["keyboardlayout"] == "hu":
    from adafruit_hid.keyboard_layout_win_hu import KeyboardLayout
    from adafruit_hid.keycode_win_hu import Keycode
elif SETTINGS["keyboardlayout"] == "it":
    from adafruit_hid.keyboard_layout_win_it import KeyboardLayout
    from adafruit_hid.keycode_win_it import Keycode
elif SETTINGS["keyboardlayout"] == "po":
    from adafruit_hid.keyboard_layout_win_po import KeyboardLayout
    from adafruit_hid.keycode_win_po import Keycode
elif SETTINGS["keyboardlayout"] == "sw":
    from adafruit_hid.keyboard_layout_win_sw import KeyboardLayout
    from adafruit_hid.keycode_win_sw import Keycode
elif SETTINGS["keyboardlayout"] == "tr":
    from adafruit_hid.keyboard_layout_win_tr import KeyboardLayout
    from adafruit_hid.keycode_win_tr import Keycode
elif SETTINGS["keyboardlayout"] == "uk":
    from adafruit_hid.keyboard_layout_win_uk import KeyboardLayout
    from adafruit_hid.keycode_win_uk import Keycode
else:
    from adafruit_hid.keyboard_layout_us import KeyboardLayout
    from adafruit_hid.keycode import Keycode


class MacroApp():
    """ Main Class """

    def __init__(self) -> None:
        self.macropad = MacroPad(
            layout_class=KeyboardLayout,
            rotation=180 if SETTINGS["fliprotation"] else 0
        )

        self.macropad.display.auto_refresh = False
        self.macropad.display.brightness = SETTINGS["brightness"]
        self.macropad.display.root_group = displayio.Group()

        self.macropad.pixels.auto_write = False
        self.macropad.pixels.brightness = SETTINGS["brightness"]

        self.readonly = storage.getmount('/').readonly
        self.serial_data = usb_cdc.data
        self.serial_last_state = False

        self.macroStack = [self._init_macros()]
        self.keys = self._init_keys()
        self.group_label = self._init_group_label()
        self.encoder = Encoder(self.macropad)

        self._init_group()

    def _save_settings(self, new_settings) -> None:
        """ store the new settings in the settingsfile
        """
        if self.readonly:
            return False
        with open(SETTINGSFILE, "w") as f:
            json.dump(new_settings, f, separators=(",", ":"))
        return True

    def _init_macros(self) -> list[dict]:
        """ initiate the macro json file

        Returns:
            dict: the json file as dict
        """
        rootLabel = "Macros"
        try:
            with open(MACROFILE, "r") as f:
                macros = json.load(f)
                if isinstance(macros, list):
                    return {
                        "label": rootLabel,
                        "content": macros,
                    }
                return macros
        except OSError:
            return {
                "label": rootLabel,
                "content": [],
            }

    def _save_macros(self) -> None:
        """ store the macros in the macrofile
        """
        if self.readonly:
            return False
        with open(MACROFILE, "w") as f:
            json.dump(self.macroStack[0], f, separators=(",", ":"))
        return True

    def _init_group_label(self) -> dict[str, Key]:
        group_label = Label(
            font=load_font(
                "/fonts/6x12.pcf") if SETTINGS["useunicodefont"] else terminalio.FONT,
            text="",
            padding_top=0,
            padding_bottom=0,
            padding_left=0,
            padding_right=0,
            color=0xFFFFFF,
            anchored_position=(self.macropad.display.width // 2,
                               self.macropad.display.height - 10),
            anchor_point=(0.5, 0.0)
        )

        self.macropad.display.root_group.append(group_label)

        return group_label

    def _init_keys(self) -> list[Key]:
        """ Initiate the keys and a display group for each key

        Returns:
            list[Key]: a list of Keys
        """
        keys = []

        for i in range(self.macropad.keys.key_count):
            label = Label(
                font=load_font(
                    "/fonts/6x12.pcf") if SETTINGS["useunicodefont"] else terminalio.FONT,
                text="",
                padding_top=0,
                padding_bottom=1,
                padding_left=4,
                padding_right=4,
                color=0xFFFFFF,
                anchored_position=(
                    (self.macropad.display.width - 2) / 2 * (i % 3) + 1,
                    self.macropad.display.height / 5 * (i // 3) + 2),
                anchor_point=((i % 3) / 2, 0.0)
            )

            keys.append(Key(self.macropad, i, label))
            self.macropad.display.root_group.append(label)

        return keys

    def _init_group(self) -> None:
        """ initiate the group content
        """
        self._update_encoder_macros()

        self._update_tab()

    def run_macro(self, item: dict, *args) -> None:
        """ run the macro, can be:
                Float (e.g. 0.25): delay in seconds
                String (e.g. "Foo"): corresponding keys pressed & released
                Dict {}: 
                    'kc': Keycodes (e.g. "SHIFT"): key pressed | (e.g. "-SHIFT"): key released
                    'ccc': Consumer Control codes (e.g. "MUTE")
                    'mse': Dict {}: 
                        'x': horizontally Mouse movement (e.g. 10 | -10)
                        'y': vertically Mouse movement (e.g. 10 | -10)
                        'w': Mousewheel movement (e.g. 1 | -1)
                        'b': Buttoncodes (e.g. "LEFT")
                    'sys': System Class Methodname

        Args:
            item (dict): the macro item containing data
        """
        for key in item["content"]:
            if isinstance(key, float):
                time.sleep(key)
            elif isinstance(key, str):
                self.macropad.keyboard_layout.write(key)
            elif isinstance(key, dict):
                if 'kc' in key:
                    key_name = key['kc'][1:] if key['kc'][:1] == "-" else key['kc']
                    key_code = getattr(Keycode, key_name.upper(), None)
                    if key_code:
                        if key['kc'][:1] != "-":
                            self.macropad.keyboard.press(key_code)
                        else:
                            self.macropad.keyboard.release(key_code)
                if 'ccc' in key:
                    control_code = getattr(
                        ConsumerControlCode, key['ccc'].upper(), None)
                    if control_code:
                        self.macropad.consumer_control.press(control_code)
                        self.macropad.consumer_control.release()
                if 'tone' in key:
                    self.macropad.play_tone(
                        key['tone']['frequency'], key['tone']['duration'])
                if 'mse' in key:
                    if "b" in key["mse"]:
                        btn = getattr(
                            Mouse, f"{key['mse']['b'].upper()}_BUTTON", None)
                        if btn:
                            self.macropad.mouse.click(btn)
                    self.macropad.mouse.move(
                        key["mse"].get('x', 0),
                        key["mse"].get('y', 0),
                        key["mse"].get('w', 0))
                if 'sys' in key:
                    method = getattr(System, key['sys'], None)
                    if method:
                        method(self)

        self.macropad.keyboard.release_all()
        self.macropad.mouse.release_all()

    def open_group(self, item: dict, *args) -> None:
        """ open a group

        Args:
            item (dict): the group item containing data
        """

        self.macroStack.append(item)
        self._init_group()

    def close_group(self, *args) -> None:
        """ close a group and go a level up
        """
        if len(self.macroStack) > 1:
            self.macroStack.pop()
            self._init_group()

    def go_to_root(self, *args) -> None:
        """ close a group and go to root
        """
        del self.macroStack[1:]
        self._init_group()

    def _update_tab(self) -> None:
        """ update the current displayed group tab 
        """
        for key in self.keys:
            key.clear_props()

        for i, item in enumerate(self.macroStack[-1]["content"][:self.macropad.keys.key_count]):
            self.keys[i].type = item["type"]
            self.keys[i].label = "" if item["type"] == "blank" else item["label"]
            self.keys[i].color = (
                0, 0, 0) if item["type"] == "blank" else item["color"]
            self.keys[i].set_func(self._get_key_func(item["type"]), item)

        self.group_label.text = self.macroStack[-1]["label"]

        for key in self.keys:
            key.update_colors()

    def _get_key_func(self, type: str) -> function:
        """ get the specific function for the type

        Args:
            type (str): the item type

        Returns:
            function: return the function for type
        """
        key_funcs = {
            "blank": None,
            "group": self.open_group
        }

        return key_funcs.get(type, self.run_macro)

    def _update_encoder_macros(self) -> None:
        """ update the rotary encoder macros defined for opened group
        """
        self.encoder.update_encoder_macros(
            on_switch=self.macroStack[-1].get("encoder", {}).get("switch"),
            on_increased=self.macroStack[-1].get("encoder",
                                                 {}).get("increased"),
            on_decreased=self.macroStack[-1].get("encoder",
                                                 {}).get("decreased")
        )

    def _handle_serial_data(self, payload: object) -> dict:
        """ handle the data comming over the serial connection

        Args:
            payload (object): the data

        Returns:
            dict: response, sended over the serial connection
        """
        response = {}
        try:
            if 'command' not in payload.keys():
                response['ERR'] = 'Wrong payload: %s' % payload
                return response

            command = payload['command']

            if command == 'get_settings':
                response['ACK'] = 'settings'
                response['CONTENT'] = SETTINGS
                return response

            elif command == 'set_settings':
                if 'content' not in payload.keys():
                    response['ERR'] = 'No content: %s' % payload
                    return response

                content = payload['content']

                if self._save_settings(content):
                    response['ACK'] = 'Settings are set'
                else:
                    response['ERR'] = 'Cannot set settings because USB storage is enabled'

                return response

            elif command == 'get_macros':
                response['ACK'] = 'macros'
                response['CONTENT'] = self.macroStack[0]
                return response

            elif command == 'set_macros':
                if 'content' not in payload.keys():
                    response['ERR'] = 'No content: %s' % payload
                    return response

                content = payload['content']
                self.macroStack = [content]
                self._display_on()
                self._init_group()

                response['ACK'] = 'Macros received'
                return response

            elif command == 'save_macros':
                if self._save_macros():
                    response['ACK'] = 'Macros stored'
                else:
                    response['ERR'] = 'Cannot store macros because USB storage is enabled'

                return response

            elif command == 'enable_usb':
                System.enable_usb()

                response['ACK'] = 'Enable USB'
                return response

            elif command == 'soft_reset':
                System.soft_reset()

                response['ACK'] = 'Softreset'
                return response

            elif command == 'hard_reset':
                System.hard_reset()

                response['ACK'] = 'Hardreset'
                return response

            else:
                response['ERR'] = 'Unkown command: %s' % command
                return response
        except Exception as e:
            response['ERR'] = str(e)
            return response

    def _send_serial_data(self, payload: dict) -> None:
        """ prepare and send data over serial connection

        Args:
            payload (dict): the data
        """
        json.dump(payload, self.serial_data, separators=(',', ':'))
        self.serial_data.write('\n')

    def _display_on(self) -> None:
        """ Turn on the display if it's in sleep mode and reset the sleep timer.
        """
        if self.macropad.display_sleep:
            self.macropad.display_sleep = False
        self.sleep_timer = time.monotonic()

    def start(self) -> None:
        """ Start the Mainloop
        """
        self.sleep_timer = time.monotonic()
        self.active_key = None
        while True:
            if not self.macropad.display_sleep and time.monotonic() - self.sleep_timer > SETTINGS["sleeptime"]:
                self.macropad.display_sleep = True

            self.macropad.display.refresh()

            # send after the connection is established
            if self.serial_last_state != self.serial_data.connected:
                self.serial_last_state = self.serial_data.connected
                if self.serial_data.connected:
                    self._send_serial_data(
                        {'ACK': 'version', 'CONTENT': VERSION})
                    self._send_serial_data(
                        {'ACK': 'usbenabled', 'CONTENT': self.readonly})

            if self.serial_data.connected:
                if self.serial_data.in_waiting > 0:
                    self._send_serial_data(
                        self._handle_serial_data(json.load(self.serial_data)))

                # get key events, so no inputs will be stored during connection
                # self.macropad.keys.events.get()
                # continue

            key_event = self.macropad.keys.events.get()
            if key_event:
                self._display_on()
                if key_event.pressed and not any([key.pressed for key in self.keys]):
                    self.keys[key_event.key_number].pressed = True
                    self.active_key = key_event.key_number
                    self.active_key_delay = time.monotonic()

                elif key_event.released and key_event.key_number == self.active_key:
                    self.keys[key_event.key_number].pressed = False
                    self.active_key = None
            
            # if a key is pressed continuously, the function triggers again after a short delay
            if self.active_key and time.monotonic() - self.active_key_delay > 0.75:
                self._display_on()
                self.keys[self.active_key].call_func()

            if self.encoder.switch and self.encoder.on_switch:
                self._display_on()
                self.run_macro({
                    "content": self.encoder.on_switch
                })
            if self.encoder.increased and self.encoder.on_increased:
                self._display_on()
                self.run_macro({
                    "content": self.encoder.on_increased
                })
            if self.encoder.decreased and self.encoder.on_decreased:
                self._display_on()
                self.run_macro({
                    "content": self.encoder.on_decreased
                })


app = MacroApp()
app.start()
