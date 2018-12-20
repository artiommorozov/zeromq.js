setlocal enabledelayedexpansion enableextensions

set
set ZMQ=%~1
set ARCH=%~2

cmake --help >nul 2>nul || echo CMake.exe not found && exit /b 1
tar --help >nul 2>nul || echo tar.exe not found && exit /b 1

if "%ZMQ%-" == "-" (
  echo "No ZMQ version given"
  exit /b 1
)

set BASE=%~dp0
set ZMQ_PREFIX=%BASE%\..\zmq
set ZMQ_SRC_DIR=zeromq-%ZMQ%
set WINDOWS_LIB_DIR=%ZMQ_PREFIX%\..\windows\lib
set BUILDDIR=build.%ARCH%

cd "%ZMQ_PREFIX%"

dir "%ZMQ_SRC_DIR%" >nul 2>nul || tar xzf "zeromq-%ZMQ%.tar.gz" || exit /b 2
pushd "%ZMQ_SRC_DIR%"

mkdir "%BUILDDIR% "
cd "%BUILDDIR%"

@rem missing as of 4.2.5
type 2>nul >>  ..\builds\cmake\clang-format-check.sh.in

pushd ..
call :get_exe_path GIT_PATH git.exe
set "PATCH=%GIT_PATH%\..\usr\bin\patch.exe"
"%PATCH%" -v || echo Patch.exe not found && exit /b 3
"%PATCH%" -p1 < %BASE%\CMakeLists.patch || exit /b 3
popd

cmake -DBUILD_TESTS=OFF -DBUILD_SHARED=OFF -Wno-dev -A %ARCH% ..
cmake --build . --config Release

mkdir "%WINDOWS_LIB_DIR%"
@rem plain copy truncates file if pathname contains two wildcards
FOR /F %%i IN ('dir /b lib\Release\libzmq*-s-*.lib') DO copy lib\Release\%%i "%WINDOWS_LIB_DIR%\libzmq.lib"

popd
rd /s /q "%ZMQ_SRC_DIR%"
del "zeromq-%ZMQ%.tar.gz"

goto :eof

:get_exe_path <a> <b>
(
	set "%~1=%~dp$PATH:2"
	exit /b
)

:eof

endlocal 