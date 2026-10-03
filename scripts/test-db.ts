import "dotenv/config";

import { db } from "../db/db";

async function main() {
  const lists = await db.query.lists.findMany({
    with: {
      creator: true,
      clients: {
        with: {
          client: true,
        },
      },
    },
  });

  console.log("Relational query successful.");
  console.dir(lists, { depth: null });
}

main()
  .catch((error) => {
    console.error("Database test failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
