const expenseList = document.getElementById("expense-list");
const currencySelect = document.getElementById("currency");
currencySelect.value ="INR";
const convertedTotal = document.getElementById("converted-total");
const totalHeading = document.getElementById("total-heading");
const expenseCategorySelect = document.getElementById("expense-category");
const otherCategoryTextArea = document.getElementById("other-category");
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let leftChart, rightChart;

//Hiding custom category input
expenseCategorySelect.addEventListener("change", function () {
    if (expenseCategorySelect.value === "Other") {
        otherCategoryTextArea.style.display = "block";
    } else {
        otherCategoryTextArea.style.display = "none";
    }
});

// Adding expenses
function addExpense() {
    const nameInput = document.getElementById("expense-name");
    const amountInput = document.getElementById("expense-amount");
    let category = expenseCategorySelect.value;

    if (category === "Other") {
        category = otherCategoryTextArea.value.trim() || "Other";
    }

    const name = nameInput.value;
    const amount = parseFloat(amountInput.value);

    if (name && amount) {
        const expense = { id: Date.now(), name, amount, category };
        expenses.push(expense);
        localStorage.setItem("expenses", JSON.stringify(expenses));
        renderExpenses();
        updateCharts(); // Update both charts
        updateConvertedTotal(); // Update the converted total amount

        // Clear all fields
        nameInput.value = "";
        amountInput.value = "";
        otherCategoryTextArea.value = "";
    }
}
async function convertCurrency() {
    const selectedCurrency = currencySelect.value;
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    if (totalAmount === 0) {
        convertedTotal.innerText = "Total: $0";
        return;
    }

    if(selectedCurrency === "INR") {
        convertedTotal.innerText = `Total: ₹${totalAmount.toFixed(2)} INR`;
        return;
    }
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/USD?apikey=bec466a1dd0c4bdc9bbd259f3dfd1b8c`);
        const data = await response.json();

        if (!data.rates || !data.rates[selectedCurrency]) {
            throw new Error("Invalid currency data received");
        }

        const rate = data.rates[selectedCurrency];
        convertedTotal.innerText = `Total: ${(totalAmount * rate).toFixed(2)} ${selectedCurrency}`;
    } catch (error) {
        console.error("Currency conversion failed", error);
        convertedTotal.innerText = "Error fetching exchange rates!";
    }
}
function updateConvertedTotal() {
    convertCurrency(); // Fetch and update currency conversion
}
// Rendering the expenses
function renderExpenses() {
    expenseList.innerHTML = "";
    if (expenses.length === 0) {
        totalHeading.style.display = "none";
    } else {
        totalHeading.style.display = "block";
    }
    expenses.forEach(exp => {
        const li = document.createElement("li");
        li.innerHTML = `${exp.name} - ₹${exp.amount} (${exp.category}) 
            <button onclick="deleteExpense(${exp.id})">X</button>`;
        expenseList.appendChild(li);
    });
}

// Delete expense
function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    renderExpenses();
    updateCharts(); // Update both charts
    updateConvertedTotal(); // Update the converted total amount
}

// Initialize left chart
function initializeLeftChart() {
    const ctx = document.getElementById("left-chart").getContext("2d");
    leftChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["No Data"],
            datasets: [{
                data: [1],
                backgroundColor: ["#d3d3d3"]
            }]
        },
        options: {
            responsive: true,
            cutout: "70%"
        }
    });
}

// Function to update both charts
function updateCharts() {
    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (leftChart) leftChart.destroy();
    if (rightChart) rightChart.destroy();

    if (labels.length === 0) {
        initializeLeftChart();
        initializeRightChart();
        return;
    }

    leftChart = new Chart(document.getElementById("left-chart"), {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: labels.map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`)
            }]
        }
    });

    rightChart = new Chart(document.getElementById("right-chart"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Expenses by Category",
                data: data,
                backgroundColor: labels.map(() => `#${Math.floor(Math.random() * 16777215).toString(16)}`)
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Initialize right chart
function initializeRightChart() {
    const ctx = document.getElementById("right-chart").getContext("2d");
    rightChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["No Data"],
            datasets: [{
                data: [1],
                backgroundColor: ["#d3d3d3"]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Initialize app
initializeLeftChart();
initializeRightChart();
renderExpenses();
updateCharts();
updateConvertedTotal();
