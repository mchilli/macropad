"""
    @Author: MCHilli   <https://github.com/mchilli>
"""

import gc
import json
import time

import displayio
import terminalio
import storage
import supervisor
import usb_cdc

from adafruit_bitmap_font.bitmap_font import load_font
from adafruit_display_text.bitmap_label import Label
from adafruit_macropad import MacroPad
from adafruit_hid.consumer_control_code import ConsumerControlCode
from adafruit_hid.mouse import Mouse

from utils.devices import Encoder, Key
from utils.system import System
from utils.utils import get_audio_files

gc.enable()
supervisor.runtime.autoreload = False

VERSION = "1.5.0"
# The file in which the settings are saved
SETTINGSFILE = "settings.json"
# The file in which the macros are saved
MACROFILE = "macros.json"
# The default root configuration
MACRODEFAULT = "{\"type\":\"group\",\"label\":\"Macros\",\"content\":[false,false,false,false,false,false,false,false,false,false,false,false],\"encoder\":{\"switch\":[],\"increased\":[],\"decreased\":[]}}"
# The memory limit on which the garbage collector fired
MEMORYLIMIT = 18000
# The byte size to read out the serial data after a transfer error
READOUTSIZE = 64

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
    "brightness": 0.1,
    # Invert the LCD colors (white on black)
    "invertcolors": False
}

try:
    with open(SETTINGSFILE, "rb") as f:
        SETTINGS.update(json.load(f))
