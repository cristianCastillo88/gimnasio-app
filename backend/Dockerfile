# ======================================================================
# GymApp Backend - Dockerfile Multi-Etapa (.NET 10)
# Compatible con compilación nativa y cruzada para linux/arm64 y linux/amd64
# ======================================================================

# --------------------------------------------------
# Etapa 1: Compilación y Publicación (SDK .NET 10)
# --------------------------------------------------
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG TARGETARCH
WORKDIR /src

# Copiar csproj y restaurar dependencias con cache por capas
COPY ["src/GymApp.Api/GymApp.Api.csproj", "src/GymApp.Api/"]
RUN dotnet restore "src/GymApp.Api/GymApp.Api.csproj" -a $TARGETARCH

# Copiar el código fuente completo del backend
COPY src/GymApp.Api/ src/GymApp.Api/
WORKDIR "/src/src/GymApp.Api"

# Compilar binarios optimizados en modo Release para la arquitectura de destino
RUN dotnet publish "GymApp.Api.csproj" \
    -c Release \
    -a $TARGETARCH \
    -o /app/publish \
    /p:UseAppHost=false

# --------------------------------------------------
# Etapa 2: Runtime Ultraligero y Seguro (.NET 10 ASP.NET)
# --------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Puerto interno por convención
EXPOSE 5000

ENV ASPNETCORE_URLS=http://+:5000 \
    DOTNET_EnableDiagnostics=0

COPY --from=build /app/publish .

# Ejecutar con usuario no-root ($APP_UID = 1654) para cumplimiento OWASP A02
USER $APP_UID

ENTRYPOINT ["dotnet", "GymApp.Api.dll"]
