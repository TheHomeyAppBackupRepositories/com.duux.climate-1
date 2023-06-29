const { OAuth2Client } = require("homey-oauth2app");
const WebSocket = require("ws");

module.exports = class DuuxOAuth2Client extends OAuth2Client {
  static API_URL = "https://v4.api.cloudgarden.nl";
  static TOKEN_URL = "https://v4.api.cloudgarden.nl/auth/oauth2/token";
  static AUTHORIZATION_URL =
    "https://v4.api.cloudgarden.nl/tenants/44/auth/oauth2/authorize?loginRedirectType=passwordless";
  static SCOPES = ["my_scope"];
  static REDIRECT_URL = "https://callback.athom.com/oauth2/callback";
  deviceSocket = null;

  attemptConnection = (overrideConnection = false) => {
    return new Promise(async (resolve, reject) => {
      if (
        this.deviceSocket &&
        this.deviceSocket.readyState === this.deviceSocket.OPEN &&
        !overrideConnection
      ) {
        resolve();
        return;
      }

      const websocketTicket = await this.getWebsocketTicket();

      this.deviceSocket = new WebSocket(
        `wss://ws.cloudgarden.nl?token=${websocketTicket.ticket}`
      );
      this.deviceSocket.onopen = () => {
        resolve();
      };
      this.deviceSocket.on("unexpected-response", (request, response) => {
        reject(response);
      });
    });
  };

  async onHandleNotOK({ body }) {
    throw new OAuth2Error(body.error);
  }

  async getUser() {
    return this.get({
      path: "/users/current",
    });
  }

  async getDevicesForTenant(tenantId) {
    return this.get({
      path: `/tenants/${tenantId}/sensors`,
    });
  }

  async sendDeviceCommand(tenantId, deviceId, command, value) {
    const commandValue = typeof value === "boolean" ? (value ? 1 : 0) : value;
    const commandString = `command=tune set ${command} ${commandValue}`;
    return this.post({
      path: `/tenants/${tenantId}/sensors/${deviceId}/command`,
      body: commandString,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
    });
  }

  async getDevice(tenantId, deviceId) {
    return this.get({
      path: `/tenants/${tenantId}/sensors/${deviceId}`,
    });
  }

  async getWebsocketTicket() {
    return this.get({
      path: "/ws/ticket",
    });
  }
};
