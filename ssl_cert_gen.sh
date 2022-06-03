#!/usr/bin/env bash

# Script follows the instructions here:
# https://gist.github.com/pgilad/63ddb94e0691eebd502deee207ff62bd
# Note that this is only applicable for OSX.

DIR=webcerts

mkdir ${DIR}


# Generate private key.
openssl genrsa -out ${DIR}/private.key 4096

# Generate a certificate signing request
openssl req -new -sha256 \
    -out ${DIR}/private.csr \
    -key ${DIR}/private.key \
    -config ${DIR}/ssl.conf 

# Generate the certificate
openssl x509 -req \
    -days 3650 \
    -in ${DIR}/private.csr \
    -signkey ${DIR}/private.key \
    -out ${DIR}/private.crt \
    -extensions req_ext \
    -extfile ${DIR}/ssl.conf

# Add certificate to keychain and trust it
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ${DIR}/private.crt

# Create a pem file from certificate
openssl x509 -in ${DIR}/private.crt -out ${DIR}/private.pem -outform PEM