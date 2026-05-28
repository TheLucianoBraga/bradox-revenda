FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_BRADOX_SUPABASE_URL
ARG VITE_BRADOX_SUPABASE_ANON_KEY
ARG VITE_BRADOX_SUPABASE_SCHEMA=bradox_revenda
ENV VITE_BRADOX_SUPABASE_URL=$VITE_BRADOX_SUPABASE_URL
ENV VITE_BRADOX_SUPABASE_ANON_KEY=$VITE_BRADOX_SUPABASE_ANON_KEY
ENV VITE_BRADOX_SUPABASE_SCHEMA=$VITE_BRADOX_SUPABASE_SCHEMA
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/vite.config.ts ./vite.config.ts
COPY --from=build /app/wrangler.jsonc ./wrangler.jsonc
RUN cp dist/server/index.js dist/server/server.js
EXPOSE 8080
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]