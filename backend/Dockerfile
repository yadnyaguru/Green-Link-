FROM eclipse-temurin:21-jre

WORKDIR /app

COPY target/greenlink-backend-1.0.0.jar app.jar

EXPOSE 10000

ENTRYPOINT ["java", "-Dserver.port=10000", "-jar", "app.jar"]
