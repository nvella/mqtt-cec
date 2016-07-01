# mqtt-cec

Control basic HDMI devices over CEC. Currently a work in progress.

## Goals
  - Universal support for any cec-client command
  - Simple MQTT topics

## MQTT Topics

CEC device IDs will be mapped to MQTT topics in the application configuration. Various different MQTT sub-topics will then be exposed:
  - $CEC_DEVICE_TOPIC/power
    Power state of CEC device. Listen to it to receive power updates on the CEC device and broadcast to it to change the power state.
