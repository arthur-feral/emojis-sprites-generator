'use strict';

process.env.NODE_ENV = 'test';
global._ = require('lodash');
global.sinon = require('sinon');
global.chai = require('chai');
global.expect = chai.expect;
global.assert = chai.assert;
