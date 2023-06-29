"use strict";

const Homey = require("homey");
const { OAuth2App } = require("homey-oauth2app");
const DuuxOAuth2Client = require("./lib/Duux/Service");
class DuuxApp extends OAuth2App {
  static OAUTH2_CLIENT = DuuxOAuth2Client;
  static OAUTH2_DEBUG = true;
  static OAUTH2_MULTI_SESSION = true;

  async onOAuth2Init() {
    this.log("[Duux] App has been initialized");
  }
}

module.exports = DuuxApp;
