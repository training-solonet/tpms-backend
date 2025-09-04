
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  NotFoundError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime
} = require('./runtime/edge.js')


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

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.NotFoundError = NotFoundError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

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
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "C:\\Users\\LENOVO\\Desktop\\Projek_Fleeto\\prisma\\generated\\client",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      }
    ],
    "previewFeatures": [
      "postgresqlExtensions"
    ],
    "sourceFilePath": "C:\\Users\\LENOVO\\Desktop\\Projek_Fleeto\\prisma\\schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../.env"
  },
  "relativePath": "../..",
  "clientVersion": "5.22.0",
  "engineVersion": "605197351a3c8bdd595af2d2a9bc3025bca48ea2",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "// Fleet Management Prisma Schema - Matches truck_tracking.md exactly\ngenerator client {\n  provider        = \"prisma-client-js\"\n  output          = \"./generated/client\"\n  previewFeatures = [\"postgresqlExtensions\"]\n}\n\ndatasource db {\n  provider   = \"postgresql\"\n  url        = env(\"DATABASE_URL\")\n  extensions = [postgis, pgcrypto]\n}\n\n// Fleet grouping\nmodel FleetGroup {\n  id          String   @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  name        String\n  site        String?\n  description String?\n  createdAt   DateTime @default(now()) @map(\"created_at\") @db.Timestamptz(3)\n  createdBy   String?  @map(\"created_by\") @db.Uuid\n  updatedBy   String?  @map(\"updated_by\") @db.Uuid\n\n  // Relations\n  trucks Truck[]\n\n  @@map(\"fleet_group\")\n}\n\n// Main trucks entity\nmodel Truck {\n  id           String   @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  plateNumber  String   @unique @map(\"plate_number\")\n  vin          String?  @unique\n  name         String?\n  model        String?\n  year         Int?\n  tireConfig   String?  @map(\"tire_config\")\n  fleetGroupId String?  @map(\"fleet_group_id\") @db.Uuid\n  createdAt    DateTime @default(now()) @map(\"created_at\") @db.Timestamptz(3)\n  createdBy    String?  @map(\"created_by\") @db.Uuid\n  updatedBy    String?  @map(\"updated_by\") @db.Uuid\n\n  // Relations\n  fleetGroup           FleetGroup?           @relation(fields: [fleetGroupId], references: [id])\n  devices              Device[]\n  truckStatusEvents    TruckStatusEvent[]\n  gpsPositions         GpsPosition[]\n  trips                Trip[]\n  tirePressureEvents   TirePressureEvent[]\n  hubTemperatureEvents HubTemperatureEvent[]\n  fuelLevelEvents      FuelLevelEvent[]\n  speedEvents          SpeedEvent[]\n  alertEvents          AlertEvent[]\n  deviceStatusEvents   DeviceStatusEvent[]\n  lockEvents           LockEvent[]\n  dailyRoutes          DailyRoute[]\n\n  @@map(\"truck\")\n}\n\n// Device mapping\nmodel Device {\n  id          String    @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  truckId     String    @map(\"truck_id\") @db.Uuid\n  sn          String    @unique\n  simNumber   String?   @map(\"sim_number\")\n  installedAt DateTime  @default(now()) @map(\"installed_at\") @db.Timestamptz(3)\n  removedAt   DateTime? @map(\"removed_at\") @db.Timestamptz(3)\n  createdBy   String?   @map(\"created_by\") @db.Uuid\n  updatedBy   String?   @map(\"updated_by\") @db.Uuid\n\n  // Relations\n  truck                Truck                 @relation(fields: [truckId], references: [id])\n  sensors              Sensor[]\n  gpsPositions         GpsPosition[]\n  tirePressureEvents   TirePressureEvent[]\n  hubTemperatureEvents HubTemperatureEvent[]\n  deviceStatusEvents   DeviceStatusEvent[]\n  lockEvents           LockEvent[]\n\n  @@index([sn], name: \"idx_device_sn\")\n  @@map(\"device\")\n}\n\n// Sensor mapping\nmodel Sensor {\n  id          String    @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  deviceId    String    @map(\"device_id\") @db.Uuid\n  type        String // 'tire' or 'hub'\n  positionNo  Int       @map(\"position_no\")\n  sn          String?   @unique\n  installedAt DateTime? @default(now()) @map(\"installed_at\") @db.Timestamptz(3)\n  removedAt   DateTime? @map(\"removed_at\") @db.Timestamptz(3)\n  createdBy   String?   @map(\"created_by\") @db.Uuid\n  updatedBy   String?   @map(\"updated_by\") @db.Uuid\n\n  // Relations\n  device Device @relation(fields: [deviceId], references: [id])\n\n  @@map(\"sensor\")\n}\n\n// Truck status events\nmodel TruckStatusEvent {\n  id        String      @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  truckId   String      @map(\"truck_id\") @db.Uuid\n  status    TruckStatus\n  note      String?\n  changedAt DateTime    @default(now()) @map(\"changed_at\") @db.Timestamptz(3)\n  createdBy String?     @map(\"created_by\") @db.Uuid\n\n  // Relations\n  truck Truck @relation(fields: [truckId], references: [id])\n\n  @@map(\"truck_status_event\")\n}\n\n// Geofence\nmodel Geofence {\n  id        String   @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  name      String\n  // Note: area GEOGRAPHY(MULTIPOLYGON, 4326) handled with raw SQL\n  createdBy String?  @map(\"created_by\") @db.Uuid\n  createdAt DateTime @default(now()) @map(\"created_at\") @db.Timestamptz(3)\n\n  @@map(\"geofence\")\n}\n\n// GPS positions (partitioned table)\nmodel GpsPosition {\n  id         BigInt   @id @default(autoincrement())\n  deviceId   String?  @map(\"device_id\") @db.Uuid\n  truckId    String   @map(\"truck_id\") @db.Uuid\n  ts         DateTime @db.Timestamptz(3)\n  // Note: pos GEOGRAPHY(POINT, 4326) handled with raw SQL\n  speedKph   Float?   @map(\"speed_kph\") @db.Real\n  headingDeg Float?   @map(\"heading_deg\") @db.Real\n  hdop       Float?   @db.Real\n  source     String?\n\n  // Relations\n  device Device? @relation(fields: [deviceId], references: [id])\n  truck  Truck   @relation(fields: [truckId], references: [id])\n\n  @@index([truckId, ts(sort: Desc)], name: \"idx_gps_position_truck_ts\")\n  @@map(\"gps_position\")\n}\n\n// Trip summary\nmodel Trip {\n  id      String    @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  truckId String    @map(\"truck_id\") @db.Uuid\n  startTs DateTime  @map(\"start_ts\") @db.Timestamptz(3)\n  endTs   DateTime? @map(\"end_ts\") @db.Timestamptz(3)\n  // Note: startPos and endPos GEOGRAPHY(POINT,4326) handled with raw SQL\n\n  // Relations\n  truck Truck @relation(fields: [truckId], references: [id])\n\n  @@map(\"trip\")\n}\n\n// Tire pressure events\nmodel TirePressureEvent {\n  id           String   @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  deviceId     String   @map(\"device_id\") @db.Uuid\n  truckId      String   @map(\"truck_id\") @db.Uuid\n  tireNo       Int      @map(\"tire_no\")\n  pressureKpa  Float?   @map(\"pressure_kpa\") @db.Real\n  tempCelsius  Float?   @map(\"temp_celsius\") @db.Real\n  exType       String?  @map(\"ex_type\")\n  batteryLevel Int?     @map(\"battery_level\") @db.SmallInt\n  changedAt    DateTime @default(now()) @map(\"changed_at\") @db.Timestamptz(3)\n  createdBy    String?  @map(\"created_by\") @db.Uuid\n\n  // Relations\n  device Device @relation(fields: [deviceId], references: [id])\n  truck  Truck  @relation(fields: [truckId], references: [id])\n\n  @@index([truckId, changedAt(sort: Desc)], name: \"idx_tire_pressure_event_truck_ts\")\n  @@map(\"tire_pressure_event\")\n}\n\n// Tire error lookup\nmodel TireErrorCode {\n  code        Int     @id\n  description String?\n\n  @@map(\"tire_error_code\")\n}\n\n// Hub temperature\nmodel HubTemperatureEvent {\n  id           String   @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  deviceId     String   @map(\"device_id\") @db.Uuid\n  truckId      String   @map(\"truck_id\") @db.Uuid\n  hubNo        Int?     @map(\"hub_no\")\n  tempCelsius  Float?   @map(\"temp_celsius\") @db.Real\n  exType       String?  @map(\"ex_type\")\n  batteryLevel Int?     @map(\"battery_level\") @db.SmallInt\n  changedAt    DateTime @default(now()) @map(\"changed_at\") @db.Timestamptz(3)\n  createdBy    String?  @map(\"created_by\") @db.Uuid\n\n  // Relations\n  device Device @relation(fields: [deviceId], references: [id])\n  truck  Truck  @relation(fields: [truckId], references: [id])\n\n  @@index([truckId, changedAt(sort: Desc)], name: \"idx_hub_temperature_event_truck_ts\")\n  @@map(\"hub_temperature_event\")\n}\n\n// Fuel level\nmodel FuelLevelEvent {\n  id          String   @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  truckId     String   @map(\"truck_id\") @db.Uuid\n  fuelPercent Float?   @map(\"fuel_percent\") @db.Real\n  changedAt   DateTime @map(\"changed_at\") @db.Timestamptz(3)\n  source      String?\n  createdBy   String?  @map(\"created_by\") @db.Uuid\n\n  // Relations\n  truck Truck @relation(fields: [truckId], references: [id])\n\n  @@index([truckId, changedAt(sort: Desc)], name: \"idx_fuel_level_event_truck_ts\")\n  @@map(\"fuel_level_event\")\n}\n\n// Speed event\nmodel SpeedEvent {\n  id        String   @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  truckId   String   @map(\"truck_id\") @db.Uuid\n  speedKph  Float?   @map(\"speed_kph\") @db.Real\n  changedAt DateTime @map(\"changed_at\") @db.Timestamptz(3)\n  source    String?\n  createdBy String?  @map(\"created_by\") @db.Uuid\n\n  // Relations\n  truck Truck @relation(fields: [truckId], references: [id])\n\n  @@index([truckId, changedAt(sort: Desc)], name: \"idx_speed_event_truck_ts\")\n  @@map(\"speed_event\")\n}\n\n// Alerts\nmodel AlertEvent {\n  id           String    @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  truckId      String    @map(\"truck_id\") @db.Uuid\n  type         AlertType\n  severity     Int?      @db.SmallInt\n  detail       Json?     @db.JsonB\n  occurredAt   DateTime  @default(now()) @map(\"occurred_at\") @db.Timestamptz(3)\n  acknowledged Boolean   @default(false)\n  createdBy    String?   @map(\"created_by\") @db.Uuid\n\n  // Relations\n  truck Truck @relation(fields: [truckId], references: [id])\n\n  @@map(\"alert_event\")\n}\n\n// Device status (latest snapshot)\nmodel DeviceStatusEvent {\n  id           String   @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  deviceId     String   @map(\"device_id\") @db.Uuid\n  truckId      String   @map(\"truck_id\") @db.Uuid\n  hostBat      Int?     @map(\"host_bat\") @db.SmallInt\n  repeater1Bat Int?     @map(\"repeater1_bat\") @db.SmallInt\n  repeater2Bat Int?     @map(\"repeater2_bat\") @db.SmallInt\n  lockState    Int?     @map(\"lock_state\") @db.SmallInt\n  reportedAt   DateTime @default(now()) @map(\"reported_at\") @db.Timestamptz(3)\n  createdBy    String?  @map(\"created_by\") @db.Uuid\n\n  // Relations\n  device Device @relation(fields: [deviceId], references: [id])\n  truck  Truck  @relation(fields: [truckId], references: [id])\n\n  @@map(\"device_status_event\")\n}\n\n// Lock history\nmodel LockEvent {\n  id         String   @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  deviceId   String   @map(\"device_id\") @db.Uuid\n  truckId    String   @map(\"truck_id\") @db.Uuid\n  isLock     Int?     @map(\"is_lock\") @db.SmallInt\n  reportedAt DateTime @default(now()) @map(\"reported_at\") @db.Timestamptz(3)\n  createdBy  String?  @map(\"created_by\") @db.Uuid\n\n  // Relations\n  device Device @relation(fields: [deviceId], references: [id])\n  truck  Truck  @relation(fields: [truckId], references: [id])\n\n  @@map(\"lock_event\")\n}\n\n// Daily routes\nmodel DailyRoute {\n  id          String   @id @default(dbgenerated(\"gen_random_uuid()\")) @db.Uuid\n  truckId     String   @map(\"truck_id\") @db.Uuid\n  routeDate   DateTime @map(\"route_date\") @db.Date\n  // Note: geom GEOGRAPHY(LINESTRING, 4326) handled with raw SQL\n  pointCount  Int      @map(\"point_count\")\n  generatedAt DateTime @default(now()) @map(\"generated_at\") @db.Timestamptz(3)\n  createdBy   String?  @map(\"created_by\") @db.Uuid\n\n  // Relations\n  truck Truck @relation(fields: [truckId], references: [id])\n\n  @@unique([truckId, routeDate])\n  @@map(\"daily_route\")\n}\n\n// Enums\nenum TruckStatus {\n  active\n  inactive\n  maintenance\n\n  @@map(\"truck_status\")\n}\n\nenum AlertType {\n  LOW_TIRE\n  SPEEDING\n  IDLE\n  GEOFENCE_IN\n  GEOFENCE_OUT\n  FUEL_DROP\n  HIGH_TEMP\n  DEVICE_LOST\n\n  @@map(\"alert_type\")\n}\n",
  "inlineSchemaHash": "846ab87533a5069d077978987e817ded153fc7b5a21a5c515266fb355a859968",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"FleetGroup\":{\"dbName\":\"fleet_group\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"site\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedBy\",\"dbName\":\"updated_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"trucks\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"FleetGroupToTruck\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Truck\":{\"dbName\":\"truck\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"plateNumber\",\"dbName\":\"plate_number\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"vin\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"model\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"year\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tireConfig\",\"dbName\":\"tire_config\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fleetGroupId\",\"dbName\":\"fleet_group_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedBy\",\"dbName\":\"updated_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fleetGroup\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FleetGroup\",\"relationName\":\"FleetGroupToTruck\",\"relationFromFields\":[\"fleetGroupId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"devices\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Device\",\"relationName\":\"DeviceToTruck\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckStatusEvents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"TruckStatusEvent\",\"relationName\":\"TruckToTruckStatusEvent\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"gpsPositions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"GpsPosition\",\"relationName\":\"GpsPositionToTruck\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"trips\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Trip\",\"relationName\":\"TripToTruck\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tirePressureEvents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"TirePressureEvent\",\"relationName\":\"TirePressureEventToTruck\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"hubTemperatureEvents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"HubTemperatureEvent\",\"relationName\":\"HubTemperatureEventToTruck\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fuelLevelEvents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FuelLevelEvent\",\"relationName\":\"FuelLevelEventToTruck\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"speedEvents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"SpeedEvent\",\"relationName\":\"SpeedEventToTruck\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"alertEvents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AlertEvent\",\"relationName\":\"AlertEventToTruck\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deviceStatusEvents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DeviceStatusEvent\",\"relationName\":\"DeviceStatusEventToTruck\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lockEvents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"LockEvent\",\"relationName\":\"LockEventToTruck\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dailyRoutes\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DailyRoute\",\"relationName\":\"DailyRouteToTruck\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Device\":{\"dbName\":\"device\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckId\",\"dbName\":\"truck_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sn\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"simNumber\",\"dbName\":\"sim_number\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"installedAt\",\"dbName\":\"installed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"removedAt\",\"dbName\":\"removed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedBy\",\"dbName\":\"updated_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truck\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"DeviceToTruck\",\"relationFromFields\":[\"truckId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sensors\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Sensor\",\"relationName\":\"DeviceToSensor\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"gpsPositions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"GpsPosition\",\"relationName\":\"DeviceToGpsPosition\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tirePressureEvents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"TirePressureEvent\",\"relationName\":\"DeviceToTirePressureEvent\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"hubTemperatureEvents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"HubTemperatureEvent\",\"relationName\":\"DeviceToHubTemperatureEvent\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deviceStatusEvents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DeviceStatusEvent\",\"relationName\":\"DeviceToDeviceStatusEvent\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lockEvents\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"LockEvent\",\"relationName\":\"DeviceToLockEvent\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Sensor\":{\"dbName\":\"sensor\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deviceId\",\"dbName\":\"device_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"positionNo\",\"dbName\":\"position_no\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sn\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"installedAt\",\"dbName\":\"installed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"removedAt\",\"dbName\":\"removed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedBy\",\"dbName\":\"updated_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"device\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Device\",\"relationName\":\"DeviceToSensor\",\"relationFromFields\":[\"deviceId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"TruckStatusEvent\":{\"dbName\":\"truck_status_event\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckId\",\"dbName\":\"truck_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"TruckStatus\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"note\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"changedAt\",\"dbName\":\"changed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truck\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"TruckToTruckStatusEvent\",\"relationFromFields\":[\"truckId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Geofence\":{\"dbName\":\"geofence\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"GpsPosition\":{\"dbName\":\"gps_position\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BigInt\",\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deviceId\",\"dbName\":\"device_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckId\",\"dbName\":\"truck_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"ts\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"speedKph\",\"dbName\":\"speed_kph\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"headingDeg\",\"dbName\":\"heading_deg\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"hdop\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"source\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"device\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Device\",\"relationName\":\"DeviceToGpsPosition\",\"relationFromFields\":[\"deviceId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truck\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"GpsPositionToTruck\",\"relationFromFields\":[\"truckId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Trip\":{\"dbName\":\"trip\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckId\",\"dbName\":\"truck_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"startTs\",\"dbName\":\"start_ts\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"endTs\",\"dbName\":\"end_ts\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truck\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"TripToTruck\",\"relationFromFields\":[\"truckId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"TirePressureEvent\":{\"dbName\":\"tire_pressure_event\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deviceId\",\"dbName\":\"device_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckId\",\"dbName\":\"truck_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tireNo\",\"dbName\":\"tire_no\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"pressureKpa\",\"dbName\":\"pressure_kpa\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tempCelsius\",\"dbName\":\"temp_celsius\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"exType\",\"dbName\":\"ex_type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"batteryLevel\",\"dbName\":\"battery_level\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"changedAt\",\"dbName\":\"changed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"device\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Device\",\"relationName\":\"DeviceToTirePressureEvent\",\"relationFromFields\":[\"deviceId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truck\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"TirePressureEventToTruck\",\"relationFromFields\":[\"truckId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"TireErrorCode\":{\"dbName\":\"tire_error_code\",\"fields\":[{\"name\":\"code\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"HubTemperatureEvent\":{\"dbName\":\"hub_temperature_event\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deviceId\",\"dbName\":\"device_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckId\",\"dbName\":\"truck_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"hubNo\",\"dbName\":\"hub_no\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tempCelsius\",\"dbName\":\"temp_celsius\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"exType\",\"dbName\":\"ex_type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"batteryLevel\",\"dbName\":\"battery_level\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"changedAt\",\"dbName\":\"changed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"device\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Device\",\"relationName\":\"DeviceToHubTemperatureEvent\",\"relationFromFields\":[\"deviceId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truck\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"HubTemperatureEventToTruck\",\"relationFromFields\":[\"truckId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"FuelLevelEvent\":{\"dbName\":\"fuel_level_event\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckId\",\"dbName\":\"truck_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fuelPercent\",\"dbName\":\"fuel_percent\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"changedAt\",\"dbName\":\"changed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"source\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truck\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"FuelLevelEventToTruck\",\"relationFromFields\":[\"truckId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"SpeedEvent\":{\"dbName\":\"speed_event\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckId\",\"dbName\":\"truck_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"speedKph\",\"dbName\":\"speed_kph\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"changedAt\",\"dbName\":\"changed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"source\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truck\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"SpeedEventToTruck\",\"relationFromFields\":[\"truckId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"AlertEvent\":{\"dbName\":\"alert_event\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckId\",\"dbName\":\"truck_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AlertType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"severity\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"detail\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"occurredAt\",\"dbName\":\"occurred_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"acknowledged\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truck\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"AlertEventToTruck\",\"relationFromFields\":[\"truckId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"DeviceStatusEvent\":{\"dbName\":\"device_status_event\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deviceId\",\"dbName\":\"device_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckId\",\"dbName\":\"truck_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"hostBat\",\"dbName\":\"host_bat\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"repeater1Bat\",\"dbName\":\"repeater1_bat\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"repeater2Bat\",\"dbName\":\"repeater2_bat\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lockState\",\"dbName\":\"lock_state\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reportedAt\",\"dbName\":\"reported_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"device\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Device\",\"relationName\":\"DeviceToDeviceStatusEvent\",\"relationFromFields\":[\"deviceId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truck\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"DeviceStatusEventToTruck\",\"relationFromFields\":[\"truckId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"LockEvent\":{\"dbName\":\"lock_event\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deviceId\",\"dbName\":\"device_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckId\",\"dbName\":\"truck_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isLock\",\"dbName\":\"is_lock\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reportedAt\",\"dbName\":\"reported_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"device\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Device\",\"relationName\":\"DeviceToLockEvent\",\"relationFromFields\":[\"deviceId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truck\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"LockEventToTruck\",\"relationFromFields\":[\"truckId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"DailyRoute\":{\"dbName\":\"daily_route\",\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"dbgenerated\",\"args\":[\"gen_random_uuid()\"]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truckId\",\"dbName\":\"truck_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"routeDate\",\"dbName\":\"route_date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"pointCount\",\"dbName\":\"point_count\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"generatedAt\",\"dbName\":\"generated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdBy\",\"dbName\":\"created_by\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"truck\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Truck\",\"relationName\":\"DailyRouteToTruck\",\"relationFromFields\":[\"truckId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"truckId\",\"routeDate\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"truckId\",\"routeDate\"]}],\"isGenerated\":false}},\"enums\":{\"TruckStatus\":{\"values\":[{\"name\":\"active\",\"dbName\":null},{\"name\":\"inactive\",\"dbName\":null},{\"name\":\"maintenance\",\"dbName\":null}],\"dbName\":\"truck_status\"},\"AlertType\":{\"values\":[{\"name\":\"LOW_TIRE\",\"dbName\":null},{\"name\":\"SPEEDING\",\"dbName\":null},{\"name\":\"IDLE\",\"dbName\":null},{\"name\":\"GEOFENCE_IN\",\"dbName\":null},{\"name\":\"GEOFENCE_OUT\",\"dbName\":null},{\"name\":\"FUEL_DROP\",\"dbName\":null},{\"name\":\"HIGH_TEMP\",\"dbName\":null},{\"name\":\"DEVICE_LOST\",\"dbName\":null}],\"dbName\":\"alert_type\"}},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = undefined

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

