FROM python:3.13-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Render sets PORT env var automatically
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
