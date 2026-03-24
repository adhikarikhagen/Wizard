/**
 * Mock Data Generators
 */
const mockData = {
    getSalesOverview: (period) => ({
        b2b: 1200000,
        b2c: 300000,
        total: 1500000,
        trend: period === 'week' ? 12 : period === 'month' ? 45 : 120,
        historical: period === 'year' 
            ? Array.from({length: 12}, (_, i) => ({month: i, b2b: Math.random()*1200000, b2c: Math.random()*300000}))
            : Array.from({length: 7}, (_, i) => ({day: i, b2b: Math.random()*120000, b2c: Math.random()*30000}))
    }),

    getTopClients: () => [
        { name: "Ridhi Sidhi Traders", orders: 18, sales: 1250000, lastOrder: "2026-03-05" },
        { name: "ABC Mart", orders: 10, sales: 720000, lastOrder: "2026-02-15" },
        { name: "Swastik Enterprises", orders: 15, sales: 980000, lastOrder: "2026-03-10" },
        { name: "Global Distribution", orders: 25, sales: 2100000, lastOrder: "2026-03-18" },
        { name: "Metro Retail", orders: 8, sales: 450000, lastOrder: "2026-03-01" }
    ],

    getOrderPatterns: () => [
        { name: "Ridhi Sidhi Traders", avgGap: 14, lastOrder: 5 },
        { name: "ABC Mart", avgGap: 30, lastOrder: 34 },
        { name: "Swastik Enterprises", avgGap: 10, lastOrder: 10 },
        { name: "Global Distribution", avgGap: 7, lastOrder: 2 },
        { name: "Metro Retail", avgGap: 21, lastOrder: 19 }
    ],

    getProductSales: () => [
        { name: "Baby Diaper Tape Style Medium- Jumbo", qty: 3200, revenue: 800000 },
        { name: "Unijoy Oxygen Care L- Pants Diaper", qty: 1800, revenue: 450000 },
        { name: "Unijoy Oxygen Care M - Pants Diaper", qty: 2500, revenue: 600000 },
        { name: "Baby Diaper Pant Style XXL-Mini", qty: 1200, revenue: 400000 },
        { name: "Wetwipes - Jumbo", qty: 4500, revenue: 225000 },
        { name: "Sweet Dreams-XXL Jumbo", qty: 850, revenue: 310000 }
    ],

    getPDCReport: () => [
        { invoice: "INV-2026-001", client: "Ridhi Sidhi Traders", type: "PDC1", date: "2026-04-12", amount: 450000, status: "Received" },
        { invoice: "INV-2026-001", client: "Ridhi Sidhi Traders", type: "PDC2", date: "2026-05-12", amount: 450000, status: "Not Received" },
        { invoice: "INV-2026-045", client: "ABC Mart", type: "PDC1", date: "2026-04-20", amount: 320000, status: "Deposited" },
        { invoice: "INV-2026-089", client: "Global Distribution", type: "PDC1", date: "2026-04-05", amount: 130000, status: "Cleared" },
        { invoice: "INV-2026-112", client: "Metro Retail", type: "PDC1", date: "2026-05-15", amount: 550000, status: "Received" }
    ],

    getAverageOrderSize: () => [
        { name: "Distributor A", sales: 1200000, orders: 10, aov: 120000, type: "B2B" },
        { name: "Retailer B", sales: 450000, orders: 15, aov: 30000, type: "B2C" },
        { name: "Mart C", sales: 2100000, orders: 7, aov: 300000, type: "B2B" },
        { name: "Outlet D", sales: 150000, orders: 5, aov: 30000, type: "B2C" }
    ]
};

/**
 * State Management
 */
const state = {
    currentReport: 'overview',
    currentFilter: 'month',
    referenceDate: new Date()
};

/**
 * UI Components
 */
const components = {
    renderCard: (title, value, trend, manualTrendUp, currentVal, prevVal) => {
        const trendValue = typeof trend === 'number' ? trend : parseFloat(trend);
        const isPositive = manualTrendUp !== undefined ? manualTrendUp : (trendValue >= 0);
        const canExpand = currentVal !== undefined && prevVal !== undefined;
        
        return `
            <div class="glass-card ${canExpand ? 'clickable' : ''}" 
                 onclick="${canExpand ? `showTrendDetails('${title}', ${currentVal}, ${prevVal}, ${trendValue})` : ''}">
                <div class="card-title">${title} <i class="fas fa-info-circle info-icon"></i></div>
                <div class="card-value">${value}</div>
                <div class="card-trend ${isPositive ? 'trend-up' : 'trend-down'}">
                    <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i> ${Math.abs(trendValue) || 0}% vs last period
                </div>
            </div>
        `;
    },

    renderTable: (headers, rows) => `
        <div class="table-container">
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `,

    formatCurrency: (amount) => `Rs ${amount.toLocaleString()}`
};

