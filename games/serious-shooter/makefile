all: low med high winlow winmed winhigh weblow webmed webhigh

high:
	cc main.c glad_gl.c -I inc -Ofast -lglfw -lm -o release/SeriousShooter_linux_high
	strip --strip-unneeded release/SeriousShooter_linux_high
	upx --lzma --best release/SeriousShooter_linux_high

med:
	cc main.c -DMED glad_gl.c -I inc -Ofast -lglfw -lm -o release/SeriousShooter_linux_med
	strip --strip-unneeded release/SeriousShooter_linux_med
	upx --lzma --best release/SeriousShooter_linux_med

low:
	cc main.c -DLOW glad_gl.c -I inc -Ofast -lglfw -lm -o release/SeriousShooter_linux_low
	strip --strip-unneeded release/SeriousShooter_linux_low
	upx --lzma --best release/SeriousShooter_linux_low

test:
	cc main.c glad_gl.c -I inc -Ofast -lglfw -lm -o /tmp/seriousshooter_test
	/tmp/seriousshooter_test
	rm /tmp/seriousshooter_test

webhigh:
	emcc main.c glad_gl.c -DWEB -O3 --closure 1 -s FILESYSTEM=0 -s USE_GLFW=3 -s ENVIRONMENT=web -s TOTAL_MEMORY=128MB -I inc -o release/web/high/index.html --shell-file t.html

webmed:
	emcc -DMED main.c glad_gl.c -DWEB -O3 --closure 1 -s FILESYSTEM=0 -s USE_GLFW=3 -s ENVIRONMENT=web -s TOTAL_MEMORY=128MB -I inc -o release/web/med/index.html --shell-file t.html

weblow:
	emcc -DLOW main.c glad_gl.c -DWEB -O3 --closure 1 -s FILESYSTEM=0 -s USE_GLFW=3 -s ENVIRONMENT=web -s TOTAL_MEMORY=128MB -I inc -o release/web/low/index.html --shell-file t.html

run:
	emrun bin/index.html

runmed:
	emrun bin/med/index.html

runlow:
	emrun bin/low/index.html

winhigh:
	i686-w64-mingw32-gcc main.c glad_gl.c -Ofast -I inc -L. -lglfw3dll -lm -o release/SeriousShooter_windows_high.exe
	strip --strip-unneeded release/SeriousShooter_windows_high.exe
	upx --lzma --best release/SeriousShooter_windows_high.exe

winmed:
	i686-w64-mingw32-gcc -DMED main.c glad_gl.c -Ofast -I inc -L. -lglfw3dll -lm -o release/SeriousShooter_windows_med.exe
	strip --strip-unneeded release/SeriousShooter_windows_med.exe
	upx --lzma --best release/SeriousShooter_windows_med.exe

winlow:
	i686-w64-mingw32-gcc -DLOW main.c glad_gl.c -Ofast -I inc -L. -lglfw3dll -lm -o release/SeriousShooter_windows_low.exe
	strip --strip-unneeded release/SeriousShooter_windows_low.exe
	upx --lzma --best release/SeriousShooter_windows_low.exe

clean:
	rm -f release/SeriousShooter_linux_high
	rm -f release/SeriousShooter_linux_med
	rm -f release/SeriousShooter_linux_low
	rm -f release/SeriousShooter_windows_high.exe
	rm -f release/SeriousShooter_windows_med.exe
	rm -f release/SeriousShooter_windows_low.exe
	rm -f release/web/high/index.html
	rm -f release/web/high/index.js
	rm -f release/web/high/index.wasm
	rm -f release/web/med/index.html
	rm -f release/web/med/index.js
	rm -f release/web/med/index.wasm
	rm -f release/web/low/index.html
	rm -f release/web/low/index.js
	rm -f release/web/low/index.wasm
