const API = "http://localhost:5000";

let expenseChart;
let budgetChart;

function getUser() {
    return JSON.parse(localStorage.getItem("user"));
}

function register() {
    fetch(API + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        window.location = "index.html";
    });
}

function login() {
    fetch(API + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem("user", JSON.stringify(data.user));
            window.location = "dashboard.html";
        } else {
            alert("Invalid Login");
        }
    });
}

function addExpense() {
    const user = getUser();

    fetch(API + "/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: user.id,
            category: document.getElementById("category").value,
            amount: document.getElementById("amount").value,
            expense_date: new Date().toISOString().slice(0, 10),
            note: ""
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        document.getElementById("category").value = "";
        document.getElementById("amount").value = "";
        loadAll();
    });
}

function loadExpenses() {
    const user = getUser();

    fetch(API + "/expenses/" + user.id)
    .then(res => res.json())
    .then(data => displayExpenses(data));
}

function displayExpenses(data) {
    const list = document.getElementById("expenseList");
    list.innerHTML = "";

    if (data.length === 0) {
        list.innerHTML = "<li>No expenses found</li>";
        return;
    }

    data.forEach(exp => {
        const li = document.createElement("li");
        li.innerHTML = `${exp.category} - ₹${exp.amount} - ${exp.expense_date}`;
        list.appendChild(li);
    });
}

function filterExpenses() {
    const user = getUser();

    const category = document.getElementById("filterCategory").value.trim();
    const date = document.getElementById("filterDate").value;
    const minAmount = document.getElementById("minAmount").value;
    const maxAmount = document.getElementById("maxAmount").value;

    let params = new URLSearchParams();

    if (category) params.append("category", category);
    if (date) params.append("date", date);
    if (minAmount) params.append("minAmount", minAmount);
    if (maxAmount) params.append("maxAmount", maxAmount);

    fetch(`${API}/filter-expenses/${user.id}?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
        displayExpenses(data);
    })
    .catch(err => {
        console.log(err);
        alert("Filter Error");
    });
}

function addBudget() {
    const user = getUser();

    fetch(API + "/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: user.id,
            category: document.getElementById("budgetCategory").value,
            limit_amount: document.getElementById("budgetAmount").value,
            month: new Date().toISOString().slice(0, 7)
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        document.getElementById("budgetCategory").value = "";
        document.getElementById("budgetAmount").value = "";
        loadAll();
    });
}

function loadBudgets() {
    const user = getUser();

    fetch(API + "/budgets/" + user.id)
    .then(res => res.json())
    .then(data => {
        const list = document.getElementById("budgetList");
        list.innerHTML = "";

        data.forEach(budget => {
            const li = document.createElement("li");
            li.innerHTML = `${budget.category} Budget - ₹${budget.limit_amount} - ${budget.month}`;
            list.appendChild(li);
        });
    });
}

function addGoal() {
    const user = getUser();

    fetch(API + "/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: user.id,
            goal_name: document.getElementById("goalName").value,
            target_amount: document.getElementById("targetAmount").value,
            saved_amount: document.getElementById("savedAmount").value,
            deadline: "2026-12-31"
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        document.getElementById("goalName").value = "";
        document.getElementById("targetAmount").value = "";
        document.getElementById("savedAmount").value = "";
        loadAll();
    });
}

function loadGoals() {
    const user = getUser();

    fetch(API + "/goals/" + user.id)
    .then(res => res.json())
    .then(data => {
        const list = document.getElementById("goalList");
        list.innerHTML = "";

        data.forEach(goal => {
            let percent = Math.round((goal.saved_amount / goal.target_amount) * 100);
            if (percent > 100) percent = 100;

            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${goal.goal_name}</strong><br>
                ₹${goal.saved_amount} / ₹${goal.target_amount}
                <div class="progress-container">
                    <div class="progress-bar" style="width:${percent}%">${percent}%</div>
                </div>
            `;
            list.appendChild(li);
        });
    });
}

function loadSummary() {
    const user = getUser();

    fetch(API + "/summary/" + user.id)
    .then(res => res.json())
    .then(data => {
        document.getElementById("totalExpense").innerText = "₹" + data.totalExpense;
        document.getElementById("totalBudget").innerText = "₹" + data.totalBudget;
        document.getElementById("totalSavings").innerText = "₹" + data.totalSavings;
        document.getElementById("healthScore").innerText = data.healthScore + "/100";
    });
}

function loadChartData() {
    const user = getUser();

    fetch(API + "/chart/" + user.id)
    .then(res => res.json())
    .then(data => {
        const labels = [];
        const values = [];

        data.forEach(item => {
            labels.push(item.category);
            values.push(item.total);
        });

        if (expenseChart) expenseChart.destroy();

        expenseChart = new Chart(document.getElementById("expenseChart"), {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{ data: values }]
            }
        });

        if (budgetChart) budgetChart.destroy();

        budgetChart = new Chart(document.getElementById("budgetChart"), {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Expense Amount",
                    data: values
                }]
            }
        });
    });
}

function getSavingsAdvice() {
    const user = getUser();

    fetch(API + "/advisor/" + user.id)
    .then(res => res.json())
    .then(data => {
        document.getElementById("aiAdvice").innerHTML = `
            <h3>Total Spending: ₹${data.totalExpense}</h3>
            <p>${data.suggestion}</p>
        `;
    });
}

function addFamilyMember() {
    const user = getUser();

    fetch(API + "/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: user.id,
            member_name: document.getElementById("memberName").value,
            relation: document.getElementById("relation").value,
            email: document.getElementById("memberEmail").value,
            monthly_budget: document.getElementById("monthlyBudget").value,
            expense_limit: document.getElementById("expenseLimit").value
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);

        document.getElementById("memberName").value = "";
        document.getElementById("relation").value = "";
        document.getElementById("memberEmail").value = "";
        document.getElementById("monthlyBudget").value = "";
        document.getElementById("expenseLimit").value = "";

        loadFamilyMembers();
        loadFamilySummary();
    });
}

function loadFamilyMembers() {
    const user = getUser();

    fetch(API + "/family/" + user.id)
    .then(res => res.json())
    .then(data => {
        const list = document.getElementById("familyList");

        if (!list) return;

        list.innerHTML = "";

        data.forEach(member => {
            const li = document.createElement("li");

            li.innerHTML = `
                <strong>${member.member_name}</strong> (${member.relation})<br>
                Email: ${member.email}<br>
                Budget: ₹${member.monthly_budget}<br>
                Limit: ₹${member.expense_limit}
            `;

            list.appendChild(li);
        });
    });
}

function loadFamilySummary() {
    const user = getUser();

    fetch(API + "/family-summary/" + user.id)
    .then(res => res.json())
    .then(data => {
        if (!document.getElementById("familyMembersCount")) return;

        document.getElementById("familyMembersCount").innerText = data.totalMembers;
        document.getElementById("familyBudgetTotal").innerText = "₹" + data.totalFamilyBudget;
        document.getElementById("familyExpenseLimit").innerText = "₹" + data.totalExpenseLimit;
    });
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
}

function loadTheme() {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
}

function loadAll() {
    loadExpenses();
    loadBudgets();
    loadGoals();
    loadSummary();
    loadChartData();
    loadFamilyMembers();
    loadFamilySummary();
}

window.onload = function () {
    loadTheme();

    if (document.getElementById("expenseList")) {
        const user = getUser();

        if (!user) {
            alert("Please login first");
            window.location = "index.html";
            return;
        }

        loadAll();
    }
};