/**
 * Report Renderers
 */
const reports = {
    overview: async () => {
        const data = await dataService.fetchSalesOverview(state.currentFilter);
        
        // Dynamic Range Label Calculation
        const getRangeLabel = () => {
            const date = state.referenceDate;
            if (state.currentFilter === 'year') return date.getFullYear().toString();
            if (state.currentFilter === 'month') return date.toLocaleString('default', { month: 'long', year: 'numeric' });
            // Week (Mon - Sun)
            const d = new Date(date);
            const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6:1);
            const first = new Date(d.setDate(diff));
            const last = new Date(d.setDate(diff + 6));
            return `${first.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${last.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}`;
        };

        const html = `
            <div class="page-header">
                <div class="page-title">
                    <h1>Sales Overview</h1>
                    <p>Total Revenue split by B2B and B2C distribution</p>
                </div>
                <div class="header-controls" style="display: flex; gap: 1rem; align-items: center;">
                    <div class="period-nav" style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); padding: 0.25rem; border-radius: 8px;">
                        <button class="nav-btn" onclick="movePeriod(-1)" style="background: none; border: none; color: white; cursor: pointer; padding: 0.5rem;"><i class="fas fa-chevron-left"></i></button>
                        <span id="range-label" style="font-size: 0.875rem; font-weight: 600; min-width: 120px; text-align: center;">${getRangeLabel()}</span>
                        <button class="nav-btn" onclick="movePeriod(1)" style="background: none; border: none; color: white; cursor: pointer; padding: 0.5rem;"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <div class="filters">
                        <button class="filter-btn ${state.currentFilter === 'week' ? 'active' : ''}" onclick="switchFilter('week')">Week</button>
                        <button class="filter-btn ${state.currentFilter === 'month' ? 'active' : ''}" onclick="switchFilter('month')">Month</button>
                        <button class="filter-btn ${state.currentFilter === 'year' ? 'active' : ''}" onclick="switchFilter('year')">Year</button>
                    </div>
                </div>
            </div>
            <div class="dashboard-grid">
                ${components.renderCard("Total Sales", components.formatCurrency(data.total), data.totalTrend, undefined, data.total, data.prevTotal)}
                ${components.renderCard("B2B Sales", components.formatCurrency(data.b2b), data.b2bTrend, undefined, data.b2b, data.prevB2B)}
                ${components.renderCard("B2C Sales", components.formatCurrency(data.b2c), data.b2cTrend, undefined, data.b2c, data.prevB2C)}
            </div>
            <div class="glass-card">
                <div class="card-title">Sales Mix (B2B vs B2C)</div>
                <div class="chart-container">
                    <canvas id="salesChart"></canvas>
                </div>
            </div>
        `;
        document.getElementById('content').innerHTML = html;
        renderSalesChart(data);
    },

    clients: async () => {
        const data = await dataService.fetchTopClients();
        const headers = ["Client Name", "Total Orders", "Total Sales", "Last Order Date", "Status"];
        const rows = data.map(c => {
            const lastDate = new Date(c.lastOrder);
            const now = new Date();
            const diff = Math.floor((now - lastDate) / (1000*60*60*24));
            const status = diff > 30 ? '<span class="badge" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">Follow-up Required</span>' : '<span class="badge badge-green">Healthy</span>';
            return [
                `<strong>${c.name}</strong>`,
                c.orders,
                components.formatCurrency(c.sales),
                c.lastOrder,
                status
            ];
        });

        const html = `
            <div class="page-header">
                <div class="page-title">
                    <h1>Top Clients</h1>
                    <p>Highest value distributors and retailers</p>
                </div>
            </div>
            <div class="dashboard-grid">
                ${components.renderCard("Top Client Revenue", components.formatCurrency(data[0].sales), 15)}
                ${components.renderCard("Active Clients", data.length, 5)}
                ${components.renderCard("Avg Orders/Client", 12, 3)}
            </div>
            ${components.renderTable(headers, rows)}
        `;
        document.getElementById('content').innerHTML = html;
    },

    patterns: async () => {
        const data = await dataService.fetchOrderPatterns();
        const headers = ["Client Name", "Avg Gap (Days)", "Last Order (Days Ago)", "Status"];
        const rows = data.map(c => {
            const diff = c.lastOrder - c.avgGap;
            const status = diff > 7 ? '<span class="badge" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">Overdue</span>' : '<span class="badge badge-green">On Schedule</span>';
            return [
                c.name,
                `${c.avgGap} days`,
                `${c.lastOrder} days ago`,
                status
            ];
        });

        const html = `
            <div class="page-header">
                <div class="page-title">
                    <h1>Order Patterns</h1>
                    <p>Analyzing client ordering frequency for proactive sales</p>
                </div>
            </div>
            <div class="dashboard-grid">
                ${components.renderCard("Avg Frequency", "18 Days", 2)}
                ${components.renderCard("Overdue Clients", 2, 5, false)}
            </div>
            ${components.renderTable(headers, rows)}
        `;
        document.getElementById('content').innerHTML = html;
    },

    products: async () => {
        const data = await dataService.fetchProductSales();
        // Add some mock stock data based on provided CSV
        const stockData = {
            "Baby Diaper Tape Style Medium- Jumbo": { stock: -72, min: 10 },
            "Unijoy Oxygen Care L- Pants Diaper": { stock: 1339, min: 20 },
            "Unijoy Oxygen Care M - Pants Diaper": { stock: 1440, min: 50 },
            "Baby Diaper Pant Style XXL-Mini": { stock: 1358, min: 250 },
            "Wetwipes - Jumbo": { stock: 1440, min: 25 },
            "Sweet Dreams-XXL Jumbo": { stock: 1392, min: 40 }
        };

        const headers = ["Product Name", "Qty Sold", "Revenue", "Stock Balance", "Status"];
        const rows = data.map(p => {
            const inv = stockData[p.name] || { stock: 0, min: 0 };
            const status = inv.stock <= inv.min 
                ? '<span class="badge" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">Restock Needed</span>' 
                : '<span class="badge badge-green">In Stock</span>';
            
            return [
                p.name,
                `${p.qty.toLocaleString()} packs`,
                components.formatCurrency(p.revenue),
                `<strong>${inv.stock}</strong>`,
                status
            ];
        });

        const html = `
            <div class="page-header">
                <div class="page-title">
                    <h1>Product Sales Report</h1>
                    <p>Performance tracking by product category with inventory monitoring</p>
                </div>
            </div>
            <div class="dashboard-grid">
                ${components.renderCard("Top Product", data[0].name, 8)}
                ${components.renderCard("Low Stock Alerts", 1, 0, false)}
            </div>
            ${components.renderTable(headers, rows)}
        `;
        document.getElementById('content').innerHTML = html;
    },

    pdc: async () => {
        const data = await dataService.fetchPDCReport();
        const headers = ["Invoice", "Client", "Cheque", "Date", "Amount", "Status"];
        
        const rows = data.map(d => {
            let statusBadge = '';
            switch(d.status) {
                case 'Cleared': statusBadge = '<span class="badge badge-green">Cleared</span>'; break;
                case 'Deposited': statusBadge = '<span class="badge badge-blue">Deposited</span>'; break;
                case 'Received': statusBadge = '<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">Received</span>'; break;
                default: statusBadge = '<span class="badge" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">Not Received</span>';
            }
            return [
                d.invoice,
                d.client,
                `<span class="badge badge-blue">${d.type}</span>`,
                d.date,
                components.formatCurrency(d.amount),
                statusBadge
            ];
        });

        // Group by month for summary
        const monthlyForecast = data.reduce((acc, curr) => {
            const month = curr.date.substring(0, 7);
            acc[month] = (acc[month] || 0) + curr.amount;
            return acc;
        }, {});

        const html = `
            <div class="page-header">
                <div class="page-title">
                    <h1>PDC Cheque Report</h1>
                    <p>Forecasting future cash flows from post-dated cheques across <strong>PDC1</strong> and <strong>PDC2</strong> fields.</p>
                </div>
            </div>
            <div class="dashboard-grid">
                ${components.renderCard("Awaiting Deposit", components.formatCurrency(1000000), 12)}
                ${components.renderCard("Pending Collection", components.formatCurrency(450000), 5, false)}
                ${components.renderCard("Cleared This Month", components.formatCurrency(130000), 8)}
            </div>
            <div style="margin-top: 1.5rem;">
                <h3 style="margin-bottom: 1rem; color: var(--text-muted); font-size: 0.875rem; text-transform: uppercase;">Upcoming Payments by Month</h3>
                <div class="dashboard-grid">
                    ${Object.entries(monthlyForecast).map(([month, amount]) => `
                        <div class="glass-card" style="padding: 1rem;">
                            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">${month}</div>
                            <div style="font-size: 1.25rem; font-weight: 700; margin-top: 0.25rem;">${components.formatCurrency(amount)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ${components.renderTable(headers, rows)}
        `;
        document.getElementById('content').innerHTML = html;
    },

    avg_order: async () => {
        const data = await dataService.fetchAverageOrderSize();
        const headers = ["Account Name", "Total Sales", "Total Orders", "Avg Order Value", "Type"];
        const rows = data.map(c => [
            c.name,
            components.formatCurrency(c.sales),
            c.orders,
            `<strong>${components.formatCurrency(c.aov)}</strong>`,
            `<span class="badge ${c.type === 'B2B' ? 'badge-blue' : 'badge-green'}">${c.type}</span>`
        ]);

        const html = `
            <div class="page-header">
                <div class="page-title">
                    <h1>Average Order Size</h1>
                    <p>Identifying high-value purchasing patterns per client</p>
                </div>
            </div>
            <div class="dashboard-grid">
                ${components.renderCard("Global Avg Order Size", components.formatCurrency(120000), 5)}
                ${components.renderCard("High Value Clients", "3", 0)}
            </div>
            ${components.renderTable(headers, rows)}
        `;
        document.getElementById('content').innerHTML = html;
    }
};

/**
 * Charting Logic
 */
let chartInstance = null;
function renderSalesChart(data) {
    const ctx = document.getElementById('salesChart')?.getContext('2d');
    if (!ctx) return;

    if (chartInstance) chartInstance.destroy();
    
    if (!data.historical || data.historical.length === 0) {
        console.warn("No historical data to render chart.");
        return;
    }

    const labels = state.currentFilter === 'year' 
        ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'B2B Sales',
                    data: data.historical.map(h => h.b2b),
                    backgroundColor: '#6366f1',
                    borderRadius: 6
                },
                {
                    label: 'B2C Sales',
                    data: data.historical.map(h => h.b2c),
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

/**
 * COQL v8 API Helper
 */
async function callCoqlV8(query) {
    console.log("Executing V8 COQL via zrc:", query);
    
    // Using the specifically requested zrc.post method for v8 COQL
    const coqlRes = await zrc.post("/crm/v8/coql", {
        select_query: query
    });
    
    console.log("zrc Response:", coqlRes);
    
    // Returning the data property of the response
    return coqlRes.data || coqlRes;
}

/**
 * Zoho CRM Data Providers (Real API Calls)
 * Use these functions to fetch live data from Zoho
 */
const dataService = {
    // 1. B2B vs B2C Sales Report
    fetchSalesOverview: async (period) => {
        const referenceDate = state.referenceDate;
        const getRanges = (date, p) => {
            let start, end;
            if (p === 'year') {
                start = `${date.getFullYear()}-01-01`;
                end = `${date.getFullYear()}-12-31`;
            } else if (p === 'month') {
                const first = new Date(date.getFullYear(), date.getMonth(), 1);
                const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                start = first.toISOString().split('T')[0];
                end = last.toISOString().split('T')[0];
            } else { // week
                const d = new Date(date);
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6:1); // Monday
                const first = new Date(d.setDate(diff));
                const last = new Date(d.setDate(diff + 6));
                start = first.toISOString().split('T')[0];
                end = last.toISOString().split('T')[0];
            }
            return { start, end };
        };

        const current = getRanges(referenceDate, period);
        let prevDate = new Date(referenceDate);
        if (period === 'year') prevDate.setFullYear(referenceDate.getFullYear() - 1);
        else if (period === 'month') prevDate.setMonth(referenceDate.getMonth() - 1);
        else prevDate.setDate(referenceDate.getDate() - 7);
        const previous = getRanges(prevDate, period);

        // Fetch detailed records for current period (chart) and group totals for prev period (trend)
        const detailedQuery = `SELECT Account_Name.Scope, Invoice_Date, Grand_Total FROM Invoices WHERE Invoice_Date >= '${current.start}' AND Invoice_Date <= '${current.end}' LIMIT 2000`;
        const prevTotalQuery = `SELECT Account_Name.Scope, SUM(Grand_Total) FROM Invoices WHERE Invoice_Date >= '${previous.start}' AND Invoice_Date <= '${previous.end}' GROUP BY Account_Name.Scope`;

        try {
            const [currRes, prevRes] = await Promise.all([
                callCoqlV8(detailedQuery),
                callCoqlV8(prevTotalQuery)
            ]);

            const records = currRes.data || [];
            const prevRecords = prevRes.data || [];

            let b2bTotal = 0, b2cTotal = 0;
            records.forEach(r => {
                const scope = r["Account_Name.Scope"];
                const amount = r.Grand_Total || 0;
                if (scope === "B2B") b2bTotal += amount;
                else if (scope === "B2C") b2cTotal += amount;
            });

            let prevB2B = 0, prevB2C = 0;
            prevRecords.forEach(r => {
                const scope = r["Account_Name.Scope"];
                const amount = r["SUM(Grand_Total)"] || 0;
                if (scope === "B2B") prevB2B = amount;
                else if (scope === "B2C") prevB2C = amount;
            });

            // Aggregate Historical Data for Chart
            const historical = [];
            if (period === 'year') {
                for (let i = 0; i < 12; i++) historical.push({ b2b: 0, b2c: 0 });
                records.forEach(r => {
                    const month = new Date(r.Invoice_Date).getMonth();
                    if (r["Account_Name.Scope"] === "B2B") historical[month].b2b += r.Grand_Total;
                    else historical[month].b2c += r.Grand_Total;
                });
            } else if (period === 'month') {
                for (let i = 0; i < 5; i++) historical.push({ b2b: 0, b2c: 0 });
                records.forEach(r => {
                    const dayNum = new Date(r.Invoice_Date).getDate();
                    const weekIdx = Math.min(Math.floor((dayNum-1) / 7), 4);
                    if (r["Account_Name.Scope"] === "B2B") historical[weekIdx].b2b += r.Grand_Total;
                    else historical[weekIdx].b2c += r.Grand_Total;
                });
            } else { // week
                for (let i = 0; i < 7; i++) historical.push({ b2b: 0, b2c: 0 });
                records.forEach(r => {
                    let dIdx = new Date(r.Invoice_Date).getDay();
                    dIdx = (dIdx === 0) ? 6 : dIdx - 1; // Mon-Sun
                    if (r["Account_Name.Scope"] === "B2B") historical[dIdx].b2b += r.Grand_Total;
                    else historical[dIdx].b2c += r.Grand_Total;
                });
            }

            const calculateTrend = (curr, prev) => {
                if (prev === 0) return curr > 0 ? 100 : 0;
                return Math.round(((curr - prev) / prev) * 100);
            };

            return {
                b2b: b2bTotal,
                b2c: b2cTotal,
                total: b2bTotal + b2cTotal,
                prevB2B: prevB2B,
                prevB2C: prevB2C,
                prevTotal: prevB2B + prevB2C,
                b2bTrend: calculateTrend(b2bTotal, prevB2B),
                b2cTrend: calculateTrend(b2cTotal, prevB2C),
                totalTrend: calculateTrend(b2bTotal + b2cTotal, prevB2B + prevB2C),
                historical: historical
            };
        } catch (error) {
            debugger;
            console.error("Aggregation Error:", error);
            return mockData.getSalesOverview(period);
        }
    },

    // 2. Top Clients Report
    fetchTopClients: async () => {
        const query = `SELECT Account_Name, SUM(Grand_Total), COUNT(Account_Name) FROM Invoices WHERE Grand_Total > 0 GROUP BY Account_Name ORDER BY Grand_Total DESC LIMIT 10`;
        
        try {
            const response = await callCoqlV8(query);
            const data = response.data || [];
            
            return data.map(item => ({
                name: (item.Account_Name && item.Account_Name.name) ? item.Account_Name.name : "Unknown Client",
                orders: item["COUNT(Account_Name)"] || 0,
                sales: item["SUM(Grand_Total)"] || 0,
                lastOrder: "N/A"
            }));
        } catch (error) {
            console.error("Top Clients Fetch Error:", error);
            return mockData.getTopClients();
        }
    },

    // 3. Order Pattern Report
    fetchOrderPatterns: async () => {
        const query = `select Account_Name, Invoice_Date from Invoices order by Invoice_Date desc`;
        // Logic will need to calculate average gap between dates in JS after fetching
        return mockData.getOrderPatterns();
    },

    // 4. Average Order Size
    fetchAverageOrderSize: async () => {
        const query = `select Account_Name, sum(Invoice_Amount), count(id) from Invoices group by Account_Name`;
        return mockData.getAverageOrderSize();
    },

    // 5. Product Sales Report
    fetchProductSales: async () => {
        const query = `select Product_Name, sum(Quantity), sum(Total) from Invoiced_Items group by Product_Name`;
        return mockData.getProductSales();
    },

    // 6. PDC Cheque Report
    fetchPDCReport: async () => {
        const query = `select Subject, PDC1_Date, PDC1_Status, PDC2_Date, PDC2_Status, Grand_Total from Invoices where PDC1_Date is not null or PDC2_Date is not null`;
        return mockData.getPDCReport();
    }
};

/**
 * Navigation
 */
async function switchReport(reportId) {
    state.currentReport = reportId;
    
    // Show Loading
    document.getElementById('content').innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 60vh;">
            <div style="text-align: center;">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--primary); margin-bottom: 1rem;"></i>
                <p>Fetching Live Data...</p>
            </div>
        </div>
    `;

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-report') === reportId) {
            link.classList.add('active');
        }
    });

    // In Live Mode, we would wait for dataService here
    // For now, it defaults to returning mock data but through the service structure
    if (reports[reportId]) {
        reports[reportId]();
    }
}

