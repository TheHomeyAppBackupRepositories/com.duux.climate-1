"use strict";

const EventEmitter = require("events");
const Homey = require("homey");
const { OAuth2Device } = require("homey-oauth2app");

class DuuxDevice extends OAuth2Device {
  config = {
    /**
     * Determines how long to wait before reconnecting
     * to a device after a failed connection attempt.
     */
    reconnectDebounceTimeInMs: 10000,
  };

  /**
   * onInit is called when the device is initialized.
   */
  onOAuth2Init = async () => {
    // Initiate device
    const deviceName = this.getName();
    const deviceData = this.getData();

    this.deviceName = deviceName;
    this.deviceId = deviceData.id;
    this.deviceEmitter = new EventEmitter();
    this.deviceSocket = null;
    this.devicePollInterval = null;

    // Connect
    // Apply random timeout to avoid authentication-token collision for websocket
    this.homey.setTimeout(async () => {
      try {
        this.subscribeDeviceEvents();
      } catch (e) {
        this.sendLog(e);
        this.setUnavailable();
      }
      await this.getMeasurements();
    }, Math.floor(Math.random() * 10));

    // Polling
    this.homey.setInterval(async () => {
      await this.getMeasurements();
    }, 30 * 1000);

    // Bind capabilities
    this.productCapabilities.forEach(async (capability) => {
      if (!capability.handleCapabilityChange) {
        // Capability is likely a sensor
        this.deviceEmitter.on(capability.name, async (value) => {
          try {
            const triggerCard = this.homey.flow.getDeviceTriggerCard(
              capability.name
            );
            await triggerCard.trigger(this, {
              value,
            });
          } catch (e) {
            this.sendLog("tiggerCardException", e);
          }
        });
        return;
      }

      this.registerCapabilityListener(capability.name, async (value) =>
        capability.handleCapabilityChange(value)
      );

      // Power-capability has a built-in action-card that requires no registration
      if (capability.name === "onoff") {
        return;
      }

      if (capability.options) {
        await this.setCapabilityOptions(capability.name, capability.options);
      }

      let actionCard;
      try {
        actionCard = this.homey.flow.getActionCard(capability.name);
      } catch (e) {
        this.sendLog("actionCardException", e);
      }
      if (actionCard) {
        actionCard.registerRunListener(async (args) => {
          capability.handleCapabilityChange(args[capability.name]);
        });
      }
    });
  };

  subscribeDeviceEvents = async (retry = false) => {
    const deviceData = this.getData();
    try {
      await this.oAuth2Client.attemptConnection();
    } catch (e) {
      this.handleWebsocketError(e, retry);
      return;
    }
    this.sendLog("Connected to Websocket");

    const topic = `tenants/${deviceData.tenant_id}/sensors/${deviceData.mac}/measurements`;
    const message = {
      type: "subscribe",
      data: {
        topics: [topic],
      },
    };
    this.oAuth2Client.deviceSocket.send(JSON.stringify(message));

    this.oAuth2Client.deviceSocket.on("close", (e) => {
      this.handleWebsocketError(e, retry);
      return;
    });

    this.oAuth2Client.deviceSocket.onmessage = (message) => {
      if (message.data) {
        try {
          const jsonData = JSON.parse(message.data);
          if (
            jsonData.type === "data" &&
            jsonData.data.deviceId === deviceData.mac
          ) {
            this.onDeviceDataReceived(jsonData.data.sub.Tune[0]);
          }
        } catch (e) {
          this.sendLog("Received unparseable websocket-event");
          this.sendLog(e);
        }
      }
    };
    return;
  };

  handleWebsocketError = async (e, retry = false) => {
    if (!retry) {
      this.sendLog("Websocket disconnected, reconnecting in 5 seconds...");
      this.homey.setTimeout(async () => {
        await this.subscribeDeviceEvents(true);
      }, 5000);
    } else {
      this.sendLog("Websocket disconnected, falling back to polling");
      this.devicePollInterval = this.homey.setInterval(() => {
        this.getMeasurements();
      }, 30 * 1000);
    }
    this.error(e);
    return;
  };

  getMeasurements = async () => {
    const deviceData = this.getData();
    try {
      const device = await this.oAuth2Client.getDevice(
        deviceData.tenant_id,
        deviceData.id
      );
      const latestMeasurements = device.latestData?.fullData;
      this.onDeviceDataReceived(latestMeasurements);
      if (!device.online) {
        this.onDeviceDisconnected();
      } else {
        this.onDeviceConnected();
      }
    } catch (e) {
      this.sendLog("Failed getting device data");
      this.sendLog(e);
    }
    return;
  };

  sendLog = (message, message2) => {
    const { productName, deviceName, deviceId } = this;
    this.log(`[Duux] ${productName} "${deviceName}" (${deviceId}) ${message}`);
    if (message2) {
      this.log(message2);
    }
  };

  async setCapability(capabilityName, value) {
    const requestedCapability = this.productCapabilities.find(
      (capability) => capabilityName === capability.name
    );

    if (!requestedCapability) {
      this.sendLog(
        "Unknown capability was attempted to be set:",
        capabilityName
      );
      return;
    }

    this.sendLog(
      `Requesting Codename ${requestedCapability.codename} set to ${value}`
    );
    try {
      const deviceData = this.getData();
      await this.oAuth2Client.sendDeviceCommand(
        deviceData.tenant_id,
        deviceData.id,
        requestedCapability.codename,
        value
      );
    } catch (e) {
      this.sendLog(e);
    }
  }

  onDeviceDataReceived = (data) => {
    const dataEntries = Object.entries(data);

    dataEntries.forEach(([codenameIndex, codenameValue]) => {
      const requestedCapability = this.productCapabilities.find(
        (capability) => capability.codename === codenameIndex
      );

      if (!requestedCapability) {
        return;
      }

      this.sendLog(
        `${requestedCapability.name} set to ${codenameValue}, parsing as ${
          requestedCapability.parseAs || "number"
        }`
      );
      let parsedValue = codenameValue;
      if (requestedCapability.parseAs === "string") {
        parsedValue = codenameValue.toString();
      }
      if (requestedCapability.parseAs === "boolean") {
        parsedValue = codenameValue === 1;
      }
      this.setCapabilityValue(requestedCapability.name, parsedValue).catch(
        this.error
      );
      this.deviceEmitter.emit(requestedCapability.name, parsedValue);
    });
  };

  onDeviceConnected = () => {
    this.sendLog(`connected`);
    this.setAvailable().catch(this.error);
  };

  onDeviceDisconnected = async () => {
    this.sendLog(`Disconnected`);
    this.setUnavailable().catch(this.error);
  };

  onDeviceError = (error) => {
    this.sendLog(error);
    this.sendLog(`Error`, error);
  };

  onOAuth2Deleted = async () => {
    this.device.removeAllListeners();

    try {
      await this.device.disconnect();
    } catch (e) {
      this.sendLog(e);
    }
  };
}

module.exports = DuuxDevice;
