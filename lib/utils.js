'use strict';

var _ = require('lodash');
var utils = {};
var proj4 = require('proj4');

proj4.defs("GK4", "+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m");

utils.WGS84toGK4 = function WGS84toGK4(lat, lng) {
    return proj4("WGS84", "GK4", [lng, lat]).map(Math.round);
};

utils.GK4toWGS84 = function GK4toWGS84(lat, lng) {
    return proj4("GK4", "WGS84", [lng, lat]).reverse();
};

utils.stripSpaces = function stripSpaces(s) {
    return s.replace(/ /g, '');
};

//utils.isDresden = function isDresden(point) {
//    return 'Dresden' === point.ref.place;
//};

utils.convertCoordinates = function convertCoordinates(s) {
    return s.split(',').map(parseFloat).reverse();
};

utils.convertStop = function convertStop(point) {
    return {
        stop: point.name.replace('Dresden, ', ''),
        id: point.stateless,
        coords: utils.convertCoordinates(point.ref.coords)
    };
};

utils.parsePin = function parsePin(dataAsString, pinType) {
    var data = dataAsString.split('|');
    var coords = utils.GK4toWGS84(data[4], data[5]);

    if (pinType === 'platform') {
        return {
            name: data[3],
            coords: coords,
            platform_nr: data[6]
        };
    } else if (_.contains(['poi', 'rentabike', 'ticketmachine', 'carsharing', 'parkandride'], pinType)) {
        return {
            id: data[0],
            name: data[3],
            coords: coords
        };
    }

    // 'stop' id default
    return {
        id: data[0],
        name: data[3],
        coords: coords,
        connections: parseConnections(data[7])
    };
};

utils.parseMode = function parseMode(name) {
    return utils.modes[name.toLowerCase()];
}

utils.modes = {
    'tram': {
        title: "Straßenbahn",
        name: "tram",
        icon_url: "https://www.dvb.de/assets/img/trans-icon/transport-tram.svg"
    },
    'citybus': {
        title: "Stadtbus",
        name: "citybus",
        icon_url: "https://www.dvb.de/assets/img/trans-icon/transport-bus.svg"
    },
    'intercitybus': {
        title: "Regionalbus",
        name: "intercitybus",
        icon_url: "https://www.dvb.de/assets/img/trans-icon/transport-bus.svg"
    },
    'suburbanrailway': {
        title: "S-Bahn",
        name: "SuburbanRailway",
        icon_url: "https://www.dvb.de/assets/img/trans-icon/transport-metropolitan.svg"
    },
    'train': {
        title: "Zug",
        name: "train",
        icon_url: "https://www.dvb.de/assets/img/trans-icon/transport-train.svg"
    },
    'cableway': {
        title: "Seil-/Schwebebahn",
        name: "cableway",
        icon_url: "https://www.dvb.de/assets/img/trans-icon/transport-lift.svg"
    },
    'ferry': {
        title: "Fähre",
        name: "ferry",
        icon_url: "https://www.dvb.de/assets/img/trans-icon/transport-ferry.svg"
    },
    'hailedsharedtaxi': {
        title: "Anrufsammeltaxi (AST)/ Rufbus",
        name: "hailedsharedtaxi",
        icon_url: "https://www.dvb.de/assets/img/trans-icon/transport-alita.svg"
    }
};

function between(val, min, max) {
    return val >= min && val <= max;
}

function matches(val, regex) {
    var matches = val.match(regex);
    return matches != undefined && matches.length > 0;
}

function parseConnections(data) {
    if (!data) return [];

    var connections = [];

    data.split('#').forEach(function (types) {
        types = types.split(":");
        connections = connections.concat(types[1].split("~").map(function (line) {
            return {
                line: line,
                type: types[0]
            }
        }));
    });

    return connections;
}

module.exports = utils;
