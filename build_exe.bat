@echo off
title Earnify Prompt Detector Pro Builder
echo ==========================================================
echo Earnify Prompt Detector Pro - Standalone EXE Compiler
echo ==========================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not added to PATH.
    echo Please install Python and try again.
    pause
    exit /b 1
)

echo [1/3] Installing dependencies from requirements.txt...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Failed to install some dependencies. Attempting to install Flask, google-genai, and pyinstaller directly...
    pip install Flask google-genai pyinstaller
)

echo.
echo [2/3] Compiling application using PyInstaller...
pyinstaller --clean --onefile --add-data "templates;templates" --add-data "static;static" --name "Earnify Prompt Detector Pro" app.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] PyInstaller compilation failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Cleaning up temporary build files...
if exist build rmdir /s /q build
if exist "Earnify Prompt Detector Pro.spec" del /q "Earnify Prompt Detector Pro.spec"

echo.
echo ==========================================================
echo Compilation Successful!
echo Standalone executable is located in: dist\Earnify Prompt Detector Pro.exe
echo ==========================================================
echo.
pause
