# Dockerfile for Ubuntu SSH server
FROM ubuntu:20.04

# Install openssh server and nano
RUN apt-get update && \
    apt-get install -y openssh-server nano && \
    mkdir /var/run/sshd && \
    echo 'root:password' | chpasswd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

# SSH login fix
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd

# Expose SSH port
EXPOSE 22

# Run SSH server
CMD ["/usr/sbin/sshd", "-D"]