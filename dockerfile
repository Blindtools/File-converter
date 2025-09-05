FROM node:18-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends \
  libreoffice ffmpeg libvips-dev ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY . .

RUN mkdir -p /tmp/uploads
EXPOSE 3000
CMD ["node", "index.js"]
