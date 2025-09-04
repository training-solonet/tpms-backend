
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.FleetGroupScalarFieldEnum = {
  id: 'id',
  name: 'name',
  site: 'site',
  description: 'description',
  createdAt: 'createdAt',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy'
};

exports.Prisma.TruckScalarFieldEnum = {
  id: 'id',
  plateNumber: 'plateNumber',
  vin: 'vin',
  name: 'name',
  model: 'model',
  year: 'year',
  tireConfig: 'tireConfig',
  fleetGroupId: 'fleetGroupId',
  createdAt: 'createdAt',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy'
};

exports.Prisma.DeviceScalarFieldEnum = {
  id: 'id',
  truckId: 'truckId',
  sn: 'sn',
  simNumber: 'simNumber',
  installedAt: 'installedAt',
  removedAt: 'removedAt',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy'
};

exports.Prisma.SensorScalarFieldEnum = {
  id: 'id',
  deviceId: 'deviceId',
  type: 'type',
  positionNo: 'positionNo',
  sn: 'sn',
  installedAt: 'installedAt',
  removedAt: 'removedAt',
  createdBy: 'createdBy',
  updatedBy: 'updatedBy'
};

exports.Prisma.TruckStatusEventScalarFieldEnum = {
  id: 'id',
  truckId: 'truckId',
  status: 'status',
  note: 'note',
  changedAt: 'changedAt',
  createdBy: 'createdBy'
};

exports.Prisma.GeofenceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdBy: 'createdBy',
  createdAt: 'createdAt'
};

exports.Prisma.GpsPositionScalarFieldEnum = {
  id: 'id',
  deviceId: 'deviceId',
  truckId: 'truckId',
  ts: 'ts',
  speedKph: 'speedKph',
  headingDeg: 'headingDeg',
  hdop: 'hdop',
  source: 'source'
};

exports.Prisma.TripScalarFieldEnum = {
  id: 'id',
  truckId: 'truckId',
  startTs: 'startTs',
  endTs: 'endTs'
};

exports.Prisma.TirePressureEventScalarFieldEnum = {
  id: 'id',
  deviceId: 'deviceId',
  truckId: 'truckId',
  tireNo: 'tireNo',
  pressureKpa: 'pressureKpa',
  tempCelsius: 'tempCelsius',
  exType: 'exType',
  batteryLevel: 'batteryLevel',
  changedAt: 'changedAt',
  createdBy: 'createdBy'
};

exports.Prisma.TireErrorCodeScalarFieldEnum = {
  code: 'code',
  description: 'description'
};

exports.Prisma.HubTemperatureEventScalarFieldEnum = {
  id: 'id',
  deviceId: 'deviceId',
  truckId: 'truckId',
  hubNo: 'hubNo',
  tempCelsius: 'tempCelsius',
  exType: 'exType',
  batteryLevel: 'batteryLevel',
  changedAt: 'changedAt',
  createdBy: 'createdBy'
};

exports.Prisma.FuelLevelEventScalarFieldEnum = {
  id: 'id',
  truckId: 'truckId',
  fuelPercent: 'fuelPercent',
  changedAt: 'changedAt',
  source: 'source',
  createdBy: 'createdBy'
};

exports.Prisma.SpeedEventScalarFieldEnum = {
  id: 'id',
  truckId: 'truckId',
  speedKph: 'speedKph',
  changedAt: 'changedAt',
  source: 'source',
  createdBy: 'createdBy'
};

exports.Prisma.AlertEventScalarFieldEnum = {
  id: 'id',
  truckId: 'truckId',
  type: 'type',
  severity: 'severity',
  detail: 'detail',
  occurredAt: 'occurredAt',
  acknowledged: 'acknowledged',
  createdBy: 'createdBy'
};

exports.Prisma.DeviceStatusEventScalarFieldEnum = {
  id: 'id',
  deviceId: 'deviceId',
  truckId: 'truckId',
  hostBat: 'hostBat',
  repeater1Bat: 'repeater1Bat',
  repeater2Bat: 'repeater2Bat',
  lockState: 'lockState',
  reportedAt: 'reportedAt',
  createdBy: 'createdBy'
};

exports.Prisma.LockEventScalarFieldEnum = {
  id: 'id',
  deviceId: 'deviceId',
  truckId: 'truckId',
  isLock: 'isLock',
  reportedAt: 'reportedAt',
  createdBy: 'createdBy'
};

exports.Prisma.DailyRouteScalarFieldEnum = {
  id: 'id',
  truckId: 'truckId',
  routeDate: 'routeDate',
  pointCount: 'pointCount',
  generatedAt: 'generatedAt',
  createdBy: 'createdBy'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.TruckStatus = exports.$Enums.TruckStatus = {
  active: 'active',
  inactive: 'inactive',
  maintenance: 'maintenance'
};

exports.AlertType = exports.$Enums.AlertType = {
  LOW_TIRE: 'LOW_TIRE',
  SPEEDING: 'SPEEDING',
  IDLE: 'IDLE',
  GEOFENCE_IN: 'GEOFENCE_IN',
  GEOFENCE_OUT: 'GEOFENCE_OUT',
  FUEL_DROP: 'FUEL_DROP',
  HIGH_TEMP: 'HIGH_TEMP',
  DEVICE_LOST: 'DEVICE_LOST'
};

exports.Prisma.ModelName = {
  FleetGroup: 'FleetGroup',
  Truck: 'Truck',
  Device: 'Device',
  Sensor: 'Sensor',
  TruckStatusEvent: 'TruckStatusEvent',
  Geofence: 'Geofence',
  GpsPosition: 'GpsPosition',
  Trip: 'Trip',
  TirePressureEvent: 'TirePressureEvent',
  TireErrorCode: 'TireErrorCode',
  HubTemperatureEvent: 'HubTemperatureEvent',
  FuelLevelEvent: 'FuelLevelEvent',
  SpeedEvent: 'SpeedEvent',
  AlertEvent: 'AlertEvent',
  DeviceStatusEvent: 'DeviceStatusEvent',
  LockEvent: 'LockEvent',
  DailyRoute: 'DailyRoute'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
