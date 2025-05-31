import parseq from "./src/index.js";
import MockXMLHttpRequest from "./src/http-factories/http-factories-utils/xml-http-request-mock.ts";
import { httpGet, mapToHttpGet } from "./src/http-factories/get.ts";
import { map } from "./src/misc-factories/map.ts";
import { observe } from "./src/misc-factories/observe.ts";
import { httpPost } from "./src/http-factories/post.ts";
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
import { last } from "./src/misc-factories/last.ts";
import { append } from "./src/misc-factories/append.ts";
import { shift } from "./src/misc-factories/shift.ts";
import { pop } from "./src/misc-factories/pop.ts";
import { prepend } from "./src/misc-factories/prepend.ts";
import { pair } from "./src/misc-factories/pair.ts";
import { requestor } from "./src/parseq-utilities/requestor.ts";

declare namespace globalThis {
  let XMLHttpRequest: new (...args: any[]) => any;
}

globalThis.XMLHttpRequest = MockXMLHttpRequest;

const _count = 141;

const { sequence } = parseq;

// const getCoffeesParseq = sequence([
//   all([
//     thru(),
//     httpGet("https://api.sampleapis.com/coffee/hot"),
//   ]),
//   map(([count, response]) => {
//     const firstCoffee = response.data[0];
//     return {
//       id: firstCoffee.id + count,
//       title: firstCoffee.title + " Premium",
//       price: 1.25 * firstCoffee.price,
//       description: firstCoffee.description +
//         " Being the premium version, this costs extra.",
//       image: firstCoffee.image,
//       ingredients: firstCoffee.ingredients,
//       totalSales: 0,
//     };
//   }),
//   httpPost("https://api.sampleapis.com/coffee/hot"),
//   observe((value) => console.log(value)),

//   map((response) => ({ pathname: String(response.data.id) })),
//   mapToHttpGet("https://api.sampleapis.com/coffee/hot"),
// ]);

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

type Coffee = { title: string }[];

const counter = container(0);

repeat(
  sequence([
    httpGet<Coffee>("https://api.sampleapis.com/coffee/hot"),
    pair<Coffee, number>(counter.update((count) => {
      return count + 1;
    })),
    append<[Coffee, number, number]>(value(3)),
    observe<[Coffee, number, number]>(([, count, number]) => {
      console.log("count:", count);
      console.log("number:", number);
    }),
    prepend<[number, Coffee, number, number]>(value(-1)),
    observe<[number, Coffee, number, number]>(
      ([num1, coffee, num2, num3]) => {
        console.log("===pre===");
        console.log(num1);
        console.log(coffee[0].title);
        console.log(num2);
        console.log(num3);
      },
    ),
    pop<[number, Coffee, number, number]>(),
    observe<[number, Coffee, number]>(
      ([num1, coffee, num2]) => {
        console.log("===pop===");
        console.log(num1);
        console.log(coffee[0].title);
        console.log(num2);
      },
    ),
    pop<[number, Coffee, number]>(),
    observe<[number, Coffee]>(
      ([num1, coffee]) => {
        console.log("===pop===");
        console.log(num1);
        console.log(coffee[0].title);
      },
    ),
    shift<[number, Coffee]>((shifted) => {
      console.log("I shifted:", shifted);
    }),
    observe<[Coffee]>(([coffee]) => {
      console.log("===shi===");
      console.log(coffee[0].title);
    }),
    first<Coffee>(),
    assert<Coffee>(
      (coffee) => !exists((coffee as any).error),
      "response.data must not describe an error",
    ),
    pop<Coffee>(),
    // requestor((pass, _fail, message) => {
    //   setTimeout(() => {
    //     pass(message);
    //     return;
    //   }, 0);
    // })
  ]),
  {
    maxAttempts: 3,
    // timeLimit: 10000,
  },
).run({
  success(value) {
    console.log("success!\n", (value || [])[0]);
  },
  failure(reason) {
    console.log("Failure!\n", reason);
  },
});
