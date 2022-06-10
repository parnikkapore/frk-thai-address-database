'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

(function (angular) {
  'use strict';

  var utilAddress = require('./util/splitAddress');
  /**
   * From jquery.Thailand.js line 38 - 100
   */
  var preprocess = function preprocess(data) {
    var lookup = [];
    var words = [];
    var expanded = [];
    var useLookup = false;
    var t = void 0;

    if (data.lookup && data.words) {
      // compact with dictionary and lookup
      useLookup = true;
      lookup = data.lookup.split('|');
      words = data.words.split('|');
      data = data.data;
    }

    t = function t(text) {
      function repl(m) {
        var ch = m.charCodeAt(0);
        return words[ch < 97 ? ch - 65 : 26 + ch - 97];
      }
      if (!useLookup) {
        return text;
      }
      if (typeof text === 'number') {
        text = lookup[text];
      }
      return text.replace(/[A-Z]/ig, repl);
    };

    if (!data[0].length) {
      // non-compacted database
      return data;
    }
    // decompacted database in hierarchical form of:
    // [["province",[["amphur",[["district",["zip"...]]...]]...]]...]
    data.map(function (provinces) {
      var i = 1;
      if (provinces.length === 3) {
        // geographic database
        i = 2;
      }

      provinces[i].map(function (amphoes) {
        amphoes[i].map(function (districts) {
          districts[i] = districts[i] instanceof Array ? districts[i] : [districts[i]];
          districts[i].map(function (zipcode) {
            var entry = {
              district: t(districts[0]),
              amphoe: t(amphoes[0]),
              province: t(provinces[0]),
              zipcode: zipcode
            };
            if (i === 2) {
              // geographic database
              entry.district_code = districts[1] || false;
              entry.amphoe_code = amphoes[1] || false;
              entry.province_code = provinces[1] || false;
            }
            expanded.push(entry);
          });
        });
      });
    });
    return expanded;
  };

  var db = preprocess(require('../database/db.json'));

  function resolveResultbyObject(query) {
    var maxResult = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 20;

    var possibilities = [];
    try {
      possibilities = db.filter(function (item) {
        return !Object.entries(query).some(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              type = _ref2[0],
              _partial = _ref2[1];

          var partial = _partial.toString().trim();
          if (partial === '') {
            return true;
          }
          var partialRegex = new RegExp(partial, 'g');
          return !(item[type] || '').toString().match(partialRegex);
        });
      }).slice(0, maxResult);
    } catch (e) {
      return [];
    }

    return possibilities;
  };

  function resolveResultbyField(type, searchStr) {
    var maxResult = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 20;

    var query = {};
    query[type] = searchStr;
    return resolveResultbyObject(query, maxResult);
  }

  var searchAddressByDistrict = function searchAddressByDistrict(searchStr, maxResult) {
    return resolveResultbyField('district', searchStr, maxResult);
  };
  var searchAddressByAmphoe = function searchAddressByAmphoe(searchStr, maxResult) {
    return resolveResultbyField('amphoe', searchStr, maxResult);
  };
  var searchAddressByProvince = function searchAddressByProvince(searchStr, maxResult) {
    return resolveResultbyField('province', searchStr, maxResult);
  };
  var searchAddressByZipcode = function searchAddressByZipcode(searchStr, maxResult) {
    return resolveResultbyField('zipcode', searchStr, maxResult);
  };

  var splitAddress = function splitAddress(fullAddress) {
    var regex = /\s(\d{5})(\s|$)/gi;
    var regexResult = regex.exec(fullAddress);
    if (!regexResult) {
      return null;
    }
    var zip = regexResult[1];
    var address = utilAddress.prepareAddress(fullAddress, zip);
    var result = utilAddress.getBestResult(zip, address);
    if (result) {
      var newAddress = utilAddress.cleanupAddress(address, result);
      return {
        address: newAddress,
        district: result.district,
        amphoe: result.amphoe,
        province: result.province,
        zipcode: zip
      };
    }
    return null;
  };

  exports.searchAddressByObject = resolveResultbyObject;
  exports.searchAddressByDistrict = searchAddressByDistrict;
  exports.searchAddressByAmphoe = searchAddressByAmphoe;
  exports.searchAddressByProvince = searchAddressByProvince;
  exports.searchAddressByZipcode = searchAddressByZipcode;
  exports.splitAddress = splitAddress;

  if (angular) {
    angular.module('thAddress', []).config(function ($provide) {
      $provide.value('thad', {
        searchAddressByObject: resolveResultbyObject,
        searchAddressByDistrict: searchAddressByDistrict,
        searchAddressByAmphoe: searchAddressByAmphoe,
        searchAddressByProvince: searchAddressByProvince,
        searchAddressByZipcode: searchAddressByZipcode,
        splitAddress: splitAddress
      });
    });
  }
})(typeof angular !== 'undefined' ? angular : false);