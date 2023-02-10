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
  _tag: ConnectionTag

  constructor(tag: ConnectionTag): void {
    this._tag = tag

    // create worker here...
    console.log("Should create sqlite-opfs worker here..")
  }

  /**
   * @todo
   * This same call function is also called in the NodeDispatcher... DRY?
   */
  call(methodName: SqliteDispatcherMethod, args: any[], callback: ResultCallback<any>): void {
    // $FlowFixMe
    const method = DatabaseBridge[methodName].bind(DatabaseBridge)
    method(
      this._tag,
      ...args,
      (value) => callback({ value }),
      (code, message, error) => callback({ error }),
    )
  }
}