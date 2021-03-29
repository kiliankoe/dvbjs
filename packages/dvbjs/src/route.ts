import axios, { AxiosRequestConfig } from "axios";
import { ILocation, IRoute, ITrip } from "./interfaces";
import * as utils from "./utils";

/**
 * Query the server for possible routes from one stop to another.
 * @param originID the id of the origin stop
 * @param destinationID the id of the destination stop
 * @param time starting at what time
 * @param isArrivalTime is time the arrival time
 * @param timeout the timeout of the request
 * @param viaID the id of a stop which must be served by the route
 * @returns Returns multiple possible trips, the bus-/tramlines to be taken,
 * the single stops, their arrival and departure times and their GPS coordinates.
 * The path property of a trip contains an array consisting of all the coordinates
 * describing the path of this node. This can be useful to draw the route on a map.
 */
export function route(
  originID: string,
  destinationID: string,
  time = new Date(),
  isArrivalTime = true,
  timeout = 15000,
  via?: string
): Promise<IRoute> {
  const options: AxiosRequestConfig = {
    url: "https://webapi.vvo-online.de/tr/trips",
    params: {
      format: "json",
      origin: originID,
      destination: destinationID,
      isarrivaltime: isArrivalTime,
      shorttermchanges: true,
      time: time.toISOString(),
      via: via,
    },
    timeout,
  };
  return axios(options)
    .then((response) => {
      // check status of response
      utils.checkStatus(response.data);

      let origin: ILocation | undefined;
      let destination: ILocation | undefined;
      let trips: ITrip[] = [];

      if (response.data.Routes) {
        trips = response.data.Routes.map(utils.extractTrip);

        if (trips && trips.length > 0) {
          const firstTrip = trips[0];
          if (firstTrip.departure) {
            origin = {
              id: firstTrip.departure.id,
              name: firstTrip.departure.name,
              city: firstTrip.departure.city,
              coords: firstTrip.departure.coords,
            };
          }
          if (firstTrip.arrival) {
            destination = {
              id: firstTrip.arrival.id,
              name: firstTrip.arrival.name,
              city: firstTrip.arrival.city,
              coords: firstTrip.arrival.coords,
            };
          }
        }
      }

      return {
        origin,
        destination,
        trips,
      };
    })
    .catch(utils.convertError);
}
