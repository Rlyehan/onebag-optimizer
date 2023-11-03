# Start from the official Go image.
FROM golang:1.21-alpine as builder

# Install git.
# Git is required for fetching the dependencies.
RUN apk update && apk add --no-cache git

# Set the Current Working Directory inside the container.
WORKDIR /app

# Copy go mod and sum files.
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed.
RUN go mod download

# Copy the source from the current directory to the Working Directory inside the container.
COPY . .

# Build the Go app.
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Start a new stage from scratch.
FROM alpine:latest

# Set the Current Working Directory inside the container.
WORKDIR /root/

# Copy the Pre-built binary file from the previous stage.
COPY --from=builder /app/main .

# Copy static files.
COPY --from=builder /app/static /root/static

# Expose port 8080 to the outside world.
EXPOSE 8080

# Command to run the executable.
CMD ["./main"]

