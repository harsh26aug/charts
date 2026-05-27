import { Client } from "@elastic/elasticsearch";

const node = process.env.ELASTICSEARCH_NODE || "http://localhost:9200";
const username = process.env.ELASTICSEARCH_USERNAME;
const password = process.env.ELASTICSEARCH_PASSWORD;

const auth = username && password ? { username, password } : undefined;

export const elasticsearchClient = new Client({
  node,
  auth,
});

export const elasticsearchIndices = {
  nifty: process.env.ELASTICSEARCH_NIFTY_INDEX || "nifty_stock_history",
  sensex: process.env.ELASTICSEARCH_SENSEX_INDEX || "sensex_stock_history",
};
