install:
	pip install -r requirements.txt
	playwright install chromium

dev:
	uvicorn main:app --reload --port 8000

test:
	pytest tests/ -v
