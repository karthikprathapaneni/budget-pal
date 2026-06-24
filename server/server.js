const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./database");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../client")));

// Register
app.post("/register", (req, res) => {
    const { name, email, password } = req.body;

    db.run(
        "INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)",
        [name, email, password, "user"],
        function (err) {
            if (err) return res.status(400).json({ message: "User already exists" });
            res.json({ message: "Registration Successful" });
        }
    );
});

// Login
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.get(
        "SELECT * FROM users WHERE email=? AND password=?",
        [email, password],
        (err, row) => {
            if (row) res.json({ success: true, user: row });
            else res.json({ success: false, message: "Invalid Login" });
        }
    );
});

// Add Expense
app.post("/expense", (req, res) => {
    const { user_id, category, amount, expense_date, note } = req.body;

    db.run(
        "INSERT INTO expenses(user_id,category,amount,expense_date,note) VALUES(?,?,?,?,?)",
        [user_id, category, amount, expense_date, note || ""],
        function (err) {
            if (err) return res.status(500).json({ message: "Expense Error" });
            res.json({ message: "Expense Added" });
        }
    );
});

// Get Expenses
app.get("/expenses/:id", (req, res) => {
    db.all(
        "SELECT * FROM expenses WHERE user_id=? ORDER BY id DESC",
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Expense Fetch Error" });
            res.json(rows);
        }
    );
});

// Filter Expenses
app.get("/filter-expenses/:id", (req, res) => {
    const user_id = req.params.id;
    const { category, date, minAmount, maxAmount } = req.query;

    let query = "SELECT * FROM expenses WHERE user_id=?";
    let params = [user_id];

    if (category && category.trim() !== "") {
        query += " AND LOWER(category) LIKE LOWER(?)";
        params.push("%" + category.trim() + "%");
    }

    if (date && date.trim() !== "") {
        query += " AND expense_date=?";
        params.push(date);
    }

    if (minAmount && minAmount.trim() !== "") {
        query += " AND amount >= ?";
        params.push(Number(minAmount));
    }

    if (maxAmount && maxAmount.trim() !== "") {
        query += " AND amount <= ?";
        params.push(Number(maxAmount));
    }

    query += " ORDER BY id DESC";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: "Filter Error" });
        res.json(rows);
    });
});

// Add Budget
app.post("/budget", (req, res) => {
    const { user_id, category, limit_amount, month } = req.body;

    db.run(
        "INSERT INTO budgets(user_id,category,limit_amount,month) VALUES(?,?,?,?)",
        [user_id, category, limit_amount, month],
        function (err) {
            if (err) return res.status(500).json({ message: "Budget Error" });
            res.json({ message: "Budget Added" });
        }
    );
});

// Get Budgets
app.get("/budgets/:id", (req, res) => {
    db.all(
        "SELECT * FROM budgets WHERE user_id=? ORDER BY id DESC",
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Budget Fetch Error" });
            res.json(rows);
        }
    );
});

// Add Goal
app.post("/goal", (req, res) => {
    const { user_id, goal_name, target_amount, saved_amount, deadline } = req.body;

    db.run(
        "INSERT INTO savings_goals(user_id,goal_name,target_amount,saved_amount,deadline) VALUES(?,?,?,?,?)",
        [user_id, goal_name, target_amount, saved_amount, deadline],
        function (err) {
            if (err) return res.status(500).json({ message: "Goal Error" });
            res.json({ message: "Savings Goal Added" });
        }
    );
});

// Get Goals
app.get("/goals/:id", (req, res) => {
    db.all(
        "SELECT * FROM savings_goals WHERE user_id=? ORDER BY id DESC",
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Goal Fetch Error" });
            res.json(rows);
        }
    );
});

// Summary
app.get("/summary/:id", (req, res) => {
    const user_id = req.params.id;

    db.get("SELECT SUM(amount) AS totalExpense FROM expenses WHERE user_id=?", [user_id], (err, expenseRow) => {
        db.get("SELECT SUM(limit_amount) AS totalBudget FROM budgets WHERE user_id=?", [user_id], (err, budgetRow) => {
            db.get("SELECT SUM(saved_amount) AS totalSavings FROM savings_goals WHERE user_id=?", [user_id], (err, savingRow) => {
                const totalExpense = expenseRow.totalExpense || 0;
                const totalBudget = budgetRow.totalBudget || 0;
                const totalSavings = savingRow.totalSavings || 0;

                let healthScore = 50;
                if (totalBudget > 0 && totalExpense <= totalBudget) healthScore += 25;
                if (totalSavings > 0) healthScore += 25;
                if (healthScore > 100) healthScore = 100;

                res.json({ totalExpense, totalBudget, totalSavings, healthScore });
            });
        });
    });
});

