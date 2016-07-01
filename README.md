# mqtt-cec

Control basic HDMI devices over CEC. Currently a work in progress.

## Features
  - Simple MQTT topics
  - Support for power on/off, state updates

## MQTT Topics

CEC device IDs will be mapped to MQTT topics in the application configuration. Various different MQTT sub-topics will then be exposed:
  - `$CEC_DEVICE_TOPIC/power`
    Power state of CEC device. Listen to it to receive power updates on the CEC device and broadcast to it to change the power state.

## Contributing

Please don't hesitate to submit pull requests to this project if you feel a certain HDMI CEC command is missing. Unfortunately my TV (2009 Panasonic) doesn't support many CEC commands beside on/off so I can't add those extra commands on my own.
