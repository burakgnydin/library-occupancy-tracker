FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY LibraryOccupancy.Api.csproj ./
RUN dotnet restore "LibraryOccupancy.Api.csproj"

COPY . .
RUN dotnet publish "LibraryOccupancy.Api.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production

# Render assigns the listen port via the PORT env var at container start,
# so it has to be read at runtime (not baked in with ENV) and exec'd as PID 1
# for SIGTERM to reach the app for graceful shutdown.
ENTRYPOINT ["/bin/sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} exec dotnet LibraryOccupancy.Api.dll"]
