FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY worker.csproj .

RUN dotnet restore

COPY . .

RUN dotnet publish -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/runtime:8.0

WORKDIR /app

COPY --from=build /app/out .

ENTRYPOINT ["dotnet", "worker.dll"]
