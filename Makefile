.PHONY: verify lint test security build clean install

verify: lint test security
	@echo "All checks passed"

lint:
	npx eslint thunderdown/

test:
	npx vitest run --coverage

security:
	npm audit --audit-level=moderate

build: clean
	cd thunderdown && zip -r ../thunderdown.xpi . -x '*.DS_Store'

clean:
	rm -f thunderdown.xpi

install:
	npm install
