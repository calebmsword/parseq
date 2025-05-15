import parseq from "./src/index.js";
import MockXMLHttpRequest from "./src/http-factories/http-factories-utils/xml-http-request-mock.ts";
import { get$, httpGet } from "./src/http-factories/get.ts";
import { map } from "./src/misc-factories/map.ts";
import { observe } from "./src/misc-factories/observer.ts";
import { post$ } from "./src/http-factories/post.ts";
import { thru } from "./src/misc-factories/thru.ts";
import { all } from "./src/control-flow-factories/all.ts";
import { loop } from "./src/control-flow-factories/loop.ts";
import { value } from "./src/misc-factories/value.ts";
import { assert } from "./src/control-flow-factories/assert.ts";
import { exists } from "./src/parseq-utilities/parseq-utilities-type-checking.ts";
import { repeat } from "./src/control-flow-factories/repeat.ts";
import { trycatch } from "./src/control-flow-factories/trycatch.ts";
import { Container, container } from "./src/parseq-utilities/container.ts";
import { any } from "./src/control-flow-factories/any.ts";
import { HttpValue } from "./src/http-factories/http-factories-utils/http-types.ts";
import { first } from "./src/misc-factories/first.ts";
import { Requestor } from "./src/parseq-utilities/requestor.ts";
import { last } from "./src/misc-factories/last.ts";
import { append } from "./src/misc-factories/append.ts";
import { shift } from "./src/misc-factories/shift.ts";
import { pop } from "./src/misc-factories/pop.ts";
import { prepend } from "./src/misc-factories/prepend.ts";

declare namespace globalThis {
  let XMLHttpRequest: new (...args: any[]) => any;
}

globalThis.XMLHttpRequest = MockXMLHttpRequest;

const _count = 141;

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

// let count = 0;

// type CoffeeData = {
//   [key: string]: string | unknown;
//   error?: unknown;
// };

// const daLoop = loop(
//   trycatch<any, HttpValue<CoffeeData>, Error>({
//     attempt: sequence([
//       value({ coffeeName: "frappe" }),
//       post$<CoffeeData>("https://api.sampleapis.com/coffee/hot"),
//       observe<HttpValue<CoffeeData>>(() => console.log(++count)),
//       assert<HttpValue<CoffeeData>>(
//         (response) => !exists(response?.data?.error),
//         "response.data must not describe an error",
//       ),
//     ]),
//     onFail: thru<Error>(),
//   }),
//   {
//     until(response: Error | HttpValue<CoffeeData>) {
//       return !(response instanceof Error) && exists(response?.data) &&
//         !exists(response?.data?.error);
//     },
//     maxAttempts: 3,
//     // timeLimit: 1000,
//   },
// )

type Coffee = {
  [key: string]: string | unknown;
  error?: unknown;
};

type CoffeeData = HttpValue<Coffee>;

const counter = container(0);
const increment = counter.update((count) => {
  return count + 1;
});

repeat(
  sequence([
    get$<Coffee>("https://api.sampleapis.com/coffee/hot"),
    append<[CoffeeData, number]>(increment),
    append<[CoffeeData, number, number]>(value(3)),
    observe<[CoffeeData, number, number]>(([, count, number]) => {
      console.log("count:", count);
      console.log("number:", number);
    }),
    prepend<[number, CoffeeData, number, number]>(value(-1)),
    observe<[number, CoffeeData, number, number]>(
      ([num1, coffee, num2, num3]) => {
        console.log("===pre===");
        console.log(num1);
        console.log(`${coffee.code}: ${coffee.status}`);
        console.log(num2);
        console.log(num3);
      },
    ),
    pop<[number, CoffeeData, number, number]>(),
    observe<[number, CoffeeData, number]>(
      ([num1, coffee, num2]) => {
        console.log("===pop===");
        console.log(num1);
        console.log(`${coffee.code}: ${coffee.status}`);
        console.log(num2);
      },
    ),
    pop<[number, CoffeeData, number]>(),
    observe<[number, CoffeeData]>(
      ([num1, coffee]) => {
        console.log("===pop===");
        console.log(num1);
        console.log(`${coffee.code}: ${coffee.status}`);
      },
    ),
    shift<[number, CoffeeData]>((shifted) => {
      console.log("I shifted:", shifted);
    }),
    observe<CoffeeData>((coffee) => {
      console.log("===shi===");
      console.log(`${coffee.code}: ${coffee.status}`);
    }),
    first<CoffeeData>(),
    assert<CoffeeData>(
      (response) => !exists(response?.data?.error),
      "response.data must not describe an error",
    ),
  ]),
  {
    maxAttempts: 3,
    // timeLimit: 10000,
  },
)
  .run({
    success(value) {
      console.log("success!\n", `${value.code}: ${value.status}`);
    },
    error(reason) {
      console.log("Failure!\n", reason);
    },
  });
