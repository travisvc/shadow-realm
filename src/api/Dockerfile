FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
COPY db.py .
COPY logger.py .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/ ./api/

CMD ["python", "api/main.py"]

