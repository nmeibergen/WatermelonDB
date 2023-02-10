// @flow
/* eslint-disable global-require */

// import DatabaseBridge from './DatabaseBridge'
import { type ConnectionTag } from '../../../utils/common'
import { type ResultCallback } from '../../../utils/fp/Result'
import type {
  DispatcherType,
  SQLiteAdapterOptions,
  SqliteDispatcher,
  SqliteDispatcherMethod,
  SqliteDispatcherOptions,
} from '../type'

// Peer dependency
import sqlite3Worker from 'bare-sqlite-opfs'

let worker;
export default class SqliteOPFSDispatcher implements SqliteDispatcher {
  _tag: ConnectionTag

  constructor(tag: ConnectionTag): void {
    this._tag = tag

    // create worker here...
    worker = sqlite3Worker();
    console.log("watermelondb > about to attach listener to worker")
    worker.addEventListener('message', async ({
    data
      }) => {
        console.log("watermelondb > received message from worker...")
        if (data === "ready") {
          request({
            f: "initialize",
            filePath: "watermelon/nm.db",
          })
        }
      }, {
        once: true
      });
    }

  /**
   * @todo
   * This same call function is also called in the NodeDispatcher... DRY?
   */
  call(methodName: SqliteDispatcherMethod, args: any[], callback: ResultCallback<any>): void {
    // $FlowFixMe
    console.log(`call ${methodName}`)
    // const method = DatabaseBridge[methodName].bind(DatabaseBridge)
    // method(
    //   this._tag,
    //   ...args,
    //   (value) => callback({ value }),
    //   (code, message, error) => callback({ error }),
    // )
  }
}

// Generic request that waits for worker response to confirm completion
function request(message) {
  worker.postMessage(message);
  return new Promise(function (resolve) {
    worker.addEventListener('message', function ({
      data
    }) {
      console.log(data)
      resolve(data);
    }, {
      once: true
    });
  });
}