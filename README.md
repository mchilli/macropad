# MacroPad by MCHilli

<img src="https://github.com/mchilli/macropad/blob/main/webui/img/macropad-128.png?raw=true" height="100">

This is an [Adafruit MacroPad](https://www.adafruit.com/product/5128) script that allows you to manage your macros via a [**WebUI**](https://mchilli.github.io/macropad/).

---

#### Features:

-   Make groups to organize your macros
-   Groups can store more macros or groups
-   Define encoder macros for different groups
-   Choose colors for every single macro or group
-   Save your configurations locally by downloading it as a JSON file

-   Device settings:
    -   Choose a keyboard layout suitable for your language
    -   Set a display timeout to prevent burn-in
    -   Use a Unicode Font **(increases the font loading time)**
    -   Flip the rotation of the device by 180 degrees
    -   Adjust the LCD and LED brightness

#### Installation:

Flash circuitpython on to your macropad, following this [guide](https://learn.adafruit.com/adafruit-macropad-rp2040/circuitpython).

Then just extract the content of "[macropad-circuitpython-x.x.zip](https://github.com/mchilli/macropad/releases/latest/)" to your device.

Now just configure your macropad over the [WebUI](https://mchilli.github.io/macropad/):

`Connect` &#8594; select `MacroPad by MCHilli` &#8594; Create Macros &#8594; `Upload`

If you are happy with your configuration don't forget to `Store`! Otherwise your macros will not be saved on your MacroPad and will also not appear after rebooting your device!

#### Other Informations:

Your can enable the USB storage either by pressing the yellow blinking key (top, left) when plugin the device, you can enable it through the WebUI under "reboot" or you can set a macro with the device function "enable_usb".

#### Ideas:

-   Further translations for the WebUI. If you want to help me there is a template.json in the "lang" folder
-   You tell me, feel free to contribute

---

#### Browser limitation:

The script use the [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) for communication. The only browsers that currently support this API are _Chrome_, _Edge_ and _Opera_, so unfortunately you'll have to use one of them.

#### Used libraries and icons:

-   [SortableJS](https://github.com/SortableJS/Sortable)
-   [Font Awesome](https://fontawesome.com/)
