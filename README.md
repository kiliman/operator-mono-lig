# Operator Mono Ligatures

This project will generate new OpenType fonts for [Operator Mono](https://www.typography.com/fonts/operator/styles/) that includes ligatures similar to
those found in the popular [Fira Code](https://github.com/tonsky/FiraCode) font.

<img src="./images/sample.js.png" />

<img src="./images/sample.html.png" />

>NOTE: Because *Operator Mono* is not a free font, you must have the original font files. This utility 
will merge the ligature definitions into a copy of the original font. The new font family is named *Operator Mono Lig* so you can install it side-by-side with the original font.

## Prerequisites
* The original *Operator Mono* font... of course.
* Install *fonttools* from https://github.com/fonttools/fonttools
  * Install Python
  * Run: `pip install fonttools`
* Node.js

## How to Install

Once all the prerequisites have been installed, clone this repo.

From the command line, run:

```
npm install
```

Copy your *Operator Mono* OpenType files into the `original` folder.

From the command line, run:

```
build
```

This will generate the new font files in the `build` folder. You can now install these fonts on your system.





