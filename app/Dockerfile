# Stage 1: Build Svelte frontend and .NET Core backend using a custom image with both Node.js and .NET SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Install Node.js on top of the .NET SDK image
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get install -y build-essential

# Copy package.json and package-lock.json for Node.js dependencies
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the entire project (both frontend and backend)
COPY . .

# Build both the Svelte frontend and .NET Core backend
RUN npm run build

# Publish the .NET Core backend
RUN dotnet publish /app/src/backend/GraphVisualizer -c Release -o /app/publish

# Stage 2: Serve the application using the .NET Core runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Copy the published .NET Core app from Stage 1
COPY --from=build /app/publish /app

# Copy the built Svelte frontend into the wwwroot folder of the .NET Core app
COPY --from=build /app/src/backend/GraphVisualizer/wwwroot/ /app/wwwroot/

# Expose port 80
EXPOSE 80

# Start the .NET Core application
ENTRYPOINT ["dotnet", "GraphVisualizer.dll"]
