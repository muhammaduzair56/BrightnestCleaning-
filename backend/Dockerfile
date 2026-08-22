# Hugging Face Docker Space deployment for the BrightNest FastAPI service.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

RUN useradd --create-home --uid 1000 user
WORKDIR /home/user/app

COPY --chown=user:user requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY --chown=user:user . .
RUN chmod +x ./scripts/start.sh

USER user
EXPOSE 8080

CMD ["./scripts/start.sh"]
