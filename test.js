import parseq from "./src/index.js";
import MockXMLHttpRequest from "./src/http-factories/http-factories-utils/xml-http-request-mock.js";
import { get$, httpGet } from "./src/http-factories/get.js";
import { map } from "./src/misc-factories/map.js";
import { observe } from "./src/misc-factories/observe.js";
import { post$ } from "./src/http-factories/post.js";
import { thru } from "./src/misc-factories/thru.js";
import { all } from "./src/control-flow-factories/all.js";
import { repeat } from "./src/control-flow-factories/repeat.js";
import { value } from "./src/misc-factories/value.js";
import { assert } from "./src/control-flow-factories/assert.js";
import { exists } from "./src/parseq-utilities/misc.js";

globalThis.XMLHttpRequest = MockXMLHttpRequest;

const _count = 140;

const { sequence } = parseq;

const getCoffeesParseq = sequence([
  all([
    thru(),
    get$("https://api.sampleapis.com/coffee/hot"),
  ]),
  map(([count, response]) => {
    const firstCoffee = response.data[0];
    return {
      id: firstCoffee.id + count,
      title: firstCoffee.title + " Premium",
      price: 1.25 * firstCoffee.price,
      description: firstCoffee.description +
        " Being the premium version, this costs extra.",
      image: firstCoffee.image,
      ingredients: firstCoffee.ingredients,
      totalSales: 0,
    };
  }),
  post$("https://api.sampleapis.com/coffee/hot"),
  observe((value) => console.log(value)),

  map((response) => ({ pathname: String(response.data.id) })),
  httpGet("https://api.sampleapis.com/coffee/hot"),
]);

const fetchGet = async (url) => {
  const res = await fetch(url);
  return await res.json();
};

const fetchPost = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return await response.json();
};

const _getCoffeesEs8 = async (count) => {
  try {
    const data = await fetchGet("https://api.sampleapis.com/coffee/hot");

    const firstCoffee = data[0];
    const premiumFirst = {
      id: firstCoffee.id + count + 1,
      title: firstCoffee.title + " Premium",
      price: 1.25 * firstCoffee.price,
      description: firstCoffee.description +
        " Being the premium version, this costs extra.",
      image: firstCoffee.image,
      ingredients: firstCoffee.ingredients,
      totalSales: 0,
    };

    const postResult = await fetchPost(
      "https://api.sampleapis.com/coffee/hot",
      premiumFirst,
    );

    console.log(postResult);

    const getData = await fetchGet(
      `https://api.sampleapis.com/coffee/hot/${postResult}`,
    );
    console.log(getData);
  } catch (error) {
    console.log("Failure!\n", error);
  }
};

// getCoffeesParseq.run({
//   message: _count,
//   success(value) {
//     console.log(`Is listener: ${this.isListener}`);
//     console.log(value);
//   },
//   error(reason) {
//     console.log("Failure!\n", reason);
//   },
// });
// getCoffeesEs8(_count);

let count = 0;

repeat(
  sequence([
    value({ coffeeName: "frappe" }),
    post$("https://api.sampleapis.com/coffee/hot"),
    observe(() => {
      console.log(++count);
    }),
    assert((response) => {
      return !exists(response?.data?.error);
    }),
  ]),
  {
    maxAttempts: 10,
    // timeLimit: 1000,
  },
).run({
  success() {
    console.log("success!");
  },
  error(reason) {
    console.log("Failure!\n", reason);
  },
});
