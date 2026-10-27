test:
	docker run --rm -v $(PWD):/app -w /app node node --test