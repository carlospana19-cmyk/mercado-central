@echo off
REM Levanta el servidor IA local en http://127.0.0.1:5001
REM Usar antes de probar los botones IA en publicar.html / editar-anuncio.html
cd /d "%~dp0"
python ia_server.py
pause
