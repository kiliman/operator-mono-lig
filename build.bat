@echo off
setlocal

if not exist .\build\* mkdir build

set flags=
if "%1"=="--italics-hack-off" (
	set flags=%1
	shift
)
rem only build passed in font
if not "%1"=="" (
	call :build_font %1 %flags%
	exit /b
)

rem build all fonts
for /d %%d in (.\ligature\*) do call :build_font %%~nd %flags%
exit /b


:build_font
set lig=%1
set flags=%2
set otf=%lig:Lig-=-%

if not exist .\original\%otf%.otf exit /b
if not exist .\ligature\%lig%\glyphs\* exit /b

@echo Building %lig%
ttx -f .\original\%otf%.otf
node index.js %otf% %flags%
ttx -f .\build\%lig%.ttx
fonttools feaLib -v -o ".\build\%lig%.otf" .\features\default.fea ".\build\%lig%.otf"

exit /b
