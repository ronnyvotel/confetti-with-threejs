# Confetti: With Pose Estimation and Three.js

![Confetti](https://github.com/ronnyvotel/confetti-with-threejs/blob/main/confetti.gif "Confetti with Pose and Three.js")

## Setup
Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

``` bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev
```

## [Optional] Create ssl certificate
To access the webcam, the site must use HTTPS. However, without a certificate
for localhost, your browser will likely complain with the mesage "Your
connection is not private". You can either click "Advanced" ->
"Proceed to localhost", or you can follow the instructions below.

If you would rather not see this message, you need to generate a SSL
Certificate for the webpack dev server.

To do this on Mac (based on the instructions
[here](https://gist.github.com/pgilad/63ddb94e0691eebd502deee207ff62bd)),
perform the following:

* Run `bash ssl_cert_gen.sh`
* You will be prompted with information to populate the certificate. Defaults
  are already supplied so you can keep pressing return.
* You will need to supply your password once or twice to add the certificate to
  your keychain.
* Once this is complete, open `webpack.dev.js`, and comment out the line
  `https: true`, and uncomment the `https` object underneath.
* Re-run `npm run dev` and now you should no longer see a warning from your
  browser.

If you are on another platform (Linux / Windows), find an equivalent method to
generate a certificate.