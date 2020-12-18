import axios, { AxiosRequestConfig } from "axios";
import { IAddress, IPoint } from "./interfaces";
import * as utils from "./utils";

async function pointFinder(
  name: string,
  stopsOnly: boolean,
  assignedStops: boolean,
  timeout: number
): Promise<IPoint[]> {
  if (typeof name !== "string") {
    throw utils.constructError("ValidationError", "query has to be a string");
  }

  const stopName = name.trim();

  const options: AxiosRequestConfig = {
    url: "https://webapi.vvo-online.de/tr/pointfinder",
    params: {
      format: "json",
      stopsOnly,
      assignedStops,
      limit: 0,
      query: stopName,
      dvb: true,
    },
    timeout,
  };

  return axios(options)
    .then((response) => {
      // check status of response
      utils.checkStatus(response.data);

      const result: IPoint[] = [];
      if (response.data.Points) {
        response.data.Points.forEach((p: string) => {
          const poi = p.split("|");

          const coords = utils.WmOrGK4toWGS84(poi[5], poi[4]);
          const pointName = poi[3].replace(/'/g, "");

          if (pointName && coords) {
            const city = poi[2] === "" ? "Dresden" : poi[2];
            const { id, type } = utils.parsePoiID(poi[0]);

            result.push({
              city,
              coords,
              name: pointName,
              id,
              type,
            });
          }
        });
      }

      return result;
    })
    .catch(utils.convertError);
}

/**
 * Search for a single stop in the network of the DVB.
 * @param searchString the name of the stop
 * @param timeout the timeout of the request
 * @returns an array of all possible hits including their GPS coordinates.
 */
export function findStop(
  searchString: string,
  timeout = 5000
): Promise<IPoint[]> {
  return pointFinder(searchString, true, false, timeout);
}

/**
 * Search for POI in the network of the DVB.
 * @param searchString the name of the stop
 * @param timeout the timeout of the request
 * @returns an array of all possible hits including their GPS coordinates.
 */
export function findPOI(
  searchString: string,
  timeout = 5000
): Promise<IPoint[]> {
  return pointFinder(searchString, false, false, timeout);
}

/**
 * Search for nearby stops assigned to an address in the network of the DVB.
 * @param searchString the lookup address
 * @returns an array of all possible hits including their GPS coordinates.
 */
export async function findNearbyStops(searchString: string): Promise<IPoint[]> {
  const aPoints = await pointFinder(searchString, false, true);
  return aPoints.filter((oPoint) => oPoint.type === "Stop");
}

/**
 * Lookup address and nearby stops by coordinate.
 * @param lng longitude of the coordinate
 * @param lat latitude of the coordinate
 * @param timeout the timeout of the request
 * @returns the adress and neaby stops
 */
export function findAddress(
  lng: number,
  lat: number,
  timeout = 5000
): Promise<IAddress | undefined> {
  const gk4 = utils.WGS84toGK4(lng, lat);

  return pointFinder(`coord:${gk4[0]}:${gk4[1]}`, false, true, timeout).then(
    (points) => {
      if (points.length === 0) {
        return undefined;
      }

      const address: IAddress = {
        ...points[0],
        stops: points.slice(1) || [],
      };

      return address;
    }
  );
}
