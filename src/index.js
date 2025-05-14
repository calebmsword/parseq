import { fallback } from "./crockford-factories/fallback.ts";
import { parallel } from "./crockford-factories/parallel.ts";
import { sequence } from "./crockford-factories/sequence.ts";
import { race } from "./crockford-factories/race.ts";
import { requestor } from "./parseq-utilities/requestor.js";

export default {
  fallback,
  parallel,
  sequence,
  race,
  requestor,
};