// Chart Data
app.get("/chart/:id", (req, res) => {
    db.all(
        `SELECT category, SUM(amount) AS total
         FROM expenses
         WHERE user_id=?
         GROUP BY category`,
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Chart Error" });
            res.json(rows);
        }
    );
});

// AI Advisor
app.get("/advisor/:id", (req, res) => {
    db.get(
        "SELECT SUM(amount) AS totalExpense FROM expenses WHERE user_id=?",
        [req.params.id],
        (err, row) => {
            if (err) return res.status(500).json({ message: "Advisor Error" });

            const total = row.totalExpense || 0;
            let suggestion = "";

            if (total > 20000) {
                suggestion = "High spending detected. Reduce food delivery, shopping, and entertainment expenses by 15%.";
            } else if (total > 10000) {
                suggestion = "Moderate spending detected. You can save approximately 10% every month.";
            } else {
                suggestion = "Excellent spending habits. Continue your current saving strategy.";
            }

            res.json({ totalExpense: total, suggestion });
        }
    );
});

// Family Member
app.post("/family", (req, res) => {
    const { user_id, member_name, relation, email, monthly_budget, expense_limit } = req.body;

    db.run(
        `INSERT INTO family_members
        (user_id, member_name, relation, email, monthly_budget, expense_limit)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, member_name, relation, email, monthly_budget, expense_limit],
        function (err) {
            if (err) return res.status(500).json({ message: "Family Member Error" });
            res.json({ message: "Family Member Added" });
        }
    );
});

// Get Family
app.get("/family/:id", (req, res) => {
    db.all(
        "SELECT * FROM family_members WHERE user_id=? ORDER BY id DESC",
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Family Fetch Error" });
            res.json(rows);
        }
    );
});

// Family Summary
app.get("/family-summary/:id", (req, res) => {
    db.get(
        `SELECT 
        SUM(monthly_budget) AS totalFamilyBudget,
        SUM(expense_limit) AS totalExpenseLimit,
        COUNT(*) AS totalMembers
        FROM family_members
        WHERE user_id=?`,
        [req.params.id],
        (err, row) => {
            if (err) return res.status(500).json({ message: "Family Summary Error" });

            res.json({
                totalFamilyBudget: row.totalFamilyBudget || 0,
                totalExpenseLimit: row.totalExpenseLimit || 0,
                totalMembers: row.totalMembers || 0
            });
        }
    );
});

// Admin Summary
app.get("/admin/full-summary", (req, res) => {
    db.get("SELECT COUNT(*) AS totalUsers FROM users", [], (err, users) => {
        db.get("SELECT SUM(amount) AS totalExpenses FROM expenses", [], (err, expenses) => {
            db.get("SELECT COUNT(*) AS totalGoals FROM savings_goals", [], (err, goals) => {
                db.get(
                    `SELECT category, SUM(amount) AS total
                     FROM expenses
                     GROUP BY category
                     ORDER BY total DESC
                     LIMIT 1`,
                    [],
                    (err, topCategory) => {
                        res.json({
                            totalUsers: users.totalUsers || 0,
                            totalExpenses: expenses.totalExpenses || 0,
                            totalGoals: goals.totalGoals || 0,
                            topCategory: topCategory ? topCategory.category : "No Data",
                            topCategoryAmount: topCategory ? topCategory.total : 0
                        });
                    }
                );
            });
        });
    });
});

app.get("/admin/recent-expenses", (req, res) => {
    db.all(
        `SELECT users.name, expenses.category, expenses.amount, expenses.expense_date
         FROM expenses
         JOIN users ON users.id = expenses.user_id
         ORDER BY expenses.id DESC
         LIMIT 10`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Admin Expense Error" });
            res.json(rows);
        }
    );
});
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

app.listen(5000, "0.0.0.0", () => {
    console.log("Server Running on Port 5000");
});
