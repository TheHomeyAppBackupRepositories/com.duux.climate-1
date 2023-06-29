"use strict";

const DuuxDevice = require("../../lib/Duux/Device");

class Bright extends DuuxDevice {
  productName = "Bright";
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
      name: "bright_fan_speed",
      codename: "speed",
      parseAs: "string",
      handleCapabilityChange: (value) => {
        return this.setCapability("bright_fan_speed", value);
      },
    },
    {
      name: "generic_ioniser_mode",
      codename: "ion",
      parseAs: "boolean",
      handleCapabilityChange: (value) => {
        return this.setCapability("generic_ioniser_mode", JSON.parse(value));
      },
    },
    {
      name: "measure_pm25",
      codename: "ppm",
    },
    {
      name: "measure_filter",
      codename: "filter",
    },
  ];
}

module.exports = Bright;
