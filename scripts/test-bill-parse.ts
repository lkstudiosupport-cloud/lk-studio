import { parseBillItems } from "../src/lib/bill-items";

console.log(
  "legacy:",
  parseBillItems('[{"item":"Stitching","qty":1}]', 200)
);
console.log(
  "new:",
  parseBillItems(
    '[{"id":"x","name":"magam","amount":1000},{"id":"y","name":"ass","amount":2555}]'
  )
);
