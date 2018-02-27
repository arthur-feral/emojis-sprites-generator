import fs from 'fs';
import {
  reduce,
  merge,
} from 'lodash';

/**
 * format correctly categories object created by scapper
 * @param datas
 * @returns {*}
 */
export const reduceDatas = (datas) => {
  return reduce(datas, function (result, value) {
    result = merge(result, value);

    return result;
  }, {});
};

/**
 * format char unicode to something like this
 * "D83D-DC69-200D-2764-FE0F-200D-D83D-DC69"
 * @param char
 * @returns {string}
 */
export const getUnicode = (char) => {
  let i = 0, c = 0, p = 0, r = [];
  while (i < char.length) {
    c = char.charCodeAt(i++);
    if (p) {
      r.push((65536 + (p - 55296 << 10) + (c - 56320)).toString(16));
      p = 0;
    } else if (55296 <= c && c <= 56319) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join('-');
};

export const takeFromObject = (data, count) => {
  return Object.keys(data) //get the keys out
    .sort() //this will ensure consistent ordering of what you will get back. If you want something in non-aphabetical order, you will need to supply a custom sorting function
    .slice(0, count) //get the first N
    .reduce((memo, current) => { //generate a new object out of them
      memo[current] = data[current];

      return memo;
    }, {});
};


/**
 * save html file
 * @param content
 * @param path
 * @param name
 */
export const saveFile = (content, path, name) => {
  try {
    fs.accessSync(path, fs.F_OK);
  } catch (error) {
    fs.mkdirSync(path);
  }
  fs.writeFileSync(`${path}/${name}`, content);
};
