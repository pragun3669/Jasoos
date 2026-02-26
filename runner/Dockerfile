FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install only what is required for C++
RUN apt-get update && apt-get install -y \
    g++ \
    util-linux \
    curl \
    python3 \
    python3-pip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 5000

CMD ["python3", "app.py"]