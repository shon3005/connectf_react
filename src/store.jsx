/**
 * @author zacharyjuang
 * 7/26/18
 */
import {applyMiddleware, compose, createStore} from 'redux';
import thunk from 'redux-thunk';
import $ from 'jquery';
import _ from 'lodash';

import reducers from './reducers';
import {loadState, saveState} from "./local_storage";
import {BASE_URL, clearRequestId, setBusy, setResult} from "./actions";

/*
 * Enhancer composer for development. Connects to redux browser extension.
 */
const composeEnhancers = process.env.NODE_ENV !== 'production' &&
typeof window === 'object' &&
window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;

const persistedState = loadState();

const store = createStore(
  reducers,
  persistedState,
  composeEnhancers(
    applyMiddleware(
      thunk
    )
  )
);

store.subscribe(_.throttle(function () {
  saveState(_.pick(store.getState(), [
    'query',
    'queryTree',
    'requestId',
    'edges',
    'queryHistory'
  ]));
}, 1000));

store.dispatch(function (dispatch) {
  let state = store.getState();

  if (state.requestId && _.isEmpty(state.result)) {
    dispatch(setBusy(true));
    $.ajax(`${BASE_URL}/queryapp/${state.requestId}/`)
      .always((data, textStatus) => {
        if (state.requestId === store.getState().requestId) {
          if (textStatus === 'success') {
            dispatch(setResult(data));
          } else {
            dispatch(clearRequestId());
          }
        }
        dispatch(setBusy(false));
      });
  }
});

export default store;
