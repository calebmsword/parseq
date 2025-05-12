import { fallback } from "./crockford-factories/fallback.js";
import { parallel } from "./crockford-factories/parallel.js";
import { sequence } from "./crockford-factories/sequence.js";
import { race } from "./crockford-factories/race.js";
import { requestor } from "./parseq-utilities/requestor.js";

export default {
  fallback,
  parallel,
  sequence,
  race,
  requestor,
};
