/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

import chai from "chai";
import "babel-polyfill";
import ChainedPromise from "../src/index";

chai.should();
var assert = chai.assert;

var nullPromise = new Promise((resolver, rejecter) => {
});

describe("ChainedPromise", function () {
  describe("forEach", function () {
    it("runs function on each value", function (done) {
      var dataCollected = [];
      var thirdPromise = Promise.resolve({
        data: 3,
        next: {
          then: (resolver) => {
            if (!resolver) {
              // Skip catch call.
              return;
            }
            dataCollected.should.eql([1, 2, 3]);
            done();
          }
        }
      });
      var secondPromise = Promise.resolve({
        data: 2,
        next: thirdPromise
      });
      var testChainedPromise = new ChainedPromise((resolver, rejecter) => {
        resolver({
          data: 1,
          next: secondPromise
        });
      });
      testChainedPromise.forEach((v) => {
        dataCollected.push(v.data);
      }).catch((err) => console.error(err.stack, err));
    });
  });
  describe("flatMap", function () {
    it("composes flat map functions", function (done) {
      let addOnePromise = function (v) {
        return Promise.resolve(Object.assign(v, {data: v.data + 1}));
      };
      let doublePromise = function (v) {
        return Promise.resolve(Object.assign(v, {data: v.data * 2}));
      };
      var dataCollected = [];
      var thirdPromise = Promise.resolve({
        data: 3,
        next: {
          then: (resolver) => {
            if (!resolver) {
              // Skip catch call.
              return;
            }
            dataCollected.should.eql([4, 6, 8]);
            done();
          }
        }
      });
      var secondPromise = Promise.resolve({
        data: 2,
        next: thirdPromise
      });
      var testChainedPromise = new ChainedPromise((resolver, rejecter) => {
        resolver({
          data: 1,
          next: secondPromise
        });
      });
      testChainedPromise.flatMap(addOnePromise).flatMap(doublePromise).forEach((v) => {
        dataCollected.push(v.data);
      }).catch((err) => console.error(err.stack, err));
    });
  });
  describe("then", function () {
    it("bypasses composition when registering reject handler only", function (done) {
      var testChainedPromise = new ChainedPromise((resolver, rejecter) => {
        resolver(1);
      });
      testChainedPromise.flatMap((v) => v * 2);
      testChainedPromise.then(undefined, console.error);
      testChainedPromise.then((v) => {
        v.should.eql(2); // i.e. flatMapped function should have been invoked only once.
        done();
      });
    });
  });
});
