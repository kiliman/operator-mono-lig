#!/bin/bash

rm -rf original/*.ttx

ttx original/OperatorMono-Medium.otf
ttx original/OperatorMono-MediumItalic.otf
ttx original/OperatorMonoSSm-Book.otf
ttx original/OperatorMonoSSm-BookItalic.otf
ttx original/OperatorMonoSSm-Medium.otf
#ttx original/OperatorMonoSSm-MediumItalic.otf

mkdir -p build

node index.js OperatorMono-Medium
node index.js OperatorMono-MediumItalic
node index.js OperatorMonoSSm-Book
node index.js OperatorMonoSSM-BookItalic
node index.js OperatorMonoSSm-Medium
#node index.js OperatorMonoSSm-MediumItalic

rm -rf build/*.otf

ttx build/OperatorMonoLig-Medium.ttx
ttx build/OperatorMonoLig-MediumItalic.ttx
ttx build/OperatorMonoSSmLig-Book.ttx
ttx build/OperatorMonoSSmLig-BookItalic.ttx
ttx build/OperatorMonoSSmLig-Medium.ttx
#ttx build/OperatorMonoSSmLig-MediumItalic.ttx
