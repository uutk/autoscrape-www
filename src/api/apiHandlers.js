import { call, put, fork, takeLatest, takeEvery, all } from 'redux-saga/effects';
import objectAssignDeep from "object-assign-deep";
import * as api from 'api/requests';

const watchers = [];

/**
 * Builds a handler for an API request, given a function and base
 * action name. This is a top-level internal API for managing
 * our API requests and getting their results to record in our
 * redux store and then pass it down to the components through
 * our state tree (handled in src/state/store.js).
 *
 * It can be initiated on the _REQUESTED call.
 *
 * Adds action handlers for the following states:
 * _PENDING, _SUCCESSFUL, _FAILED
 *
 * (In the above notation, base is prefixed to the action type.)
 *
 * The _SUCCESSFUL response returns the action:
 *
 * { type: _SUCCESSFUL, data: { API response body } }
 *
 * The _FAILED response emits the action:
 *
 * { type: _FAILED, error: { API error } }
 *
 * The _PENDING action doesn't have a payload and is
 * simply meant to drive a loading message, etc.
 */
const mkHandler = (fn, base, latest=true) => {
  function* handler(action) {
    // dispatch a pending action for loading indication
    yield put({type: `${base}_PENDING`});
    try {
      // don't directly invoke the function here, pass the instruction to
      // middleware so we can test this in isolation
      const data = yield call(fn, action.payload);
      yield put({type: `${base}_SUCCESSFUL`, payload: data });
    } catch (error) {
      const errorData = error.response ? error.response.data : {};
      // use objectAssignDeep here because we want a two-way merge (meaning
      // if the second object tries to assign {} for a key and the first
      // one has this: {a: 1}, the result will be {a: 1} instead of {}
      // as Object.assign would do it.
      const errorPayload = objectAssignDeep({}, errorData, {
        statusCode: error.response ? error.response.status : null,
      });
      yield put({
        type: `${base}_FAILED`,
        payload: errorPayload,
      });
    }
  }

  // cancel any pending requests if concurrent requested
  // in the future, if we need to handle concurrent multiple
  // requests on the same resource we can toggle this and
  // use watchEvery instead
  function* watchHandler() {
    let takeFn = takeLatest;
    if (!latest) {
      takeFn = takeEvery;
    }
    yield takeFn(`${base}_REQUESTED`, handler);
  }
  // push the watcher to the stack for fork initialization
  watchers.push(fork(watchHandler));
  // return the handler for testing
  return handler;
};

export const startScrape = mkHandler(api.startScrape, "START_SCRAPE");
export const stopScrape = mkHandler(api.stopScrape, "STOP_SCRAPE");
export const pollProgress = mkHandler(api.pollProgress, "POLL_PROGRESS");
export const fetchFile = mkHandler(api.fetchFile, "FETCH_FILE");
export const fetchFilesList = mkHandler(api.fetchFilesList, "FETCH_FILES_LIST");

export default function* root() {
  yield all(watchers)
}