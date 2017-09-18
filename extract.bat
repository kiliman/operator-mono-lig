@echo off
setlocal

rem extract all fonts
for %%d in (.\ligature_source\*.otf) do call :extract_font %%~nd
exit /b

:extract_font
set lig=%1
set otf=%lig:Lig=%

ttx -f .\ligature_source\%lig%.otf
node extract.js %lig%
exit /b
