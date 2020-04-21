.PHONY: help all clean install lint build test


help:
	@echo  'Targets: help all clean install lint build test'

all: clean install lint build test

clean:
	rm -rf node_modules/ public/

install:
	npm install

lint:
	npm run lint

build:
	mkdir -p public/css/
	cp *.js *.html public/
	cp -r css images public/
	cp -r node_modules/flag-icon-css/flags/ public/
	cp node_modules/flag-icon-css/css/flag-icon.min.css public/css/
	node ./build-scripts/convert-markdown.js

test:
	npm test