except OSError:
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

        self.encoder = Encoder(self.macropad)

        self.delayed_macros = []

        self.pitch_bend = 8192  # MIDI Pitch Bend Center

        self._init_keys()
        self._init_group_label()
        
        self._init_macros()

    def _save_settings(self, new_settings) -> None:
        """ store the new settings in the settingsfile
        """
        if self.readonly:
            return False
        with open(SETTINGSFILE, "w") as f:
            json.dump(new_settings, f, separators=(",", ":"))
        return True

    def _init_macros(self) -> None:
        """ initiate the macros
        """
        self.macro_store = {}
        self.group_stack = ["0"]

        try:
            with open(MACROFILE, "r") as f:
                self.macro_store = json.load(f)
        except Exception:
            self.macro_store = {"0": MACRODEFAULT}

        self._init_group()

    def _save_macros(self) -> bool:
        """ store the macros in the macro file
        """ 
        if self.readonly:
            return False
        
        with open(MACROFILE, "w") as f:
            f.write("{\n")
            for i, (key_id, macro) in enumerate(self.macro_store.items()):
                macro_str = str(macro).replace("\"", "\\\"")
                f.write("\"%s\":\"%s\"" % (key_id, macro_str))
                if i < len(self.macro_store) - 1:
                    f.write(",\n")
            f.write("\n}")
        return True

    def _init_group_label(self) -> None:
        """ Initialize and add a centered label to the display
        """
        self.group_label = Label(
            font=load_font(
                "/fonts/6x12.pcf") if SETTINGS["useunicodefont"] else terminalio.FONT,
            text="",
            padding_top=0,
            padding_bottom=0,
            padding_left=0,
            padding_right=0,
            color=0xffffff,
            anchored_position=(
                self.macropad.display.width // 2,
                self.macropad.display.height - 10),
            anchor_point=(0.5, 0.0)
        )

        self.macropad.display.root_group.append(self.group_label)

    def _init_keys(self) -> None:
        """ Initiate the keys and a display group for each key
        """
        self.keys = []

        for i in range(self.macropad.keys.key_count):
            label = Label(
                font=load_font(
                    "/fonts/6x12.pcf") if SETTINGS["useunicodefont"] else terminalio.FONT,
                text="",
                padding_top=0,
                padding_bottom=1,
                padding_left=4,
                padding_right=4,
                color=0xffffff,
                anchored_position=(
                    (self.macropad.display.width - 2) / 2 * (i % 3) + 1,
                     self.macropad.display.height / 5 * (i // 3) + 2),
                anchor_point=((i % 3) / 2, 0.0)
            )

            self.keys.append(Key(self.macropad, i, label))
            self.macropad.display.root_group.append(label)

    def _init_group(self) -> None:
        """ initiate the group content
        """
        self._update_encoder_macros()
        self._update_tab()

        gc.collect()

    def _add_delayed_macro(self, key_id:str, start_index:int, key_pressed:bool, delay:float) -> None:
        """ add a macro to the sleep stack for delayed execution and keep it sorted by execution time

        Args:
            key_id (str): the key id
            start_index (int): the index to start the macro from
            key_pressed (bool): True if the key is pressed, False if released
            delay (float): delay in seconds
        """
        self.delayed_macros.append((key_id, start_index, key_pressed, time.monotonic() + delay))
        self.delayed_macros.sort(key=lambda x: x[3])

    def run_macro_press_and_release(self, item:tuple[str, list], *args) -> None:
        """ run the macro without checking for pressed or released state

        Args:
            item (key_id:str, content:list): the key id and content data
        """
        self.run_macro(item, key_pressed=True)
        self.run_macro(item, key_pressed=False)

    def run_macro(self, item:tuple[str, list], start_index:int = 0, key_pressed:bool = False, *args) -> None:
        """ run the macro, can be:
                Int | Float (e.g. 0.25): delay in seconds
                String (e.g. "Foo"): corresponding keys pressed & released
                Dict {}: 
                    'kc': Keycodes (e.g. "SHIFT"): key pressed | (e.g. "-SHIFT"): key released
                    'ccc': Consumer Control codes (e.g. "MUTE")
                    'mse': Dict {}: 
                        'x': horizontally Mouse movement (e.g. 10 | -10)
                        'y': vertically Mouse movement (e.g. 10 | -10)
                        'w': Mousewheel movement (e.g. 1 | -1)
                        'b': Buttoncodes (e.g. "LEFT")
                    'tone': Dict {}: 
                        'frequency': frequency of the tone in Hz (e.g. 880)
                        'duration': duration of the tone in seconds (e.g. 0.25)
                    'file': Dict {}: 
                        'file': the mono audio file (e.g. audio/*.mp3|*.wav)
                    'midi': Dict {}: 
                        'ntson': NoteOn notes separated by comma (e.g. "60,62,64")
                            'vlcty': velocity for NoteOn (e.g. 127)
                            'durtn': duration of the note in seconds (e.g. 0.5)
                        'ntoff': NoteOff notes separated by comma (e.g. "60,62,64")
                        'ptchb': Pitch Bend command ("set" | "incr" | "decr")
                            'pbval': Pitch Bend value (0 - 16383)
                        'ctrch': Control Change number (e.g. 7)
                            'ccval': Control Change value (0 - 127)
                        'prgch': Program Change number (0 - 127)
                    'sys': System Class Methodname

        Args:
            item (key_id:str, content:list): the key id and content data
        """
        for index, key in enumerate(item[1]):
            if index < start_index:
                continue
            if isinstance(key, (int, float)) and key_pressed:
                if key < 0:
                    self._add_delayed_macro(item[0], index + 1, key_pressed, abs(key))
                    break
                else:
                    time.sleep(key)
            elif isinstance(key, str) and key_pressed:
                try:
                    self.macropad.keyboard_layout.write(key)
                except ValueError:
                    # if any of the characters has no keycode
                    pass
            elif isinstance(key, dict):
                if 'kc' in key:
                    key_codes = [
                        getattr(Keycode, key_name, None)
                        for key_name in key['kc'].lstrip('-+').upper().split(',')
                        if getattr(Keycode, key_name, None) is not None
                    ]
                    if key_codes:
                        if key_pressed:
                            if key['kc'] == 'RELALL':
                                # release all keys
                                self.macropad.keyboard.release_all()
                            elif key['kc'][0] == '+':
                                # tap keys
                                self.macropad.keyboard.press(*key_codes)
                                self.macropad.keyboard.release(*key_codes)
                            elif key['kc'][0] == '-':
                                # release keys
                                self.macropad.keyboard.release(*key_codes)
                            else:
                                # press keys
                                self.macropad.keyboard.press(*key_codes)
                        else:
                            # release keys after the key is released
                            self.macropad.keyboard.release(*key_codes)
                elif 'ccc' in key:
                    control_code = getattr(
                        ConsumerControlCode, key['ccc'].lstrip('-+').upper(), None)
                    if control_code:
                        if key_pressed:
                            if key['ccc'][0] == '+':
                                # tap key
                                self.macropad.consumer_control.press(control_code)
                                self.macropad.consumer_control.release()
                            elif key['ccc'][0] == '-':
                                # release key
                                self.macropad.consumer_control.release()
                            else:
                                # press key
                                self.macropad.consumer_control.press(control_code)
                        else:
                            # release key after the key is released
                            self.macropad.consumer_control.release()
                elif 'mse' in key:
                    if key_pressed:
                        if "b" in key["mse"]:
                            btn = getattr(
                                Mouse, f"{key['mse']['b'].upper()}_BUTTON", None)
                            if btn:
                                self.macropad.mouse.click(btn)
                        self.macropad.mouse.move(
                            key["mse"].get('x', 0),
                            key["mse"].get('y', 0),
                            key["mse"].get('w', 0))
                    else:
                        self.macropad.mouse.release_all()
                elif 'tone' in key:
                    if key_pressed and key['tone']['duration'] > 0:
                        # play tone for a specific duration
                        self.macropad.play_tone(
                            key['tone']['frequency'], key['tone']['duration'])
                    elif key_pressed:
                        # start tone until stopped
                        self.macropad.start_tone(key['tone']['frequency'])
                    else:
                        # stop tone
                        self.macropad.stop_tone()
                elif 'file' in key:
                    if key_pressed:
                        try:
                            self.macropad.play_file(key['file'])
                        except Exception:
                            pass
                elif 'midi' in key:
                    if 'ntson' in key['midi']:
                        notes = key['midi']['ntson'].upper().split(',')
                        velocity = key['midi']['vlcty']
                        duration = key['midi']['durtn']
                        if key_pressed and duration > 0:
                            self.macropad.midi.send(
                                self._get_midi_notes(notes, 'on', velocity))
                            time.sleep(key['midi']['durtn'])
                            self.macropad.midi.send(
                                self._get_midi_notes(notes, 'off', velocity))
                        elif key_pressed:
                            self.macropad.midi.send(
                                self._get_midi_notes(notes, 'on',velocity))
                        elif duration == 0:
                            self.macropad.midi.send(
                                self._get_midi_notes(notes, 'off', 0))
                    elif 'ntoff' in key['midi']:
                        notes = key['midi']['ntoff'].upper().split(',')
                        if key_pressed:
                            self.macropad.midi.send(
                                self._get_midi_notes(notes, 'off', 0))
                    elif 'ptchb' in key['midi']:
                        if key_pressed: 
                            if key['midi']['ptchb'] == 'set':
                                if 0 <= key['midi']['pbval'] <= 16383:
                                    self.pitch_bend = key['midi']['pbval']
                                    self.macropad.midi.send(
                                        self.macropad.PitchBend(self.pitch_bend))
                            elif key['midi']['ptchb'] == 'incr':
                                if self.pitch_bend + key['midi']['pbstp'] <= 16383:
                                    self.pitch_bend += key['midi']['pbstp']
                                else:
                                    self.pitch_bend = 16383
                                self.macropad.midi.send(
                                    self.macropad.PitchBend(self.pitch_bend))
                            elif key['midi']['ptchb'] == 'decr':
                                if self.pitch_bend - key['midi']['pbstp'] >= 0:
                                    self.pitch_bend -= key['midi']['pbstp']
                                else:
                                    self.pitch_bend = 0
                                self.macropad.midi.send(
                                    self.macropad.PitchBend(self.pitch_bend))
                    elif 'ctrch' in key['midi']:
                        if key_pressed:
                            if 0 <= key['midi']['ccval'] <= 127:
                                self.macropad.midi.send(
                                    self.macropad.ControlChange(key['midi']['ctrch'], key['midi']['ccval']))
                    elif 'prgch' in key['midi']:
                        if key_pressed:
                            if 0 <= key['midi']['prgch'] <= 127:
                                self.macropad.midi.send(
                                    self.macropad.ProgramChange(key['midi']['prgch']))
                elif 'sys' in key:
                    if key_pressed:
                        method = getattr(System, key['sys'], None)
                        if method:
                            method(self)
                else:
                    print("unkown macro:", key)

    def open_group(self, item:tuple[str, list], key_pressed:bool = False, *args) -> None:
        """ open a group

        Args:
            item (key_id:str, content:list): the key id and content data
        """
        if key_pressed:
            self.group_stack.append(item[0])
            self._init_group()

    def close_group(self, *args) -> None:
        """ close a group and go a level up
        """
        if len(self.group_stack) > 1:
            self.group_stack.pop()

            self._init_group()

    def go_to_root(self, *args) -> None:
        """ close a group and go to root
        """
        del self.group_stack[1:]
        
        self._init_group()

    def _update_tab(self) -> None:
        """ update the current displayed group tab 
        """
        key_funcs = {
            "macro": self.run_macro,
            "group": self.open_group
        }

        for key in self.keys:
            key.clear_props()
        
        group = json.loads(self.macro_store[self.group_stack[-1]])

        for i, key_id in enumerate(group["content"][:self.macropad.keys.key_count]):
            if key_id:
                macro_data = json.loads(self.macro_store[str(key_id)])
                key_type = macro_data["type"]

                key = self.keys[i]
                key.type = key_type
                key.label = macro_data["label"]
                key.color = macro_data["color"]
                key.retrigger = macro_data.get("retrigger", False)
                key.set_func(key_funcs.get(key_type), (str(key_id), macro_data["content"]))

        self.group_label.text = group["label"]

        for key in self.keys:
            key.update_colors(SETTINGS["invertcolors"])

    def _update_encoder_macros(self) -> None:
        """ update the rotary encoder macros defined for opened group
        """
        group = json.loads(self.macro_store[self.group_stack[-1]])

        self.encoder.update_encoder_macros(
            on_switch = group.get("encoder", {}).get("switch"),
            on_increased = group.get("encoder", {}).get("increased"),
            on_decreased = group.get("encoder", {}).get("decreased")
        )

    def _handle_serial_data(self, payload: object) -> dict:
        """ handle the data comming over the serial connection

        Args:
            payload (object): the data

        Returns:
            dict: response, sended over the serial connection
        """
        response = {}

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
            self._send_serial_data({
                    "ACK":"macros",
                    "CONTENT": "start"
                })
            
            for key_id in self.macro_store.keys():
                self._send_serial_data({
                    "ACK":"macros",
                    "ID": key_id,
                    "CONTENT": self.macro_store[key_id]
                })

            # transfer complete
            response['ACK'] = 'macros'
            response['CONTENT'] = 'end'
            return response

        elif command == 'set_macros':
            if 'content' not in payload.keys():
                response['ERR'] = 'No content: %s' % payload
                return response

            content = payload['content']

            if content == "start":
                # prepare transfer
                self.macro_store = {}

                gc.collect()
                return
            
            elif content == "end":
                # transfer complete
                self._init_group()
                self._display_on()
            
            else:
                self.macro_store[payload['id']] = content
                return
            
            response['ACK'] = 'Macros received'
            response['CONTENT'] = len(self.macro_store) - 1
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

    def _send_serial_data(self, payload: dict) -> None:
        """ prepare and send data over serial connection

        Args:
            payload (dict): the data
        """
        json.dump(payload, self.serial_data, separators=(',', ':'))
        self.serial_data.write(b'\n')

    def _get_midi_notes(self, notes: list, state: str, velocity: int) -> list:
        """  prepare MIDI NoteOn and NoteOff messages

        Args:
            notes (list): list of note names or numbers
            state (str): 'on' or 'off'
            velocity (int): strike velocity for NoteOn messages

        Returns:
            list: list of MIDI messages
        """
        midi_notes = []
        for note in notes:
            try:
                if note.isdigit() and 0 <= int(note) <= 127:
                    note = int(note)
                if velocity > 0 and state == 'on':
                    midi_notes.append(self.macropad.NoteOn(note, velocity))
                else:
                    midi_notes.append(self.macropad.NoteOff(note, 0))
            except Exception:
                pass
        return midi_notes

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
        active_keys = dict()
        data_error = False

        while True:
            # display timeout
            if not self.macropad.display_sleep and time.monotonic() - self.sleep_timer > SETTINGS["sleeptime"]:
                self.macropad.display_sleep = True

            self.macropad.display.refresh()

            # garbage collection
            if gc.mem_free() < MEMORYLIMIT:
                gc.collect()

            # send after the connection is established
            if self.serial_last_state != self.serial_data.connected:
                self.serial_last_state = self.serial_data.connected
                if self.serial_data.connected:
                    self._send_serial_data(
                        {'ACK': 'version', 'CONTENT': VERSION})
                    self._send_serial_data(
                        {'ACK': 'audiofiles', 'CONTENT': get_audio_files()})
                    self._send_serial_data(
                        {'ACK': 'usbenabled', 'CONTENT': self.readonly})

            # serial connection
            if self.serial_data.connected:
                # if an error occured, reload saved macrofile
                if data_error and self.serial_data.in_waiting == 0:
                    data_error = False
                    self._init_macros()

                    gc.collect()
                    
                    self._send_serial_data(
                        {"WARN": 'Reloaded: %s' % MACROFILE})

                # if an error occured, read all data to out to free the connection
                elif data_error:
                    self.serial_data.read(min(READOUTSIZE, self.serial_data.in_waiting))

                # try to handle all incoming data
                elif self.serial_data.in_waiting > 0:
                    try:
                        response = self._handle_serial_data(json.load(self.serial_data))
                        if response:
                            self._send_serial_data(response)
                    except Exception as e:
                        # prepare error handling
                        self._send_serial_data({"ERR": e})
                        data_error = True

                # get key events, so no inputs will be stored during connection
                # self.macropad.keys.events.get()
                # continue
            
            # handle delayed macro execution
            if self.delayed_macros:
                if time.monotonic() >= self.delayed_macros[0][3]:
                    item = self.delayed_macros.pop(0)
                    self.run_macro(
                        (item[0], json.loads(self.macro_store[item[0]])["content"]), 
                        start_index=item[1],
                        key_pressed=item[2]
                    )

            # key event handling
            key_event = self.macropad.keys.events.get()
            if key_event:
                self._display_on()
                if key_event.pressed and self.keys[key_event.key_number].has_func():
                    self.keys[key_event.key_number].pressed = True
                    if self.keys[key_event.key_number].retrigger:
                        active_keys[key_event.key_number] = time.monotonic()

                elif key_event.released:
                    self.keys[key_event.key_number].pressed = False
                    active_keys.pop(key_event.key_number, None)
            
            # if a key is pressed continuously, the function triggers again after a short delay
            for active_key, active_key_delay in active_keys.items(): 
                if active_key is not None and time.monotonic() - active_key_delay > 0.75:
                    self.keys[active_key].call_func()

            # encoder event handling
            if self.encoder.switch and self.encoder.on_switch:
                self._display_on()
                self.run_macro_press_and_release((self.group_stack[-1], self.encoder.on_switch))

            if self.encoder.increased and self.encoder.on_increased:
                self._display_on()
                self.run_macro_press_and_release((self.group_stack[-1], self.encoder.on_increased))

            if self.encoder.decreased and self.encoder.on_decreased:
                self._display_on()
                self.run_macro_press_and_release((self.group_stack[-1], self.encoder.on_decreased))

MacroApp().start()