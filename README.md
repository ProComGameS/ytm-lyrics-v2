# ytm-lyrics
GreaseMonkey / ViolentMonkey script to display lyrics on the YouTube Music Web Player using Musixmatch.
(Tested with Chrome)
Microsoft don't work
## Installation
Create a new script in GreaseMonkey / ViolentMonkey, and copy-paste the content of the `index.js` file
into it.

![YouTube Music - Google Chrome 06 03 2024 16_25_51](https://github.com/ProComGameS/ytm-lyrics-v2/assets/147753434/e7f3cad7-04f8-4a4f-8875-f2befc5d6fc1)

## Usage
A new icon will be added next to the "Volume" icon at the bottom-right of the screen. Simply
click it to open or close the lyrics panel, whose content will be automatically filled with lyrics,
and scrolled as the song advances.  
You can also double-click on the lyrics panel to display lyrics in fullscreen.

If an error is encountered (track is instrumental or could not be found), the panel will be hidden
and the icon will be greyed-out; simply hover over it with your mouse to see the reason why
the lyrics could not be found.

If the lyrics are no perfectly synced to the song:
- Press `X` to delay the song by 100ms (the lyrics will appear **earlier**).
- Press `Shift+X` to delay the lyrics by 100ms (the lyrics will appear **later**).
- Press `Alt+X` to reset the delay to 0.
