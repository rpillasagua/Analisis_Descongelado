@echo off
REM Build APK Script for Aquagold Resistencias
REM This script builds a debug APK without needing Android Studio UI

setlocal enabledelayedexpansion

echo.
echo =====================================
echo Building Aquagold Resistencias APK
echo =====================================
echo.

REM Set Java Home
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr

REM Set Android SDK
set ANDROID_HOME=C:\Users\Jaqueline Holguin\AppData\Local\Android\Sdk

REM Check if Java exists
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo ERROR: Java not found at %JAVA_HOME%
    exit /b 1
)

REM Check if SDK exists
if not exist "%ANDROID_HOME%" (
    echo ERROR: Android SDK not found at %ANDROID_HOME%
    exit /b 1
)

echo Java Home: %JAVA_HOME%
echo Android SDK: %ANDROID_HOME%
echo.

REM Change to android directory
cd /d "%~dp0"

REM Check if gradlew exists
if not exist "gradlew.bat" (
    echo ERROR: gradlew.bat not found!
    exit /b 1
)

REM Delete old build folder if it exists (workaround for permission issues)
echo Removing old build artifacts...
if exist "app\build" (
    rmdir /s /q "app\build" 2>nul
    timeout /t 1 >nul
)

echo.
echo Building Debug APK...
call gradlew.bat --no-daemon assembleDebug

REM Check if build was successful
if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================
    echo BUILD SUCCESSFUL!
    echo =====================================
    echo.
    echo APK Location:
    echo %cd%\app\build\outputs\apk\debug\app-debug.apk
    echo.
    REM Verify APK exists
    if exist "app\build\outputs\apk\debug\app-debug.apk" (
        echo File size: 
        for %%F in (app\build\outputs\apk\debug\app-debug.apk) do (
            echo %%~zF bytes
        )
        echo.
        echo APK is ready to install on your Android device!
    )
    echo.
    pause
) else (
    echo.
    echo =====================================
    echo BUILD FAILED!
    echo =====================================
    echo.
    echo Check the error messages above.
    echo Common issues:
    echo - Android SDK not installed
    echo - Java version incompatibility
    echo - Network issues downloading dependencies
    echo.
    pause
    exit /b 1
)
