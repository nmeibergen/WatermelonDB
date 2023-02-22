// @flow
/* eslint-disable global-require */

import DatabaseBridge from './DatabaseBridge'
import { type ConnectionTag } from '../../../utils/common'
import { type ResultCallback } from '../../../utils/fp/Result'
import type {
  DispatcherType,
  SQLiteAdapterOptions,
  SqliteDispatcher,
  SqliteDispatcherMethod,
  SqliteDispatcherOptions,
} from '../type'



export default class SqliteOPFSDispatcher implements SqliteDispatcher {

  constructor(): void {
  }

  /**
   * @todo
   * This same call function is also called in the NodeDispatcher... DRY?
   */
  call(methodName: SqliteDispatcherMethod, args: any[], callback: ResultCallback<any>): void {
    // $FlowFixMe
    console.log(`call ${methodName}`)

    /**
     * Wonderful, because of this callback approach to the database bridge we can make
     * anything asynchronous
     */
    const method = DatabaseBridge[methodName].bind(DatabaseBridge)
    method(
      ...args,
      (value) => callback({ value }),
      (code, message, error) => callback({ error }),
    )
  }
}