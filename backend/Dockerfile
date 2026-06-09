FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app/backend

COPY backend/pyproject.toml ./
COPY backend/alembic.ini ./
COPY backend/app ./app
COPY backend/migrations ./migrations
COPY backend/scripts ./scripts

RUN python -m pip install --upgrade pip && python -m pip install .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
