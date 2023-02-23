// @flow
/* eslint-disable global-require */

import DatabaseBridge from './DatabaseBridge'
import { type ResultCallback } from '../../../utils/fp/Result'
import type {
  SqliteDispatcher,
  SqliteDispatcherMethod,
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

    /**
     * Wonderful, because of this callback approach to the database bridge we can make
     * anything asynchronous
     */
    const method = DatabaseBridge[methodName].bind(DatabaseBridge)
    method(
      ...args,
      (value) => {
        console.debug(`Called ${methodName}, has result value:`)
        console.debug({value})
        callback({ value })
      },
      (code, message, error) => callback({ error }),
    )
  }
}