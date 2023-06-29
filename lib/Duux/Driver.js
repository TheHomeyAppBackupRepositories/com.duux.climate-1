"use strict";

const { OAuth2Driver } = require("homey-oauth2app");
class DuuxDriver extends OAuth2Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onOAuth2Init() {
    this.log(`[Duux] Driver for "${this.productName}" has been initialized`);
  }

  async onPairListDevices({ oAuth2Client }) {
    const currentUser = await oAuth2Client.getUser();
    const deviceFetchRequests = currentUser.user.tenants.map((tenant) =>
      oAuth2Client.getDevicesForTenant(tenant.id)
    );
    const devicesPerTenant = await await Promise.all(deviceFetchRequests);

    let parsedDevices = [];

    devicesPerTenant.forEach((devices, index) => {
      const tenantDevices = devices
        .map((device) => {
          const productIds = device.sensorType?.productId;
          if (!productIds) {
            return null;
          }
          let parsedProductIds;
          try {
            parsedProductIds = JSON.parse(productIds);
          } catch (e) {
            this.log("Failed parsing product-ids", e);
            return null;
          }
          return {
            name: device.displayName || device.name,
            data: {
              id: device.id,
              product_id: parsedProductIds[0],
              mac: device.deviceId,
              tenant_id: currentUser.user.tenants[index].id,
            },
          };
        })
        .filter((device) => !!device);
      parsedDevices.push(...tenantDevices);
    });

    const matchedDevices = parsedDevices.filter((device) =>
      this.productIds.includes(device.data.product_id)
    );
    this.log(`Found ${matchedDevices.length} devices`);

    return parsedDevices.filter((device) =>
      this.productIds.includes(device.data.product_id)
    );
  }
}

module.exports = DuuxDriver;
