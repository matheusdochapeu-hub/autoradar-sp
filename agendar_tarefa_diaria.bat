@echo off
chcp 65001 >nul
echo ==============================================================
echo   AutoRadar SP - Agendador de Atualização Diária Automática
echo ==============================================================
echo.
echo Criando tarefa no Agendador de Tarefas do Windows para executar:
echo python updater.py todos os dias às 06:00 da manhã...
echo.

set SCRIPT_DIR=%~dp0
set PYTHON_EXE=python

schtasks /create /tn "AutoRadarSP_DailyUpdate" /tr "\"%PYTHON_EXE%\" \"%SCRIPT_DIR%updater.py\"" /sc daily /st 06:00 /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCESSO] Tarefa "AutoRadarSP_DailyUpdate" agendada com sucesso!
    echo Ela será executada diariamente às 06:00 para atualizar ofertas.
) else (
    echo.
    echo [AVISO] Se não tiver permissão de administrador, execute este .bat como Administrador.
    echo Você também pode atualizar diretamente clicando no botão "Atualizar Agora" dentro do App!
)

echo.
pause
