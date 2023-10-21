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

from utils.utils import to_chunks
from utils.devices import Encoder, Key
from utils.system import System

supervisor.runtime.autoreload = False

SETTINGSFILE = "settings.json" # The file in which the settings are saved
MACROFILE = "macros.json" # The file in which the macros are saved
SLEEPTIME = 2 # Time in seconds until the display turns off
KEYBOARDLAYOUT = "us" # Supported keyboard layouts: br, cz, da, de, es, fr, hu, it, po, sw, tr, uk, us
USEUNICODEFONT = False # Use a unicode bitmap font, which will increas the initial load time!

try:
    with open(SETTINGSFILE, "r") as f:
        settings = json.loads(f.read())
        if "sleeptime" in settings:
            SLEEPTIME = settings["sleeptime"]
        if "keyboardlayout" in settings:
            KEYBOARDLAYOUT = settings["keyboardlayout"]
        if "useunicodefont" in settings:
            USEUNICODEFONT = settings["useunicodefont"]
except (OSError, json.JSONDecodeError):
    pass

if KEYBOARDLAYOUT == "br":
    from adafruit_hid.keyboard_layout_win_br import KeyboardLayout
    from adafruit_hid.keycode_win_br import Keycode
elif KEYBOARDLAYOUT == "cz":
    from adafruit_hid.keyboard_layout_win_cz import KeyboardLayout
    from adafruit_hid.keycode_win_cz import Keycode
elif KEYBOARDLAYOUT == "da":
    from adafruit_hid.keyboard_layout_win_da import KeyboardLayout
    from adafruit_hid.keycode_win_da import Keycode
elif KEYBOARDLAYOUT == "de":
    from adafruit_hid.keyboard_layout_win_de import KeyboardLayout
    from adafruit_hid.keycode_win_de import Keycode
elif KEYBOARDLAYOUT == "es":
    from adafruit_hid.keyboard_layout_win_es import KeyboardLayout
    from adafruit_hid.keycode_win_es import Keycode
elif KEYBOARDLAYOUT == "fr":
    from adafruit_hid.keyboard_layout_win_fr import KeyboardLayout
    from adafruit_hid.keycode_win_fr import Keycode
elif KEYBOARDLAYOUT == "hu":
    from adafruit_hid.keyboard_layout_win_hu import KeyboardLayout
    from adafruit_hid.keycode_win_hu import Keycode
elif KEYBOARDLAYOUT == "it":
    from adafruit_hid.keyboard_layout_win_it import KeyboardLayout
    from adafruit_hid.keycode_win_it import Keycode
elif KEYBOARDLAYOUT == "po":
    from adafruit_hid.keyboard_layout_win_po import KeyboardLayout
    from adafruit_hid.keycode_win_po import Keycode
elif KEYBOARDLAYOUT == "sw":
    from adafruit_hid.keyboard_layout_win_sw import KeyboardLayout
    from adafruit_hid.keycode_win_sw import Keycode
elif KEYBOARDLAYOUT == "tr":
    from adafruit_hid.keyboard_layout_win_tr import KeyboardLayout
    from adafruit_hid.keycode_win_tr import Keycode
elif KEYBOARDLAYOUT == "uk":
    from adafruit_hid.keyboard_layout_win_uk import KeyboardLayout
    from adafruit_hid.keycode_win_uk import Keycode
else:
    from adafruit_hid.keyboard_layout_us import KeyboardLayout
    from adafruit_hid.keycode import Keycode