function switchFilter(filterId) {
    state.currentFilter = filterId;
    state.referenceDate = new Date(); // Reset to current day on new period type
    if (reports[state.currentReport]) {
        reports[state.currentReport]();
    }
}

function movePeriod(direction) {
    const date = state.referenceDate;
    if (state.currentFilter === 'year') {
        date.setFullYear(date.getFullYear() + direction);
    } else if (state.currentFilter === 'month') {
        date.setMonth(date.getMonth() + direction);
    } else {
        date.setDate(date.getDate() + (direction * 7));
    }
    
    state.referenceDate = new Date(date);
    if (reports[state.currentReport]) {
        reports[state.currentReport]();
    }
}

/**
 * Initialization
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initial UI is loaded by Zoho SDK's PageLoad event
});

/**
 * Refresh Current Data
 */
async function refreshData() {
    const icon = document.getElementById('refresh-icon');
    const badge = document.getElementById('status-badge');
    
    // Start Animation
    if (icon) icon.classList.add('fa-spin-once');
    if (badge) {
        badge.innerHTML = '<div style="width: 8px; height: 8px; border-radius: 50%; background: #f59e0b;"></div> Updating...';
        badge.className = 'badge';
        badge.style.background = 'rgba(245, 158, 11, 0.1)';
        badge.style.color = '#f59e0b';
    }

    // Call current report (this re-fetches from dataService)
    await switchReport(state.currentReport);

    // Stop Animation
    setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin-once');
        if (badge) {
            badge.innerHTML = '<div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></div> Live Monitoring';
            badge.className = 'badge badge-green';
            badge.style.background = ''; // reset to class default
            badge.style.color = '';
        }
    }, 1000);
}

