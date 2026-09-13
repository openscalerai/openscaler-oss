.PHONY: fmt test vet build check run

fmt:
	gofmt -w cmd internal docs

test:
	go test ./...

vet:
	go vet ./...

build:
	mkdir -p dist
	go build -trimpath -o dist/openscaler ./cmd/openscaler

check:
	test -z "$$(gofmt -l cmd internal docs)"
	go vet ./...
	go test ./...
	go build ./cmd/openscaler

run:
	./scripts/dev.sh
