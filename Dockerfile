# Build Stage
FROM node:20-alpine AS build

# Add a work directory
WORKDIR /app

# Cache and Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy app files
COPY . .

# Build only if NODE_ENV is not development
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

ARG VITE_DEV_MODE=${VITE_DEV_MODE}

ENV VITE_DEV_MODE=${VITE_DEV_MODE}

RUN if [ "$NODE_ENV" = "development" ]; then \
    echo "Dev Mode: Do nothing."; \
    else \
    echo "Build Mode: Building..."; \
    ./node_modules/.bin/orval; \
    npm run build; \
    fi

# Expose port
EXPOSE 3000

# Start the app
CMD [ "npm", "run", "start"]


# Deployment Stage
FROM nginxinc/nginx-unprivileged:alpine AS deploy
COPY --from=build /app/build/ /usr/share/nginx/html
COPY --from=build /app/deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080