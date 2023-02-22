// @flow
/* eslint-disable global-require */

import {
  type ConnectionTag
} from '../../../utils/common'
import type {
  DispatcherType,
  SQLiteAdapterOptions,
  SqliteDispatcher,
  SqliteDispatcherOptions,
} from '../type'

export const makeDispatcher = (
  _type: DispatcherType,
  tag: ConnectionTag,
  _dbName: string,
  _options: SqliteDispatcherOptions,
): SqliteDispatcher => {

  if (typeof window === 'undefined') {

    /**
     * @todo
     * Undo this commenting and find a way to make this really dynamic
     * Because now it always tries to require even if it is not needed...
     */
    // running in NodeJS
    // const SqliteNodeDispatcher = require("../sqlite-node/dispatcher.js").default
    // return new SqliteNodeDispatcher(tag)
  }

  // running in browser
  const SqliteOPFSDispatcher = require("../sqlite-opfs/dispatcher.js").default
  return new SqliteOPFSDispatcher()

}

export function getDispatcherType(_options: SQLiteAdapterOptions): DispatcherType {
  return 'asynchronous'
}