class MacroApp():
    """ Main Class """
    def __init__(self) -> None:
        self.macropad = MacroPad(layout_class=KeyboardLayout)
        self.macropad.display.auto_refresh = False
        self.macropad.display.brightness = 0.1
        self.macropad.pixels.auto_write = False
        self.macropad.pixels.brightness = 0.1

        self.serial_data = usb_cdc.data
        self.serial_last_state = False
        
        self.settings = self._init_settings()
        self.macros = self._init_macros()
        self.keys = self._init_keys()
        self.toolbar = self._init_toolbar()
        self.encoder = Encoder(self.macropad)

        self.show_homescreen()

    def _init_settings(self) -> dict:
        """ initiate the settings json file

        Returns:
            dict: the json file as a dict
        """
        try:
            with open(SETTINGSFILE, "r") as f:
                return json.loads(f.read())
        except OSError:
            return {
                "keyboardlayout": "us",
                "sleeptime": 10
            }

    def _save_settings(self) -> None:
        """ store the settings in the settingsfile
        """
        with open(SETTINGSFILE, "w") as f:
            f.write(json.dumps(self.settings, separators=(",", ":")))

    def _init_macros(self) -> list[dict]:
        """ initiate the macro json file

        Returns:
            list[dict]: the json file as list of dicts
        """
        try:
            with open(MACROFILE, "r") as f:
                return json.loads(f.read())
        except OSError:
            return []
        
    def _save_macros(self) -> None:
        """ store the macros in the macrofile
        """
        with open(MACROFILE, "w") as f:
            f.write(json.dumps(self.macros, separators=(",", ":")))

    def _init_keys(self) -> list[Key]:
        """ Initiate the keys and a display group for each key

        Returns:
            list[Key]: a list of Keys
        """
        keys = []
        group = displayio.Group()

        for i in range(self.macropad.keys.key_count):
            label = Label(
                    font=load_font("/fonts/6x12.pcf") if USEUNICODEFONT else terminalio.FONT,
                    text="",
                    padding_top=1,
                    padding_bottom=2,
                    padding_left=4,
                    padding_right=4,
                    color=0xFFFFFF,
                    anchored_position=(
                        (self.macropad.display.width - 2) / 2 * (i % 3) + 1,
                        self.macropad.display.height / 4 * (i // 3) + 2),
                    anchor_point=((i % 3) / 2, 0.0)
                )
            
            keys.append(Key(self.macropad, i, label))
            group.append(label)

        self.macropad.display.root_group = group
        return keys

    def _init_toolbar(self) -> dict[str, Key]:
        """ Return a dict for the toolbar keys

        Returns:
            dict[str, Key]: position of key, Key
        """
        return {
            "left": self.keys[0],
            "center": self.keys[1],
            "right": self.keys[2],
        }

    def _init_group(self) -> None:
        """ initiate the group content
        """
        self._update_encoder_macros()

        self.tabs_content = list(to_chunks(self.group_stack[-1]["content"], 9))
        self._update_tab()
    
    def show_homescreen(self, *args) -> None:
        """ Show or return to Homescreen
        """
        self.current_tab = 0
        self.tabs_content = []
        self.tab_index_stack = []
        self.group_stack = [{
            "label": "Macros", 
            "content": self.macros
        }]
        self._init_group()

    def _set_toolbar(self, position:str, label:str, func:dict) -> None:
        """ set the label and function for the given toolbar key

        Args:
            position (str): ("left"|"center"|"right")
            label (str): the displayed label
            func (dict): the function that will be called on key press
        """
        self.toolbar[position].label = label
        self.toolbar[position].type = "macro"
        self.toolbar[position].color = (100, 100, 100)
        self.toolbar[position].set_func(func)

    def _update_toolbar(self) -> None:
        """ update the toolbar keys based on tab or folder hierarchy
        """
        if self.current_tab > 0:
            self._set_toolbar("left", "<-", self.prev_tab)
        elif len(self.group_stack) > 1:
            self._set_toolbar("left", "<-", self.close_group)
        else:
            self.toolbar["left"].clear_props()

        if len(self.group_stack) > 1 and self.current_tab > 0:
            self._set_toolbar("center", self.group_stack[-1]["label"], self.show_homescreen)
        else:
            self.toolbar["center"].clear_props()
            self.toolbar["center"].label = self.group_stack[-1]["label"]

        if len(self.tabs_content) > 1 and self.current_tab < len(self.tabs_content) - 1:
            self._set_toolbar("right", "->", self.next_tab)
        else:
            self.toolbar["right"].clear_props()

    def run_macro(self, item:dict, *args) -> None:
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
                        if key['kc'][:1] != "-" :
                            self.macropad.keyboard.press(key_code)
                        else:
                            self.macropad.keyboard.release(key_code)
                if 'ccc' in key:
                    control_code = getattr(ConsumerControlCode, key['ccc'].upper(), None)
                    if control_code:
                        self.macropad.consumer_control.press(control_code)
                        self.macropad.consumer_control.release()
                if 'mse' in key:
                    if "b" in key["mse"]:
                        btn = getattr(Mouse, f"{key['mse']['b'].upper()}_BUTTON", None)
                        if btn:
                            self.macropad.mouse.click(btn)
                    self.macropad.mouse.move(
                        key["mse"].get('x', 0),
                        key["mse"].get('y', 0),
                        key["mse"].get('w', 0))
                if 'sys' in key:
                    method = getattr(System, key['sys'], None)
                    if method:
                        method(self.macropad)
        
        self.macropad.keyboard.release_all()
        self.macropad.mouse.release_all()

    def open_group(self, item:dict, *args) -> None:
        """ open a group

        Args:
            item (dict): the group item containing data
        """
        self.tab_index_stack.append(self.current_tab)
        self.current_tab = 0

        self.group_stack.append(item)
        self._init_group()

    def close_group(self, *args) -> None:
        """ close a group and go a level up
        """
        self.current_tab = self.tab_index_stack.pop()

        self.group_stack.pop()
        self._init_group()

    def _update_tab(self) -> None:
        """ update the current displayed group tab 
        """
        for key in self.keys[3:]:
            key.clear_props()

        if len(self.tabs_content) > 0:
            for i, item in enumerate(self.tabs_content[self.current_tab], start=3):
                self.keys[i].type = item["type"]
                self.keys[i].label = item["label"] if item["type"] in ["group", "macro"] else ""
                self.keys[i].color = item["color"] if item["type"] in ["group", "macro"] else (0, 0, 0)
                self.keys[i].set_func(self._get_key_func(item["type"]), item)

        self._update_toolbar()

        for key in self.keys:
            key.update_colors()

    def next_tab(self, *args) -> None:
        """ increase the tab index and update the tab
        """
        if self.current_tab < len(self.tabs_content) - 1:
            self.current_tab += 1
            self._update_tab()

    def prev_tab(self, *args) -> None:
        """ decrease the tab index and update the tab
        """
        if self.current_tab > 0:
            self.current_tab -= 1 
            self._update_tab()

    def _get_key_func(self, type:str) -> function:
        """ get the specific function for the type

        Args:
            type (str): the item type (group|macro)

        Returns:
            function: return the function for type
        """
        key_funcs = {
            "group": self.open_group,
            "macro": self.run_macro
        }

        return key_funcs.get(type)

    def _update_encoder_macros(self) -> None:
        """ update the rotary encoder macros defined for opened group
        """
        self.encoder.update_encoder_macros(
            on_switch = self.group_stack[-1].get("encoder", {}).get("switch"),
            on_increased = self.group_stack[-1].get("encoder", {}).get("increased"),
            on_decreased = self.group_stack[-1].get("encoder", {}).get("decreased")
        )

    def _handle_serial_data(self, payload:str) -> dict:
        """ handle the data comming over the serial connection

        Args:
            payload (str): the data, as json string

        Returns:
            dict: response, sended over the serial connection
        """
        response = {}
        try:
            payload = json.loads(payload)

            if 'command' not in payload.keys():
                response['ERR'] = 'Wrong payload: %s' % payload
                return response

            command = payload['command']

            if command == 'get_settings':
                response['ACK'] = 'settings'
                response['CONTENT'] = self.settings
                return response
            
            elif command == 'set_settings':
                if 'content' not in payload.keys():
                    response['ERR'] = 'No content: %s' % payload
                    return response
                
                content = payload['content']
                self.settings = content

                try:
                    self._save_settings()
                    response['ACK'] = 'Settings are set'
                except OSError as e:
                    response['ERR'] = 'Cannot set settings because USB storage is enabled'

                return response

            elif command == 'get_macros':
                response['ACK'] = 'macros'
                response['CONTENT'] = self.macros
                return response
            
            elif command == 'set_macros':
                if 'content' not in payload.keys():
                    response['ERR'] = 'No content: %s' % payload
                    return response
                
                content = payload['content']
                self.macros = content
                self._display_on()
                self.show_homescreen()

                response['ACK'] = 'Macros received'
                return response
            
            elif command == 'save_macros':
                try:
                    self._save_macros()
                    response['ACK'] = 'Macros stored'
                except OSError as e:
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

    def _send_serial_data(self, payload:dict) -> None:
        """ prepare and send data over serial connection

        Args:
            payload (dict): the data
        """
        payloads = '%s\n' % json.dumps(payload, separators=(',', ':'))
        self.serial_data.write(bytearray(payloads.encode()))

    def _display_on(self) -> None:
        if self.macropad.display_sleep:
            self.macropad.display_sleep = False
        self.sleep_timer = time.monotonic()

    def start(self) -> None:
        """ Start the Mainloop
        """
        self.sleep_timer = time.monotonic()
        while True:
            if not self.macropad.display_sleep and time.monotonic() - self.sleep_timer > SLEEPTIME:
                self.macropad.display_sleep = True

            self.macropad.display.refresh()

            # send after the connection is established
            if self.serial_last_state != self.serial_data.connected:
                self.serial_last_state = self.serial_data.connected
                if self.serial_data.connected:
                    readonly = storage.getmount('/').readonly
                    self._send_serial_data({'ACK': 'usbenabled', 'CONTENT': readonly })

            if self.serial_data.connected:
                if self.serial_data.in_waiting > 0:
                    data = self.serial_data.readline()
                    self._send_serial_data(self._handle_serial_data(data.decode("utf-8").strip()))

                # get key events, so no inputs will be stored during connection
                # self.macropad.keys.events.get()
                # continue

            key_event = self.macropad.keys.events.get()
            if key_event:
                self._display_on()
                self.keys[key_event.key_number].pressed = True if key_event.pressed and not any([key.pressed for key in self.keys]) else False

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