@echo off
setlocal

if not exist .\build\* mkdir build

rem only build passed in font
if not "%1%"=="" (
	call :build_font %1
	exit /b
)

rem build all fonts
for /d %%d in (.\ligature\*) do call :build_font %%~nd
exit /b	
	

:build_font
set lig=%1
set otf=%lig:Lig=%

if not exist .\original\%otf%.otf exit /b
if not exist .\ligature\%lig%\charstrings.xml exit /b

@echo Building %lig%
ttx -f .\original\%otf%.otf
node index.js %otf%
ttx -f .\build\%lig%.ttx
exit /b
