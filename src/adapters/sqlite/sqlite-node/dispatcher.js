// @flow
/* eslint-disable global-require */

import DatabaseBridge from './DatabaseBridge'
import { type ConnectionTag } from '../../../utils/common'
import { type ResultCallback } from '../../../utils/fp/Result'
import type {
  SqliteDispatcher,
  SqliteDispatcherMethod,
} from '../type'

export default class SqliteNodeDispatcher implements SqliteDispatcher {
  _tag: ConnectionTag

  constructor(tag: ConnectionTag): void {
    this._tag = tag
  }

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