import fs from 'fs';
import os from 'os';
import Throttle from 'superagent-throttle';
import when from 'when';
import { Config } from '../config';

const throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 50,          // how many requests can be sent every `ratePer`
  ratePer: 25,   // number of ms in which `rate` requests may be sent
  concurrent: 10     // how many requests can be sent concurrently
});

const BASE_URL = 'https://emojipedia.org/';
const tempPath = os.tmpdir();


let get;
/**
 *
 * @param {Config} config
 */
export const run = (config) => {

};
