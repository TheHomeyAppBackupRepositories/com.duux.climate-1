"use strict";

const DuuxDevice = require("../../lib/Duux/Device");

class Edge extends DuuxDevice {
  productName = "Edge";
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
      name: "target_temperature",
      codename: "sp",
      options: {
        min: 5,
        max: 36,
        step: 1,
      },
      handleCapabilityChange: (value) => {
        return this.setCapability("target_temperature", value);
      },
    },
    {
      name: "edge_heat_level",
      codename: "eco",
      parseAs: "string",
      handleCapabilityChange: (value) => {
        return this.setCapability("edge_heat_level", value);
      },
    },
    {
      name: "measure_temperature",
      codename: "temp",
    },
    {
      name: "generic_night_mode",
      codename: "night",
      parseAs: "boolean",
      handleCapabilityChange: (value) => {
        return this.setCapability("generic_night_mode", value);
      },
    },
  ];
}

module.exports = Edge;
