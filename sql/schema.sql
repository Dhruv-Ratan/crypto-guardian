CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  address TEXT UNIQUE,
  chain TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE tokens (
  id SERIAL PRIMARY KEY,
  symbol TEXT,
  name TEXT,
  contract_address TEXT,
  chain TEXT
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  wallet_id INT REFERENCES wallets(id),
  token_id INT REFERENCES tokens(id),
  tx_hash TEXT UNIQUE,
  amount NUMERIC,
  price_at_tx NUMERIC,
  side TEXT,
  timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
