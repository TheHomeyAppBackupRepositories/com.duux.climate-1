"use strict";

const DuuxDevice = require("../../lib/Duux/Device");

class Threesixty extends DuuxDevice {
  productName = "Threesixty";
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
      name: "threesixty_heat_level",
      codename: "mode",
      parseAs: "string",
      handleCapabilityChange: (value) => {
        return this.setCapability("threesixty_heat_level", value);
      },
    },
    {
      name: "target_temperature",
      codename: "setpoint",
      options: {
        min: 0,
        max: 38,
        step: 1,
      },
      handleCapabilityChange: (value) => {
        return this.setCapability("target_temperature", value);
      },
    },
    {
      name: "measure_temperature",
      codename: "temp",
    },
  ];
}

module.exports = Threesixty;
