#!/bin/bash

extract_font() {
    lig="$1"

    echo Extracting $1
    ttx -f "./ligature_source/$lig.otf"
    node extract.js $lig
}

if [ -n "$1" ]
then
    # extract specified font
    extract_font $1
else
    # build all available fonts
    for f in ./ligature_source/*.otf ; do
        extract_font `basename "${f%.*}"`
    done
fi
