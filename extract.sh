#!/bin/bash

rm -rf ./ligature_source/*.ttx

ttx ./ligature_source/OperatorMonoLig-Medium.otf
ttx ./ligature_source/OperatorMonoLig-MediumItalic.otf
ttx ./ligature_source/OperatorMonoSSmLig-Book.otf
ttx ./ligature_source/OperatorMonoSSmLig-BookItalic.otf
ttx ./ligature_source/OperatorMonoSSmLig-Medium.otf
#ttx ./ligature_source/OperatorMonoSSmLig-MediumItalic.otf

node extract.js OperatorMonoLig-Medium
node extract.js OperatorMonoLig-MediumItalic
node extract.js OperatorMonoSSmLig-Book
node extract.js OperatorMonoSSmLig-BookItalic
node extract.js OperatorMonoSSmLig-Medium
#node extract.js OperatorMonoSSmLig-MediumItalic
