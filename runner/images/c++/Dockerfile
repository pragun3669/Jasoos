FROM gcc:13-slim

# Create a non-root user and working directory
RUN groupadd -r sandbox && useradd -r -g sandbox -d /home/sandbox -s /sbin/nologin sandbox \
    && mkdir -p /home/sandbox/work && chown -R sandbox:sandbox /home/sandbox

USER sandbox
WORKDIR /home/sandbox/work

CMD ["/bin/sh", "-c", "echo C++ sandbox image ready && sleep infinity"]