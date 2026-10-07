all:
	gcc ../main.c ../glad_gl.c -I ../inc -Ofast -lglfw -lm -o seriousshooter

install:
	cp seriousshooter $(DESTDIR)

uninstall:
	rm $(DESTDIR)/seriousshooter

clean:
	rm seriousshooter