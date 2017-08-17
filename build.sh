#!/bin/bash

rm original/*.ttx
ttx original/OperatorMono-Medium.otf
ttx original/OperatorMono-MediumItalic.otf

mkdir -p build

node index.js OperatorMono-Medium
node index.js OperatorMono-MediumItalic

rm -rf build/*.otf

ttx build/OperatorMonoLig-Medium.ttx
ttx build/OperatorMonoLig-MediumItalic.ttx
