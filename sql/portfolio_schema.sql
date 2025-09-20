CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coin_id VARCHAR(50) NOT NULL,  
    amount NUMERIC NOT NULL,       
    buy_price NUMERIC NOT NULL,    
    created_at TIMESTAMP DEFAULT NOW()
);
