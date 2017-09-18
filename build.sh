#!/bin/bash

mkdir -p build

build_font() {
    lig="$1"
    otf=${lig/Lig/}

    if [ ! -e "./original/$otf.otf" ] 
    then 
        return 
    fi
    if [ ! -e "./ligature/$lig/charstrings.xml" ] 
    then 
        return 
    fi
    
    echo Building $1
    ttx -f "./original/$otf.otf"
    node index.js $otf
    ttx -f ./build/$1.ttx
}

if [ -n "$1" ]
then
    # build specified font
    build_font $1
else
    # build all available fonts
    for d in ./ligature/*/ ; do
        build_font $(basename $d)
    done
fi
