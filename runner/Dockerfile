FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install Java, Python, g++, pip
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    python3 \
    python3-pip \
    g++ \
    util-linux \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy runner app
COPY app.py .

EXPOSE 5000

CMD ["python3", "app.py"]