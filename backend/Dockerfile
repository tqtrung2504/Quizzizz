# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY OnlineExam/OnlineExam.csproj OnlineExam/
RUN dotnet restore OnlineExam/OnlineExam.csproj

COPY OnlineExam/ OnlineExam/
RUN dotnet publish OnlineExam/OnlineExam.csproj -c Release -o /app/publish

# Stage 2: Run
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=build /app/publish .

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "OnlineExam.dll"]
