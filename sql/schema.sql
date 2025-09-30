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

CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  coin_id VARCHAR(100) NOT NULL,
  target_price NUMERIC NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('above', 'below')),
  triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  triggered_at TIMESTAMP
);

CREATE TABLE watchlist (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  coin_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, coin_id)
);

CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_coin_id ON watchlist(coin_id);

CREATE TABLE holdings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  coin_id VARCHAR(100) NOT NULL,
  amount NUMERIC NOT NULL,
  buy_price NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_holdings_user_id ON holdings(user_id);
CREATE INDEX idx_holdings_coin_id ON holdings(coin_id);
