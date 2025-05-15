import { fallback } from "./crockford-factories/fallback.ts";
import { parallel } from "./crockford-factories/parallel.ts";
import { sequence } from "./crockford-factories/sequence.ts";
import { raceInternal } from "./crockford-factories/crockford-factories-utils/race-internal.ts";
import { requestor } from "./parseq-utilities/requestor.ts";

export default {
  fallback,
  parallel,
  sequence,
  raceInternal,
  requestor,
};
