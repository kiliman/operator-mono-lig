# Operator Mono Ligatures
[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors-)

This project will generate new OpenType fonts for [Operator Mono](https://www.typography.com/fonts/operator/styles/) that includes ligatures similar to those found in the popular [Fira Code](https://github.com/tonsky/FiraCode) font.
These ligatures were custom created using [Glyphs](https://glyphsapp.com/).
There are even italic versions of the ligatures.

<img src="./images/operator-mono-lig.png" />

In addition to the graphic above, the following new ligatures are available:

<img src="./images/new-ligatures.png"/>

# Release notes: 

- 🎉 New Version 2.2.5
  All new redesigned ligatures with better hinting. Updated font generation to support advanced OpenType features
  like those found in Fira Code. For example, the cursor now moves inside the ligature. It also handles repeating
  characters properly.
  
  <img src="./images/caret-position.gif" />

- 🎉 New in Version 2.2
  With the awesome help from [Mark Skelton](https://github.com/mskelton), we now have the full set of ligatures for
  the following fonts. Thanks Mark, and thanks to all of you who have been patiently waiting for these ligatures to be completed.
  - Operator Mono SSm Light/Light Italic
  - Operator Mono SSm Book/Book Italic
  - Operator Mono SSm Medium/Medium Italic
  - Operator Mono SSm Bold/Bold Italic
  - Operator Mono Light/Light Italic
  - Operator Mono Book/Book Italic

- 🐛 Fixed in Version 2.2.5
  Add Operator Mono Book/Book Italic ligatures.

- 🐛 Fixed in Version 2.2.4
  Add some missing ligatures.

- 🐛 Fixed in Version 2.2.3
  Updated Operator Mono SSm Book Italic ligatures.

- 🐛 Fixed in Version 2.2.2
  Fixed glyph widths Operator Mono Light and Light Italic. These fonts accidentally were sized
  the same as the ScreenSmart versions and caused alignment issues. Also fixed a few ligatures
  that didn't have the correct weight.

# ☑️ Take the poll

Which font weight of Operator Mono do you use? Also note difference between Screen Smart (SSm) and regular version. This will help prioritize the order of development.

[![](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20SSm%20Book)](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20SSm%20Book/vote)
[![](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20SSm%20Medium)](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20SSm%20Medium/vote)
[![](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20SSm%20Light)](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20SSm%20Light/vote)
[![](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20Book)](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20Book/vote)
[![](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20Medium)](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20Medium/vote)
[![](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20Light)](https://api.gh-polls.com/poll/01C6T4C3FBG21KVS7FAW7Z09B2/Operator%20Mono%20Light/vote)

> NOTE: Because _Operator Mono_ is not a free font, you must have the original font files. This utility
> will merge the ligature definitions into a copy of the original font. The new font family is named _Operator Mono Lig_ so you can install it side-by-side with the original font.

# 🛠 How to Install

## Using Unix-based/Windows OS with Python installed:
### Prerequisites

- The original _Operator Mono_ font... of course. Get one of the font packs: 
  - [Operator Mono SSm](https://www.typography.com/fonts/operator/styles/operatormonoscreensmart)
    provides better clarity using the ScreenSmart technology to generate the fonts.
  - [Operator Mono](typography.com/fonts/operator/styles/operatormono)
- Install _fonttools_ from https://github.com/fonttools/fonttools
  - Install Python (v2.7+) & add Python packages to command PATH variable
    `sudo apt install -y python3-pip python-pip && PATH=$PATH:~/.local/bin`
  - Run: `pip install fonttools`
    - for Mac users it's better to run `pip3 install fonttools` - [info](https://stackoverflow.com/a/33416270/3191011)
- Node.js

### Steps:
Once all the prerequisites have been installed, follow the steps:

1. Clone this repo `git clone https://github.com/kiliman/operator-mono-lig`. 
   Or download latest release from [Releases](https://github.com/kiliman/operator-mono-lig/releases) and unzip.
  
2. From the command line, run:  `npm install`

3. Copy your _Operator Mono_ OpenType files into the `original` folder.

   - **NOTE**: Filenames must not include spaces. It should look like:
     - OperatorMonoSSm-Book.otf
     - OperatorMonoSSm-BookItalic.otf
     - OperatorMono-Light.otf
     - OperatorMono-LightItalic.otf
     - etc.

4. From the command line, run the following command, which will generate the new font files in the `build` folder:
  - Windows: `build`
  - Linux/Mac: `./build.sh`

5. ✔ Install the newly created fonts on your system.

## Using Docker:
> Note: This requires you to build the docker image as it is not hosted on Dockerhub.
If you use Docker, you can also use the executable Docker image [here](https://github.com/drod3763/kiliman-operator-mono-lig-docker). It handles all the prerequisite installation for you, you just need to:

Using Docker Compose cli tool: 
  1. Clone the repo located at [https://github.com/drod3763/kiliman-operator-mono-lig-docker].

  2. Copy your _Operator Mono_ OpenType files into the `input` folder.

  3. From the command line run: `docker-compose run --rm operator-mono-lig`
  
  4. ✔ Install the generated fonts - The image will build and execute the conversion. The new font files will be generated into the `output` folder.

# 🔧 Customize the generated font

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

# 👨‍💻 Configure Your Code Editor

You can now select the newly generated font in your code editor. Make sure you enable font ligatures.

### VS Code settings file:

```json
  "editor.fontFamily": "OperatorMonoSSmLig-Book",
  "editor.fontLigatures": true,
  // for Windows
  "editor.fontFamily": "Operator Mono SSm Lig",
  "editor.fontLigatures": true,
  "editor.fontWeight": "500",   // adjust for desired weight
```

# 😍 Thank You

Thanks to Hoefler&Co for making such an amazing font. It makes writing code truly pleasurable.

Thanks also to all of you for your kinds words of encouragement and feedback. I really
appreciate it.

## 🙏 Help Wanted

As noted above, v2.0 only includes ligatures for **Operator Mono SSm Book**. In order to
update the other fonts, all the ligatures need to be redone. Unfortunately I just don't
have the time to do that at the moment. If you have a Mac and are interested in helping,
please let me know. I will even purchase a license to Gylphs Mini for you.

You can reach me at kiliman@gmail.com.

## ✨ Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/kiliman"><img src="https://avatars3.githubusercontent.com/u/47168?v=4" width="100px;" alt="Kiliman"/><br /><sub><b>Kiliman</b></sub></a><br /><a href="https://github.com/kiliman/operator-mono-lig/commits?author=kiliman" title="Code">💻</a> <a href="https://github.com/kiliman/operator-mono-lig/commits?author=kiliman" title="Documentation">📖</a> <a href="#design-kiliman" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/mskelton"><img src="https://avatars3.githubusercontent.com/u/25914066?v=4" width="100px;" alt="Mark Skelton"/><br /><sub><b>Mark Skelton</b></sub></a><br /><a href="#design-mskelton" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/drod3763"><img src="https://avatars2.githubusercontent.com/u/7785716?v=4" width="100px;" alt="Derick Rodriguez"/><br /><sub><b>Derick Rodriguez</b></sub></a><br /><a href="https://github.com/kiliman/operator-mono-lig/commits?author=drod3763" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
