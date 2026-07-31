# mcr.microsoft.com/dotnet/{sdk,aspnet} are multi-arch manifests (amd64 + arm64). Without
# --platform, `docker build` resolves whichever slice matches the machine doing the build (e.g.
# an arm64 image on Apple Silicon) - not Render's runtime, which is amd64. Running an arm64
# binary under emulation (or a mismatched slice via a registry push) is a well-known cause of
# a .NET process segfaulting (exit 139) right at startup, since the CLR's JIT and P/Invoke'd
# native libraries (e.g. SQLitePCLRaw's bundled libe_sqlite3.so, used from the very first
# database call) are especially prone to crashing under architecture mismatch/QEMU emulation.
# Pinning both stages to linux/amd64 makes the built image match Render regardless of which
# machine (or CI runner) produces it.
FROM --platform=linux/amd64 mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY LibraryOccupancy.Api.csproj ./
RUN dotnet restore "LibraryOccupancy.Api.csproj"

COPY . .
RUN dotnet publish "LibraryOccupancy.Api.csproj" -c Release -o /app/publish --no-restore

FROM --platform=linux/amd64 mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production

# Render assigns the listen port via the PORT env var at container start,
# so it has to be read at runtime (not baked in with ENV) and exec'd as PID 1
# for SIGTERM to reach the app for graceful shutdown.
ENTRYPOINT ["/bin/sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} exec dotnet LibraryOccupancy.Api.dll"]
