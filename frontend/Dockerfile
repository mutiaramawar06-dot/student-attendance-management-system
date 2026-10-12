# Build Stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_STUDENT_API_URL=http://localhost:8000
ARG VITE_ATTENDANCE_API_URL=http://localhost:8080
ENV VITE_STUDENT_API_URL=$VITE_STUDENT_API_URL
ENV VITE_ATTENDANCE_API_URL=$VITE_ATTENDANCE_API_URL

RUN npm run build

# Serve Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
