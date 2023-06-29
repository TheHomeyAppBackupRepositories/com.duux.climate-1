"use strict";

const DuuxDevice = require("../../lib/Duux/Device");

class BeamMini extends DuuxDevice {
  productName = "Beam Mini";
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
      name: "beam_mini_spray_volume",
      codename: "speed",
      parseAs: "string",
      handleCapabilityChange: (value) => {
        return this.setCapability("beam_mini_spray_volume", value);
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
      name: "beam_mode_mini",
      codename: "mode",
      parseAs: "string",
      handleCapabilityChange: (value) => {
        return this.setCapability("beam_mode_mini", value);
      },
    },
  ];
}

module.exports = BeamMini;
