FROM openjdk:17-slim

# Install Python, pip, g++, and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    util-linux \
    g++ \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy runner app
COPY app.py .

EXPOSE 5000
CMD ["python3", "app.py"]
