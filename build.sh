#!/bin/bash

mkdir -p build

build_font() {
    lig="$1"
    flags="$2"
    otf=${lig/Lig-/-}

    if [ ! -e "./original/$otf.otf" ]
    then
        return
    fi
    if [ ! -e "./ligature/$lig/glyphs" ]
    then
        return
    fi

    echo Building "$1"
    ttx -f "./original/$otf.otf"
    node index.js "$otf" "$flags"

    ttx -f "./build/$1.ttx"

    fonttools feaLib -v -o "./build/$1.otf" ./features/default.fea "./build/$1.otf"
}

flags=
if [ "$1" = "--italics-hack-off" ]
then
    flags=$1
    shift
fi
if [ -n "$1" ]
then
    # build specified font
    build_font "$1" "$flags"
else
    # build all available fonts
    for d in ./ligature/*/ ; do
        build_font "$(basename "$d")" "$flags"
    done
fi
