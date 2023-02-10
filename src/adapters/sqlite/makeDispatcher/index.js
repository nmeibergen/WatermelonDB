// @flow
/* eslint-disable global-require */

import SqliteNodeDispatcher from '../sqlite-node/dispatcher'
import SqliteOPFSDispatcher from '../sqlite-opfs/dispatcher'

import { type ConnectionTag } from '../../../utils/common'
import { type ResultCallback } from '../../../utils/fp/Result'
import type {
  DispatcherType,
  SQLiteAdapterOptions,
  SqliteDispatcher,
  SqliteDispatcherMethod,
  SqliteDispatcherOptions,
} from '../type'

export const makeDispatcher = (
  _type: DispatcherType,
  tag: ConnectionTag,
  _dbName: string,
  _options: SqliteDispatcherOptions,
): SqliteDispatcher => {

  if (typeof window === 'undefined') {
    // running in NodeJS
    return new SqliteNodeDispatcher(tag)
  } else {
    // running in OPFS
    return new SqliteOPFSDispatcher(tag)
  }
}

export function getDispatcherType(_options: SQLiteAdapterOptions): DispatcherType {
  return 'asynchronous'
}
