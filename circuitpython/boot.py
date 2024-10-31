import os

import board
import digitalio
import storage
import supervisor
import usb_cdc

from utils.utils import path_exist

USBENABLEDFILE = "usbenabled"

supervisor.set_usb_identification('MCHilli', 'MacroPad by MCHilli')

usb_enabled = False
if path_exist(USBENABLEDFILE):
    usb_enabled = True
    storage.remount("/", readonly=False)
    os.remove(USBENABLEDFILE)
    storage.remount("/", readonly=True)

# the yellow blinking button when plug in the macropad
key1 = digitalio.DigitalInOut(board.KEY1)
key1.switch_to_input(pull=digitalio.Pull.UP)

if not key1.value or usb_enabled:
    print("USB enabled")
    usb_cdc.enable(console=True, data=True)
else:
    print("USB disabled")
    usb_cdc.enable(console=False, data=True)
    storage.disable_usb_drive()
    storage.remount("/", readonly=False)
