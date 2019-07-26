# Operator Mono Ligatures

<img src="./images/operator-mono-lig.png" />

This project will generate new OpenType fonts for [Operator Mono](https://www.typography.com/fonts/operator/styles/) that includes ligatures similar to
those found in the popular [Fira Code](https://github.com/tonsky/FiraCode) font.

These ligatures were custom created using [Glyphs](https://glyphsapp.com/).
There are even italic versions of the ligatures.

## New Version 2.0

All new redesigned ligatures with better hinting. Updated font generation to support advanced OpenType features
like those found in Fira Code. For example, the cursor now moves inside the ligature. It also handles repeating
characters properly.

<img src="./images/caret-position.gif" />

> NOTE: The new ligatures are currently only available for **Operator Mono SSm Book**. If you don't have this font, you
> can still use the v1.0 verson of the tool. Download it [here](https://github.com/kiliman/operator-mono-lig/releases/tag/v1.0).

### Customize the generated font

In addition to the new ligatures, this version now allows you to customize what ligatures are added to a font.
By default, all available ligatures will be added to the generated font. However, if you don't like a particular
ligature, or would prefer to use an alternate glyph, you can create a `profiles.ini` file in the `./original` folder
to configure how the font should be built.

You can create one or more profiles. Each profile will have a set of directives. You can specify alternate glyphs for
a given ligature. You can also prevent a ligature from being added.

Each profile will be listed with `[profile name]` (the first profile should be named default). The generated font will
include the profile name. For example `[Go]` would generate the font: _Operator Mono Lig Go_. This way you can configure
a different set of ligatures for each language in your favorite code editor.

```ini
# name of profile (one or more sections, first should be name default)
[default]
# glyph=altglyph
greater_equal.liga=greater_equal.2.liga

# do not include glyph (add ! prefix)
!equal_equal.liga

# another optional section (will create a font named Operator Mono Lig Go)
[Go]
... add custom directives for this font ...
```

### New ligatures

In addition to the graphic above, the following new ligatures are available:
<img src="./images/new-ligatures.png"/>

### Help Wanted

As noted above, v2.0 only includes ligatures for **Operator Mono SSm Book**. In order to
update the other fonts, all the ligatures need to be redone. Unfortunately I just don't
have the time to do that at the moment. If you have a Mac and are interested in helping,
please let me know. I will even purchase a license to Gylphs Mini for you.

You can reach me at kiliman@gmail.com.

## Take the poll

Which font weight of Operator Mono do you use? Also note difference between Screen Smart (SSm) and regular version. This will help prioritize the order of development.

[![](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20SSm%20Book)](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20SSm%20Book/vote)
[![](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20SSm%20Medium)](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20SSm%20Medium/vote)
[![](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20SSm%20Light)](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20SSm%20Light/vote)
[![](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20Book)](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20Book/vote)
[![](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20Medium)](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20Medium/vote)
[![](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20Light)](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20Light/vote)

> NOTE: Because _Operator Mono_ is not a free font, you must have the original font files. This utility
> will merge the ligature definitions into a copy of the original font. The new font family is named _Operator Mono Lig_ so you can install it side-by-side with the original font.

## Prerequisites

- The original _Operator Mono_ font... of course.
- Install _fonttools_ from https://github.com/fonttools/fonttools
  - Install Python (v2.7+)
  - Run: `pip install fonttools`
    - for Mac users it's better to run `pip3 install fonttools` - [info](https://stackoverflow.com/a/33416270/3191011)
- Node.js

## How to Install

1. Once all the prerequisites have been installed, clone this repo. Or download latest release from [Releases](https://github.com/kiliman/operator-mono-lig/releases) and unzip.

2. From the command line, run:

```
npm install
```

3. Copy your _Operator Mono_ OpenType files into the `original` folder.

   - **NOTE**: Filenames must not include spaces. It should look like:
     - OperatorMonoSSm-Book.otf
     - OperatorMonoSSm-BookItalic.otf
     - OperatorMono-Light.otf
     - OperatorMono-LightItalic.otf
     - etc.

4. From the command line, run:

### Windows

```
build
```

### Linux/Mac

```
./build.sh
```

This will generate the new font files in the `build` folder. You can now install these fonts on your system.

## Configure Your Code Editor

You can now select the newly generated font in your code editor. Make sure you enable font ligatures.

### VS Code

```json
  "editor.fontFamily": "OperatorMonoSSmLig-Book",
  "editor.fontLigatures": true,
  // for Windows
  "editor.fontFamily": "Operator Mono SSm Lig",
  "editor.fontLigatures": true,
  "editor.fontWeight": "500",   // adjust for desired weight
```

## Thank You

Thanks to Hoefler&Co for making such an amazing font. It makes writing code truly pleasurable.

Thanks also to all of you for your kinds words of encouragement and feedback. I really
appreciate it.
