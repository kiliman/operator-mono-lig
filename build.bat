@echo off

del .\original\*.ttx
ttx .\original\OperatorMono-Medium.otf
ttx .\original\OperatorMono-MediumItalic.otf

if not exist build\* mkdir build

node index.js OperatorMono-Medium
node index.js OperatorMono-MediumItalic

del /q .\build\*.otf

ttx .\build\OperatorMonoLig-Medium.ttx
ttx .\build\OperatorMonoLig-MediumItalic.ttx