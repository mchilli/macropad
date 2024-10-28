from adafruit_macropad import MacroPad
from adafruit_display_text.label import Label

from utils.utils import center

class Encoder():
    """ Handles the rotary encoder """
    def __init__(self, macropad:MacroPad) -> None:
        self._macropad = macropad
        self._last_position = 0

        self.update_encoder_macros()
    
    @property
    def switch(self) -> bool:
        return self.switch_debounced

    @property
    def switch_debounced(self) -> bool:
        self._macropad.encoder_switch_debounced.update()
        return self._macropad.encoder_switch_debounced.pressed

    @property
    def increased(self) -> bool:
        postion = self._macropad.encoder
        if postion > self._last_position:
            self._last_position = postion
            return True
        return False
    
    @property
    def decreased(self) -> bool:
        postion = self._macropad.encoder
        if postion < self._last_position:
            self._last_position = postion
            return True
        return False
    
    @property
    def on_switch(self) -> None:
        return self._on_switch
    
    @property
    def on_increased(self) -> None:
        return self._on_increased

    @property
    def on_decreased(self) -> None:
        return self._on_decreased
    
    def update_encoder_macros(self, on_switch:function=None, on_increased:function=None, on_decreased:function=None) -> None:
        self._on_switch = on_switch
        self._on_increased = on_increased
        self._on_decreased = on_decreased


class Key():
    """ Handles a single key """
    def __init__(self, macropad:MacroPad, index:int, label:Label) -> None:
        self._macropad = macropad
        self._index = index
        self._pressed = False
        self._label = label

        self.clear_props()
    
    @property
    def pressed(self) -> bool:
        """ Status Property
        """
        return self._pressed
    
    @pressed.setter
    def pressed(self, pressed:bool) -> None:
        self._pressed = pressed
        self._on_pressed() if self.pressed else self._on_released()

    @property
    def label(self) -> str:
        """ Label Property
        """
        return self._label.text
    
    @label.setter
    def label(self, label:str) -> None:
        self._label.text = center(label, 6, ' ') if len(label) <= 6 else label[:6]

    @property
    def type(self) -> str:
        """ Type Property
        """
        return self._type
    
    @type.setter
    def type(self, type:str) -> None:
        self._type = type

    @property
    def color(self) -> tuple:
        """ Color Property
        """
        return self._color
    
    @color.setter
    def color(self, color:tuple) -> None:
        self._color = color
    
    def update_colors(self) -> None:
        """ update the backgroundcolor and color based on type
        """
        if self.type in ["blank", "group"]:
            self._label.background_color = 0x000000
            self._label.color = 0xffffff
        else:
            self._label.background_color = 0xffffff
            self._label.color = 0x000000

        self._set_led(self.color)

    def _set_led(self, color:tuple[int, int, int]) -> None:
        """ set and update the led color

        Args:
            color (tuple): the led color (R, G, B)
        """
        self._macropad.pixels[self._index] = color
        self._macropad.pixels.show()

    def clear_props(self) -> None:
        """ clear all properties so the key is off
        """
        self._label.text = ""
        self._type = None
        self._color = (0, 0, 0)
        self._func = None
        self._func_args = None

    def set_func(self, func:function, args:dict = None) -> None:
        """ set the function which called when the key is pressed

        Args:
            func (function): the function which called on key press
            args (dict, optional): optionally arguments passed to func. Defaults to None.
        """
        self._func = func
        self._func_args = args

    def call_func(self) -> None:
        """ calls the function if setted with set_func
        """
        if not self._func:
            return
        if self._func_args:
            return self._func(self._func_args)
        return self._func()

    def _on_pressed(self) -> None:
        """ Action that triggered when Key is pressed
        """
        if self._func:
            self._set_led((255, 255, 255))
            self.call_func()
    
    def _on_released(self) -> None:
        """ Action that triggered when Key is released
        """
        self._set_led(self.color)
    
