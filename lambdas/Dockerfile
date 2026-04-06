FROM --platform=linux/amd64 eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY build/libs/scorcerer.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
