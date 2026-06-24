const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("budgetpal.db", (err) => {
    if (err) {
        console.log("Database Error:", err.message);
    } else {
        console.log("Connected to BudgetPal Database");
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS expenses(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category TEXT,
            amount REAL,
            expense_date TEXT,
            note TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS budgets(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category TEXT,
            limit_amount REAL,
            month TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS savings_goals(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            goal_name TEXT,
            target_amount REAL,
            saved_amount REAL,
            deadline TEXT
        )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS family_members(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        member_name TEXT,
        relation TEXT,
        email TEXT,
        monthly_budget REAL,
        expense_limit REAL
    )
`);
});

module.exports = db;