NAME=claudecode-usage
UUID=claudecode-usage@guitou.homedev

.PHONY: all pack install clean

all: schemas/gschemas.compiled

schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.$(NAME).gschema.xml
	glib-compile-schemas schemas

$(NAME).zip: extension.js prefs.js schemas/gschemas.compiled metadata.json
	@rm -rf dist
	@mkdir -p dist
	@cp extension.js prefs.js metadata.json dist/
	@cp -r schemas dist/
	@cp -r icons dist/
	@(cd dist && zip ../$(NAME).zip -9r .)
	@rm -rf dist

pack: $(NAME).zip

install: $(NAME).zip
	gnome-extensions install --force $(NAME).zip

clean:
	@rm -rf dist $(NAME).zip schemas/gschemas.compiled
