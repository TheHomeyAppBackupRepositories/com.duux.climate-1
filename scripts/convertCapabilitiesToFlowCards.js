const { promises } = require("fs");
const { readdir, readFile, writeFile } = promises;

/**
 * Converts Homey-compose capabilities
 * into Homey-compose flow-cards based
 * on the capability's UI-component
 */

// Main methods
const run = async () => {
  const composeDirectoryExists = await readdir("./.homeycompose");
  if (!composeDirectoryExists) {
    throw new Error("No Homey-compose directory found");
  }

  const capabilityFileNames = await readdir("./.homeycompose/capabilities");
  const conversionArray = capabilityFileNames.map((capabilityFileName) =>
    convertCapability(capabilityFileName)
  );
  await Promise.all(conversionArray);
};

const convertCapability = async (capabilityFileName) => {
  const capabilityFile = await readFile(
    `./.homeycompose/capabilities/${capabilityFileName}`,
    {
      encoding: "utf-8",
    }
  );
  if (!capabilityFile) {
    throw new Error(`Capability "${capabilityFileName}" not found`);
  }
  const parsedCapability = JSON.parse(capabilityFile);
  const capabilityName = capabilityFileName.replace(".json", "");

  let argument = {
    name: capabilityName,
    title: {
      en: `${parsedCapability.title.en}`,
      nl: `${parsedCapability.title.nl}`,
    },
  };
  switch (parsedCapability.uiComponent) {
    case "slider":
    case "thermostat":
      argument = {
        ...argument,
        type: "range",
        min: 0,
        max: 30,
        step: 1,
        label: parsedCapability.units,
      };
      break;
    case "picker":
      argument = {
        ...argument,
        type: "dropdown",
        values: parsedCapability.values,
      };
      break;
    case "toggle":
      argument = {
        ...argument,
        type: "dropdown",
        values: [
          {
            id: "true",
            title: {
              en: "On",
              nl: "Aan",
            },
          },
          {
            id: "false",
            title: {
              en: "Off",
              nl: "Uit",
            },
          },
        ],
      };
      break;
    default:
      return;
  }

  const args = [argument];

  if (parsedCapability._driverIds) {
    args.push({
      type: "device",
      name: "Device",
      filter: `driver_id=${parsedCapability._driverIds.join("|")}`,
    });
  }

  const action = {
    id: capabilityName,
    type: "device",
    title: {
      en: `Set ${parsedCapability.title.en.toLowerCase()}`,
      nl: `Stel ${parsedCapability.title.en.toLowerCase()} in`,
    },
    titleFormatted: {
      en: `The ${parsedCapability.title.en.toLowerCase()} is set to [[${capabilityName}]]`,
      nl: `De ${parsedCapability.title.nl.toLowerCase()} is ingesteld op [[${capabilityName}]]`,
    },
    args,
  };

  await writeFile(
    `./.homeycompose/flow/actions/${capabilityFileName}`,
    JSON.stringify(action),
    {
      encoding: "utf-8",
    }
  );
  return action;
};

run();
