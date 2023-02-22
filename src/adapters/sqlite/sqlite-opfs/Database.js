// @flow
const bareSqliteOPFS = require('bare-sqlite-opfs').default

type SQLiteDatabaseType = any

class Database {
  sqlite3
  instance: $FlowFixMe <SQLiteDatabaseType> = undefined

  path: string

  static async init(path: string): Promise <Database> {
    const database = new Database(path)

    // initializes the 'environment', the worker...
    database.sqlite3 = await bareSqliteOPFS()
    await database.open() 

    return database
  }

  // Dont use this to initialize from outside, requires private tag
  constructor(path: string = "unknown"): void {
    this.path = path
  }

  async open(): Promise <void> {
    let {
      path
    } = this

    try {
      // eslint-disable-next-line no-console
      this.instance = await this.sqlite3.initializeDB(path)
    } catch (error) {
      throw new Error(`Failed to open the database. - ${error.message}`)
    }

    if (!this.instance) {
      throw new Error('Failed to open the database.')
    }
  }

  /**
   * For the current definition of transaction, it is not at all helpful to define transaction
   * Simply because transaction has an idiosyncratic syntax.
   * 
   * @param {*} executeBlock 
   */
  // inTransaction(executeBlock: () => void): void {
  //   this.instance.transaction(executeBlock)()
  // }

  /**
   * Transaction specific methods
   */
  async executeAndSetUserVersion(sql, version): Promise<void> {
    return this.instance.transaction((db, args) => {
      db.exec(args.sql)
      db.pragma(`user_version = ${args.version}`)
    }, {
      sql,
      version,
    })
  }

  async batch(operations): Promise<[number[], number[]]> {

    const result = await this.instance.transaction((db) => {
      const newIds = []
      const removedIds = []
      operations.forEach((operation: any[]) => {
        const [cacheBehavior, table, sql, argBatches] = operation
        argBatches.forEach((args) => {
          db.exec(sql)
          if (cacheBehavior === 1) {
            newIds.push([table, args[0]])
          } else if (cacheBehavior === -1) {
            removedIds.push([table, args[0]])
          }
        })
      })

      return [newIds, removedIds]
    }, {operations})

    return result
  }

  async execute(query: string, args: any[] = []): Promise<any> {
    const stmt = await this.instance.prepare(query)
    await stmt.bind(args)
    return stmt.all()

    // return await this.instance.prepare(query).run(args)
  }

  async executeStatements(queries: string): Promise<any> {
    return this.instance.exec(queries)
  }

  async queryRaw(query: string, args: any[] = []): Promise<any | any[]> {
    const stmt = await this.instance.prepare(query)
    await stmt.bind(args)
    return stmt.all() || []
  }

  async count(query: string, args: any[] = []): Promise<number> {
    const stmt = await this.instance.prepare(query)
    const results = await stmt.all()

    if (results.length === 0) {
      throw new Error('Invalid count query, can`t find next() on the result')
    }

    const result = results[0]

    if (result.count === undefined) {
      throw new Error('Invalid count query, can`t find `count` column')
    }

    return Number.parseInt(result.count, 10)
  }

  get userVersion(): Promise<number> {
    return new Promise(resolve => {
      this.instance.pragma('user_version').then(res => {
        resolve(res)
      })
    })
  }

  async setUserVersion(version: number): Promise<void> {
    this.instance.pragma(`user_version = ${version}`)
  }

  async unsafeDestroyEverything(): Promise<void> {
    await this.sqlite3.clear()
    this.instance = await this.sqlite3.initializeDB(this.path)

    /**
     * @todo
     * This is a todo also for the bare-sqlite-opfs package: 
     * Allow to delete only 1 database. Now the clear function deletes everything in OPFS which might not
     * be what we want if there are multiple accounts logged in.
     */
  }
}

export default Database