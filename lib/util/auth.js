/**
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @fileoverview An authorization trivial storage/retrieve functionality.
 */

goog.provide('shaka.util.Auth');


/**
 * @namespace shaka.util.Auth
 * @export
 * @summary An authorization trivial storage/retrieve functionality.
 */


/**
 * Store provided url for authentication.
 *
 * @param {string} url Url for authorization
 * @export
 */
shaka.util.Auth.setAuthUrl = function(url) {
  shaka.util.Auth.authUrl_ = url;
};


/**
* Store provided auth token in async manner.
* @return {Promise}
* @export
*/
shaka.util.Auth.setTokenAsync = function() {
  return new Promise(function(resolve, reject) {
    var request = new XMLHttpRequest();
    request.open('GET', shaka.util.Auth.authUrl_);
    request.onload = function() {
      if (request.status === 200) {
        var response = /** @type {!Object.<string, string>} */(
            JSON.parse(request.responseText));
        shaka.util.Auth.authToken_ = response['access_token'];
        resolve(null);
      } else {
        reject(Error('Auth header didn\'t fetch successfully; error code:' +
            request.statusText));
      }
    };
    request.onerror = function() {
      reject(Error('There was a network error.'));
    };
    request.send();
  });
};


/**
 * Store provided auth token in sync manner.
 * @export
 */
shaka.util.Auth.setToken = function() {
  var request = new XMLHttpRequest();
  request.open('GET', shaka.util.Auth.authUrl_, false);
  request.send();
  var response = /** @type {!Object.<string, string>} */(
      JSON.parse(request.responseText));
  shaka.util.Auth.authToken_ = response['access_token'];
};


/**
 * @return {string} The current auth header.
 * @export
 */
shaka.util.Auth.get_header = function() {
  return 'Bearer ' + shaka.util.Auth.authToken_;
};


/**
 * @private {string} The auth token.
 */
shaka.util.Auth.authToken_ = '';


/**
 * @private {string} The auth url.
 */
shaka.util.Auth.authUrl_ = '';

