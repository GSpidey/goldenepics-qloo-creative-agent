FROM node:22-bookworm-slim
WORKDIR /srv/creative-agent
COPY gateway/package.json gateway/package-lock.json ./gateway/
RUN cd gateway && npm ci --omit=dev && npm cache clean --force
COPY gateway/server.mjs ./gateway/
COPY lib/creative.mjs ./lib/
ENV BIND_HOST=0.0.0.0
ENV PORT=8788
EXPOSE 8788
USER node
CMD ["node", "gateway/server.mjs"]