function showTrendDetails(title, current, previous, trend) {
    const calc = previous === 0 ? "N/A (Prev was 0)" : `(Rs ${current.toLocaleString()} - Rs ${previous.toLocaleString()}) / Rs ${previous.toLocaleString()} * 100`;
    
    const modalHtml = `
        <div id="trend-modal" class="modal-overlay" onclick="closeModal()">
            <div class="modal-content glass-card" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${title} Analysis</h3>
                    <button class="close-btn" onclick="closeModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="metric-comparative">
                        <div class="m-box">
                            <span class="m-label">Current Period</span>
                            <span class="m-value">${components.formatCurrency(current)}</span>
                        </div>
                        <div class="m-box">
                            <span class="m-label">Previous Period</span>
                            <span class="m-value">${components.formatCurrency(previous)}</span>
                        </div>
                    </div>
                    <div class="math-section">
                        <h4>Calculation Logic</h4>
                        <code>${calc}</code>
                        <div class="math-result">
                            Result: <span class="trend-${trend >= 0 ? 'up':'down'}">${trend}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    setTimeout(() => document.getElementById('trend-modal').classList.add('active'), 10);
}

function closeModal() {
    const modal = document.getElementById('trend-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// For Zoho SDK (exposed to window)
window.switchReport = switchReport;
window.switchFilter = switchFilter;
window.movePeriod = movePeriod;
window.refreshData = refreshData;
window.showTrendDetails = showTrendDetails;
window.closeModal = closeModal;
