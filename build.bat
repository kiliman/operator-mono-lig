@echo off

del /q .\original\*.ttx

ttx .\original\OperatorMono-Medium.otf
ttx .\original\OperatorMono-MediumItalic.otf
ttx .\original\OperatorMonoSSm-Book.otf
ttx .\original\OperatorMonoSSm-BookItalic.otf
ttx .\original\OperatorMonoSSm-Medium.otf
#ttx .\original\OperatorMonoSSm-MediumItalic.otf

if not exist build\* mkdir build

node index.js OperatorMono-Medium
node index.js OperatorMono-MediumItalic
node index.js OperatorMonoSSm-Book
node index.js OperatorMonoSSM-BookItalic
node index.js OperatorMonoSSm-Medium
#node index.js OperatorMonoSSm-MediumItalic

del /q .\build\*.otf

ttx .\build\OperatorMonoLig-Medium.ttx
ttx .\build\OperatorMonoLig-MediumItalic.ttx