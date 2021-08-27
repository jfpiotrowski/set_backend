# set_backend
This is a repo containing the backend of a web application to serve the game SET. This backend listens on the port 3000 and is meant to be used with the frontend client also available in the jfpiotrowski repo. Note that this is NOT secure and is meant to run on a private LAN.

## How to run the backend
* npm install
* npm run serve
* don't forget to run set_frontend!

## Design Usecase

This application was written to run on a Raspberry Pi providing a WiFi access point. An image was created to launch this application and the frontend and to be reachable at the Pi's IP address (192.168.0.1). The associated Pi image is on a SD card I may be lucky enough to find someday, but the app still works fine on a PC.

Again this has no security, so don't serve it publically. I also make no claims about hackability, but it's probably not great.
