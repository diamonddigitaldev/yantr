FROM ghcr.io/anomalyco/opencode:latest

RUN apk add --no-cache docker-cli wget

WORKDIR /workspace

RUN wget -q -O apps.md https://raw.githubusercontent.com/besoeasy/yantr/refs/heads/main/apps/apps.md && \
    printf '{"$schema":"https://opencode.ai/config.json","instructions":["apps.md"]}' > opencode.json
