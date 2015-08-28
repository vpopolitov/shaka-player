/**
 * Copyright 2015 Google Inc.
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
 * @fileoverview Implements an ISegmentIndexSource that constructs a
 * SegmentIndex from a SegmentTemplate with a segment duration.
 */

goog.provide('shaka.dash.DurationSegmentIndexSource');

goog.require('shaka.asserts');
goog.require('shaka.dash.DynamicLiveSegmentIndex');
goog.require('shaka.log');
goog.require('shaka.media.ISegmentIndexSource');
goog.require('shaka.media.SegmentIndex');
goog.require('shaka.media.SegmentReference');
goog.require('shaka.util.Clock');
goog.require('shaka.util.TypedBind');



/**
 * Creates a DurationSegmentIndexSource.
 *
 * @param {!shaka.dash.mpd.Mpd} mpd
 * @param {!shaka.dash.mpd.Period} period
 * @param {!shaka.dash.mpd.Representation} representation
 * @param {number} manifestCreationTime The time, in seconds, when the manifest
 *     was created.
 * @constructor
 * @struct
 * @implements {shaka.media.ISegmentIndexSource}
 */
shaka.dash.DurationSegmentIndexSource = function(
    mpd, period, representation, manifestCreationTime) {
  shaka.asserts.assert(period.start != null);
  shaka.asserts.assert((mpd.type == 'dynamic') || (period.duration != null));
  shaka.asserts.assert(representation.segmentTemplate);
  shaka.asserts.assert(representation.segmentTemplate.timescale > 0);
  shaka.asserts.assert(representation.segmentTemplate.segmentDuration);

  /** @private {!shaka.dash.mpd.Mpd} */
  this.mpd_ = mpd;

  /** @private {!shaka.dash.mpd.Period} */
  this.period_ = period;

  /** @private {!shaka.dash.mpd.Representation} */
  this.representation_ = representation;

  /** @private {number} */
  this.manifestCreationTime_ = manifestCreationTime;

  /** @private {shaka.media.SegmentIndex} */
  this.segmentIndex_ = null;
};


/**
 * @override
 * @suppress {checkTypes} to set otherwise non-nullable types to null.
 */
shaka.dash.DurationSegmentIndexSource.prototype.destroy = function() {
  this.mpd_ = null;
  this.period_ = null;
  this.representation_ = null;

  if (this.segmentIndex_) {
    this.segmentIndex_.destroy();
    this.segmentIndex_ = null;
  }
};


/** @override */
shaka.dash.DurationSegmentIndexSource.prototype.create = function() {
  if (this.segmentIndex_) {
    return Promise.resolve(this.segmentIndex_);
  }

  if (this.mpd_.type == 'dynamic') {
    try {
      this.segmentIndex_ = new shaka.dash.DynamicLiveSegmentIndex(
          this.mpd_, this.period_, this.representation_,
          this.manifestCreationTime_);
    } catch (exception) {
      return Promise.reject(exception);
    }
  } else {
    var segmentTemplate = this.representation_.segmentTemplate;
    var scaledSegmentDuration =
        segmentTemplate.segmentDuration / segmentTemplate.timescale;
    var numSegments = Math.ceil(this.period_.duration / scaledSegmentDuration);
    var references = shaka.dash.MpdUtils.generateSegmentReferences(
        this.representation_, 1, numSegments);
    if (!references) {
      var error = new Error('Failed to generate SegmentReferences');
      error.type = 'stream';
      return Promise.reject(error);
    }
    this.segmentIndex_ = new shaka.media.SegmentIndex(references);
  }

  return Promise.resolve(this.segmentIndex_);
};

