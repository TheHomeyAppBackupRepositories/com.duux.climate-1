"use strict";

const DuuxDevice = require("../../lib/Duux/Device");

class Beam extends DuuxDevice {
  productName = "Beam";
  productCapabilities = [
    {
      name: "onoff",
      codename: "power",
      parseAs: "boolean",
      handleCapabilityChange: (value) => {
        return this.setCapability("onoff", value);
      },
    },
    {
      name: "beam_spray_volume",
      codename: "speed",
      parseAs: "string",
      handleCapabilityChange: (value) => {
        return this.setCapability("beam_spray_volume", value);
      },
    },
    {
      name: "beam_humidity",
      codename: "sp",
      handleCapabilityChange: (value) => {
        return this.setCapability("beam_humidity", value);
      },
    },
    {
      name: "measure_humidity",
      codename: "hum",
    },
    {
      name: "measure_temperature",
      codename: "temp",
    },
    {
      name: "beam_mode",
      codename: "mode",
      parseAs: "string",
      handleCapabilityChange: (value) => {
        return this.setCapability("beam_mode", value);
      },
    },
  ];
}

module.exports = Beam;
