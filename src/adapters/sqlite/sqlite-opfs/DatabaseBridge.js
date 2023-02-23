// @flow

import DatabaseDriver from './DatabaseDriver'


class DatabaseBridge {
  _driver: DatabaseDriver
  queue: any[] = []
  status: string

  get driver(): DatabaseDriver{
    if(!this._driver){
      this._driver = new DatabaseDriver()
    }
    return this._driver
  }

  waiting(): void {
    this.status = "waiting"
  }

  connect(): void {
    this.status = "connected"
  }

  disconnect(): void {
    this.status = "disconnected"
  }

  async initialize(
    databaseName: string,
    schemaVersion: number,
    resolve: (status: { code: string, databaseVersion?: number }) => void,
    reject: () => void,
  ): Promise<void> {
    try {
      this.waiting()
      await this.driver.initialize(databaseName, schemaVersion)
      this.connectDriver()
      resolve({ code: 'ok' })
    } catch (error) {
      if (this.driver && error.type === 'SchemaNeededError') {
        resolve({ code: 'schema_needed' })
      } else if (this.driver && error.type === 'MigrationNeededError') {
        resolve({ code: 'migrations_needed', databaseVersion: error.databaseVersion })
      } else {
        this.disconnectDriver()
        this.sendReject(reject, error, 'initialize')
      }
    }
  }

  async setUpWithSchema(
    databaseName: string,
    schema: string,
    schemaVersion: number,
    resolve: (boolean) => void,
    _reject: () => void,
  ): Promise<void> {
    this.waiting()
    await this.driver.setUpWithSchema(databaseName, schema, schemaVersion)
    this.connectDriver()
    resolve(true)
  }

  setUpWithMigrations(
    databaseName: string,
    migrations: string,
    fromVersion: number,
    toVersion: number,
    resolve: (boolean) => void,
    reject: () => void,
  ): void {
    try {
      this.waiting()
      this.driver.setUpWithMigrations(databaseName, {
        from: fromVersion,
        to: toVersion,
        sql: migrations,
      })
      this.connectDriver()
      resolve(true)
    } catch (error) {
      this.disconnectDriver()
      this.sendReject(reject, error, 'setUpWithMigrations')
    }
  }

  // MARK: - Asynchronous actions

  find(
    table: string,
    id: string,
    resolve: (any) => void,
    reject: (string) => void,
  ): void {
    this.withDriver(resolve, reject, 'find', (driver) => driver.find(table, id))
  }

  query(
    
    table: string,
    query: string,
    args: any[],
    resolve: (any) => void,
    reject: (string) => void,
  ): void {
    this.withDriver(resolve, reject, 'query', (driver) =>
      driver.cachedQuery(table, query, args),
    )
  }

  queryIds(
    
    query: string,
    args: any[],
    resolve: (any) => void,
    reject: (string) => void,
  ): void {
    this.withDriver(resolve, reject, 'queryIds', (driver) => driver.queryIds(query, args))
  }

  unsafeQueryRaw(
    
    query: string,
    args: any[],
    resolve: (any) => void,
    reject: (string) => void,
  ): void {
    this.withDriver(resolve, reject, 'unsafeQueryRaw', (driver) =>
      driver.unsafeQueryRaw(query, args),
    )
  }

  count(
    query: string,
    args: any[],
    resolve: (any) => void,
    reject: (string) => void,
  ): void {
    this.withDriver(resolve, reject, 'count', (driver) => driver.count(query, args))
  }

  batch( operations: any[], resolve: (any) => void, reject: (string) => void): void {
    this.withDriver(resolve, reject, 'batch', (driver) => driver.batch(operations))
  }

  unsafeResetDatabase(
    schema: string,
    schemaVersion: number,
    resolve: (any) => void,
    reject: (string) => void,
  ): void {
    this.withDriver(resolve, reject, 'unsafeResetDatabase', (driver) =>
      driver.unsafeResetDatabase({ version: schemaVersion, sql: schema }),
    )
  }

  getLocal( key: string, resolve: (any) => void, reject: (string) => void): void {
    this.withDriver(resolve, reject, 'getLocal', (driver) => driver.getLocal(key))
  }

  // MARK: - Helpers

  withDriver(
    resolve: (any) => void,
    reject: (any) => void,
    functionName: string,
    action: (driver: DatabaseDriver) => any,
  ): void {
    try {
      if (this.status === 'connected') {
        const result = action(this.driver)
        resolve(result)
      } else if (this.status === 'waiting') {
        this.queue.push(() => {
          this.withDriver(resolve, reject, functionName, action)
        })
      }
    } catch (error) {
      this.sendReject(reject, error, functionName)
    }
  }

  connectDriver(): void {
    this.connect()

    this.queue.forEach((operation) => operation())
    this.queue = []
  }

  disconnectDriver(): void {
    this.disconnect()
    this.queue = []

    // queue.forEach((operation) => operation())
  }

  sendReject(reject: (string, string, Error) => void, error: Error, functionName: string): void {
    if (reject) {
      reject(`db.${functionName}.error`, error.message, error)
    } else {
      throw new Error(`db.${functionName} missing reject (${error.message})`)
    }
  }
}

const databaseBridge: DatabaseBridge = new DatabaseBridge()

export default databaseBridge
