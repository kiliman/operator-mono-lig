@echo off

del .\original\*.ttx
ttx .\original\OperatorMono-Medium.otf
ttx .\original\OperatorMono-MediumItalic.otf
ttx .\original\OperatorMono-Book.otf
ttx .\original\OperatorMono-BookItalic.otf
ttx .\original\OperatorMono-Light.otf
ttx .\original\OperatorMono-LightItalic.otf

if not exist build\* mkdir build

node index.js OperatorMono-Medium
node index.js OperatorMono-MediumItalic
node index.js OperatorMono-Book
node index.js OperatorMono-BookItalic
node index.js OperatorMono-Light
node index.js OperatorMono-LightItalic

del /q .\build\*.otf

ttx .\build\OperatorMonoLig-Medium.ttx
ttx .\build\OperatorMonoLig-MediumItalic.ttx
ttx .\build\OperatorMonoLig-Book.ttx
ttx .\build\OperatorMonoLig-BookItalic.ttx
ttx .\build\OperatorMonoLig-Light.ttx
ttx .\build\OperatorMonoLig-LightItalic.ttx