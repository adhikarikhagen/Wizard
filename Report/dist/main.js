/**
 * Mock Data Generators
 */
const mockData = {
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
    referenceDate: new Date(),
    baseUrl: "https://crm.zoho.com",
    portal: "unijoydev", // fallback
    sortColumn: null,
    sortDir: 'desc'
};

/**
 * Dynamically Detect CRM environment info
 */
async function detectEnvironment() {
    try {
        // Attempt to get base domain from referrer for accuracy, fallback to params
        if (document.referrer) {
            try {
                state.baseUrl = new URL(document.referrer).origin;
            } catch(e) {}
        } else {

            
            const params = new URLSearchParams(window.location.search);
            const crmServer = params.get("crmserver") || "crm.zoho.com";
            state.baseUrl = `https://${crmServer}`;
        }

        // Get actual organization portal name / alias
        const orgRes = await ZOHO.CRM.CONFIG.getOrgInfo();
        if (orgRes && orgRes.org && orgRes.org[0]) {
            const org = orgRes.org[0];
            // Update portal state using domain_name from org response
            state.portal = org.domain_name || "crm";
            console.log("Environment detected:", state.baseUrl, state.portal);
        }
    } catch(e) {
        console.warn("Could not auto-detect environment, using defaults.");
    }
}

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
                ${trendValue !== 0 ? `
                <div class="card-trend ${isPositive ? 'trend-up' : 'trend-down'}">
                    <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i> ${Math.abs(trendValue) || 0}% vs last period
                </div>` : ''}
            </div>
        `;
    },

    renderTable: (headers, rows, sortIndex) => `
        <div class="table-container">
            <table>
                <thead>
                    <tr>${headers.map((h, i) => {
                        const isActive = sortIndex === i;
                        const icon = isActive 
                            ? (state.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down') 
                            : 'fa-sort';
                        return `<th onclick="handleSort(${i})" style="cursor: pointer; user-select: none;">
                            ${h} <i class="fas ${icon}" style="margin-left: 5px; opacity: ${isActive ? 1 : 0.3};"></i>
                        </th>`;
                    }).join('')}</tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `,

    formatCurrency: (amount) => `Rs ${amount.toLocaleString()}`,

    renderPieChart: (id) => `
        <div class="glass-card" style="margin-top: 1.5rem; padding: 1.5rem;">
            <div style="height: 350px; width: 100%; display: flex; justify-content: center;">
                <canvas id="${id}"></canvas>
            </div>
        </div>
    `
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
        let data = await dataService.fetchTopClients();
        const headers = ["Client Name", "Total Orders", "Total Sales", "Avg Order Value", "Due Amount", "Last Order Date"];
        
        // Sorting Logic
        if (state.sortColumn !== null) {
            data.sort((a, b) => {
                let valA, valB;
                const aovA = a.orders > 0 ? (a.sales / a.orders) : 0;
                const aovB = b.orders > 0 ? (b.sales / b.orders) : 0;

                switch (state.sortColumn) {
                    case 0: valA = a.name; valB = b.name; break;
                    case 1: valA = a.orders; valB = b.orders; break;
                    case 2: valA = a.sales; valB = b.sales; break;
                    case 3: valA = aovA; valB = aovB; break;
                    case 4: valA = a.due; valB = b.due; break;
                    case 5: valA = new Date(a.lastOrder || 0); valB = new Date(b.lastOrder || 0); break;
                    default: return 0;
                }
                if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
                if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const rows = data.map(c => {
            const lastOrderText = c.lastOrder && c.lastOrder !== "N/A" ? c.lastOrder : "No Date";
            const aov = c.orders > 0 ? (c.sales / c.orders) : 0;
            
            const accountLink = c.id 
                ? `${state.baseUrl}/crm/${state.portal}/tab/Accounts/${c.id}`
                : "javascript:void(0)";

            const orderLink = c.lastOrderId 
                ? `${state.baseUrl}/crm/${state.portal}/tab/Invoices/${c.lastOrderId}`
                : "javascript:void(0)";

            return [
                `<a href="${accountLink}" target="_blank" class="client-link">
                    <strong>${c.name}</strong> <i class="fas fa-external-link-alt"></i>
                </a>`,
                c.orders,
                components.formatCurrency(c.sales),
                `<strong>${components.formatCurrency(aov)}</strong>`,
                `<span style="color: #ef4444; font-weight: 600;">${components.formatCurrency(c.due)}</span>`,
                `<a href="${orderLink}" target="_blank" class="client-link" style="font-size: 0.8rem; font-weight: 500;">
                    ${lastOrderText} <i class="fas fa-external-link-alt" style="font-size: 0.6rem;"></i>
                </a>`
            ];
        });

        const topRevenue = data.length > 0 ? components.formatCurrency(data[0].sales) : "Rs 0";
        const avgOrders = data.length > 0 
            ? (data.reduce((acc, c) => acc + c.orders, 0) / data.length).toFixed(1) 
            : 0;

        const html = `
            <div class="page-header">
                <div class="page-title">
                    <h1>Top Clients</h1>
                    <p>Highest value distributors and retailers</p>
                </div>
            </div>
            <div class="dashboard-grid">
                ${components.renderCard("Highest Revenue", topRevenue, 0)}
                ${components.renderCard("Active Clients", data.length, 0)}
                ${components.renderCard("Avg Orders/Client", avgOrders, 0)}
            </div>
            ${components.renderTable(headers, rows, state.sortColumn)}
        `;
        document.getElementById('content').innerHTML = html;
    },

    patterns: async () => {
        let data = await dataService.fetchOrderPatterns();
        const headers = ["Client Name", "Overall Frequency", "Recent Frequency", "Days Since Last", "Trend"];
        
        // Sorting Logic
        if (state.sortColumn !== null) {
            data.sort((a, b) => {
                let valA, valB;
                switch (state.sortColumn) {
                    case 0: valA = a.name; valB = b.name; break;
                    case 1: valA = parseFloat(a.overallAvg); valB = parseFloat(b.overallAvg); break;
                    case 2: valA = parseFloat(a.recentAvg); valB = parseFloat(b.recentAvg); break;
                    case 3: valA = a.daysSince; valB = b.daysSince; break;
                    case 4: 
                        valA = parseFloat(a.recentAvg) - parseFloat(a.overallAvg);
                        valB = parseFloat(b.recentAvg) - parseFloat(b.overallAvg);
                        break;
                    default: return 0;
                }
                if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
                if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const rows = data.map(c => {
            const diff = parseFloat(c.recentAvg) - parseFloat(c.overallAvg);
            let trend = '';
            
            if (diff > 5) {
                trend = `<span class="trend-down"><i class="fas fa-arrow-up"></i> Slower (${Math.abs(diff).toFixed(0)}d)</span>`;
            } else if (diff < -5) {
                trend = `<span class="trend-up"><i class="fas fa-arrow-down"></i> Faster (${Math.abs(diff).toFixed(0)}d)</span>`;
            } else {
                trend = `<span style="color: var(--text-muted); font-size: 0.75rem;">Stable</span>`;
            }

            const accountLink = c.id 
                ? `${state.baseUrl}/crm/${state.portal}/tab/Accounts/${c.id}`
                : "javascript:void(0)";

            const orderLink = c.lastOrderId 
                ? `${state.baseUrl}/crm/${state.portal}/tab/Invoices/${c.lastOrderId}`
                : "javascript:void(0)";

            // Warning if Days Since Last > Overall Avg
            const lastOrderStyle = c.daysSince > (parseFloat(c.overallAvg) * 1.5) 
                ? 'color: #ef4444; font-weight: 700;' 
                : '';

            return [
                `<a href="${accountLink}" target="_blank" class="client-link">
                    <strong>${c.name}</strong> <i class="fas fa-external-link-alt"></i>
                </a>`,
                `${c.overallAvg} days`,
                `<strong>${c.recentAvg} days</strong>`,
                `<a href="${orderLink}" target="_blank" class="client-link" style="font-size: 0.8rem; font-weight: 500; ${lastOrderStyle}">
                    ${c.daysSince} days ago <i class="fas fa-external-link-alt" style="font-size: 0.6rem;"></i>
                </a>`,
                trend
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
                ${components.renderCard("Avg Frequency", (data.reduce((acc, c) => acc + parseFloat(c.overallAvg), 0) / data.length || 0).toFixed(0) + " Days", 0)}
                ${components.renderCard("At-Risk Clients", data.filter(c => c.daysSince > parseFloat(c.overallAvg)).length, 0)}
            </div>
            ${components.renderTable(headers, rows, state.sortColumn)}
        `;
        document.getElementById('content').innerHTML = html;
    },

    products: async () => {
        const [data, trends] = await Promise.all([
            dataService.fetchProductSales(),
            dataService.fetchProductTrends()
        ]);
        
        const totalRevenue = data.reduce((acc, p) => acc + p.total, 0);
        const trendMap = {};
        trends.forEach(t => { trendMap[t.name] = t; });

        const headers = ["Product Name", "Qty Sold", "Total Revenue", "Growth Trend", "Contribution (%)"];
        
        // Sorting Logic
        if (state.sortColumn !== null) {
            data.sort((a, b) => {
                let valA, valB;
                const trendA = (trendMap[a.name] || { growth: 0 }).growth;
                const trendB = (trendMap[b.name] || { growth: 0 }).growth;
                
                switch (state.sortColumn) {
                    case 0: valA = a.name; valB = b.name; break;
                    case 1: valA = a.qty; valB = b.qty; break;
                    case 2: valA = a.total; valB = b.total; break;
                    case 3: valA = trendA; valB = trendB; break;
                    case 4: valA = a.total; valB = b.total; break; // Use revenue for contribution sort
                    default: return 0;
                }
                if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
                if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const rows = data.map(p => {
            const contribution = totalRevenue > 0 ? (p.total / totalRevenue * 100) : 0;
            const t = trendMap[p.name] || { growth: 0, prevQty: 0, currQty: 0 };
            p.trend = t.growth; // for sorting
            
            const color = t.growth > 0 ? '#10b981' : t.growth < 0 ? '#ef4444' : '#94a3b8';
            const icon = t.growth > 0 ? '📈' : t.growth < 0 ? '📉' : '➖';
            
            const productLink = p.id 
                ? `${state.baseUrl}/crm/${state.portal}/tab/Products/${p.id}`
                : "javascript:void(0)";

            return [
                `<a href="${productLink}" target="_blank" class="client-link">
                    <strong>${p.name}</strong> <i class="fas fa-external-link-alt"></i>
                </a>`,
                `${p.qty.toLocaleString()} units`,
                components.formatCurrency(p.total),
                `<span style="color: ${color}; font-weight: 700; cursor: help;" title="Previous Month: ${(t.prevQty || 0).toLocaleString()} units | Current Month: ${(t.currQty || 0).toLocaleString()} units">
                    ${t.growth > 0 ? '+' : ''}${t.growth}% ${icon}
                </span>`,
                `<div style="display: flex; align-items: center; gap: 8px; min-width: 120px;">
                    <div style="flex:1; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${contribution}%; height: 100%; background: var(--primary);"></div>
                    </div>
                    <span style="font-size: 0.8rem; font-weight: 700;">${contribution.toFixed(1)}%</span>
                </div>`
            ];
        });

        const topByQty = data.length > 0 ? [...data].sort((a,b) => b.qty - a.qty)[0] : null;
        const topByRevenue = data.length > 0 ? [...data].sort((a,b) => b.total - a.total)[0] : null;

        const html = `
            <div class="page-header">
                <div class="page-title">
                    <h1>Product Performance</h1>
                    <p>Live analysis and revenue contribution by category</p>
                </div>
            </div>
            
            <div class="dashboard-grid">
                ${components.renderCard("Highest Revenue Product", topByRevenue ? `
                    <div style="font-weight: 850; font-size: 1.05rem; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${topByRevenue.name}</div>
                    <div style="font-size: 0.8rem; font-weight: 500; opacity: 0.7; margin-top: 4px;">${components.formatCurrency(topByRevenue.total)}</div>
                ` : "N/A", 0)}
                ${components.renderCard("Highest Quantity Sold", topByQty ? `
                    <div style="font-weight: 850; font-size: 1.05rem; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${topByQty.name}</div>
                    <div style="font-size: 0.8rem; font-weight: 500; opacity: 0.7; margin-top: 4px;">${topByQty.qty.toLocaleString()} units sold</div>
                ` : "N/A", 0)}
                <div class="glass-card chart-card-trigger" id="mix-trigger-card" style="padding: 1.25rem !important; margin: 0; display: flex; flex-direction: row; gap: 1rem; border-style: solid; border-color: var(--primary);">
                    <i class="fas fa-chart-pie" style="font-size: 1.5rem;"></i>
                    <div style="text-align: left;">
                        <h4 style="font-size: 0.9rem; margin-bottom: 2px;">Revenue Mix</h4>
                        <p style="font-size: 0.75rem; opacity: 0.7;">Click to View Analysis</p>
                    </div>
                </div>
            </div>

            <div style="margin-top: 1.5rem;">
                <h3 style="margin-bottom: 1rem; color: var(--text-muted); font-size: 0.875rem; text-transform: uppercase;">Overall Performance Ranking</h3>
                ${components.renderTable(headers, rows, state.sortColumn)}
            </div>
        `;
        document.getElementById('content').innerHTML = html;

        // Add trigger listener
        const trigger = document.getElementById('mix-trigger-card');
        if (trigger) trigger.onclick = () => showRevenueMixModal(data);
    },

    pdc: async () => {
        const data = await dataService.fetchPDCReport();
        
        // Group by Month of PDC_Date
        const months = {};
        data.forEach(item => {
            if (!item.PDC_Date) return;
            // Parse PDC_Date (e.g. 2026-04-12)
            const dateParts = item.PDC_Date.split('-');
            const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            
            if (!months[key]) months[key] = { items: [], total: 0 };
            months[key].items.push(item);
            months[key].total += item.Balance || 0;
        });

        // Metrics
        const netTotal = data.reduce((acc, i) => acc + (i.Balance || 0), 0);
        const now = new Date();
        const currKey = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        const currentMonthTotal = months[currKey] ? months[currKey].total : 0;

        let html = `
            <div class="page-header">
                <div class="page-title">
                    <h1>PDC Cheque Tracking</h1>
                    <p>Live recording of post-dated cheques and upcoming collection balances</p>
                </div>
            </div>
            <div class="dashboard-grid">
                ${components.renderCard("Total PDC Value", components.formatCurrency(netTotal), 0)}
                ${components.renderCard("Due This Month", components.formatCurrency(currentMonthTotal), 0)}
                ${components.renderCard("Total Cheques", data.length, 0)}
            </div>
        `;

        if (Object.keys(months).length === 0) {
            html += `<div class="glass-card" style="padding: 2rem; text-align: center; color: var(--text-muted);">No pending PDC cheques found at this time.</div>`;
        } else {
            // Sort months chronologically
            const sortedMonths = Object.keys(months).sort((a,b) => new Date(a) - new Date(b));
            
            sortedMonths.forEach(monthKey => {
                const group = months[monthKey];
                const headers = ["Client Name", "PDC 1 Date", "PDC 1 Status", "PDC 2 Date", "PDC 2 Status", "Balance"];
                const rows = group.items.map(i => {
                    const clientObj = i.Account_Name || {};
                    const accountLink = clientObj.id ? `${state.baseUrl}/crm/${state.portal}/tab/Accounts/${clientObj.id}` : "#";
                    
                    return [
                        `<a href="${accountLink}" target="_blank" class="client-link"><strong>${clientObj.name || 'Unknown'}</strong></a>`,
                        i.PDC_Date || '-',
                        `<span class="badge ${i.PDC_Status === 'Received' ? 'badge-blue' : 'badge-orange'}" style="font-size: 0.7rem;">${i.PDC_Status || 'Pending'}</span>`,
                        i.PDC2_Date || '-',
                        `<span class="badge ${i.PDC2_Status === 'Received' ? 'badge-blue' : 'badge-orange'}" style="font-size: 0.7rem;">${i.PDC2_Status || 'Pending'}</span>`,
                        `<strong>${components.formatCurrency(i.Balance)}</strong>`
                    ];
                });

                html += `
                    <div style="margin-top: 2.5rem;">
                        <h3 style="margin-bottom: 1rem; color: var(--text-muted); font-size: 0.875rem; text-transform: uppercase; display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
                            <span>${monthKey}</span>
                            <span style="font-weight: 500; color: var(--text);">Total: ${components.formatCurrency(group.total)}</span>
                        </h3>
                        ${components.renderTable(headers, rows, state.sortColumn)}
                    </div>
                `;
            });
        }
        
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

    let labels = [];
    if (state.currentFilter === 'year') {
        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    } else if (state.currentFilter === 'month') {
        labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
    } else {
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    }

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
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Get Monday
                
                // Create completely new dates to prevent mutating the same object
                const first = new Date(date);
                first.setDate(diff);
                
                const last = new Date(first);
                last.setDate(first.getDate() + 6);

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
        const detailedQuery = `SELECT Account_Name.Scope, Invoice_Date, Grand_Total FROM Invoices WHERE Invoice_Date >= '${current.start}' AND Invoice_Date <= '${current.end}'`;
        const prevTotalQuery = `SELECT Account_Name.Scope, SUM(Grand_Total) FROM Invoices WHERE Invoice_Date >= '${previous.start}' AND Invoice_Date <= '${previous.end}' GROUP BY Account_Name.Scope`;

        try {
            console.log("Isolating queries. First: detailedQuery");
            const currRes = await callCoqlV8(detailedQuery);
            console.log("Second: prevTotalQuery");
            const prevRes = await callCoqlV8(prevTotalQuery);

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
                // The SUM result is nested in an object generally, so we grab it slightly more safely
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
                    if (r["Account_Name.Scope"] === "B2B") historical[weekIdx].b2b += (r.Grand_Total || 0);
                    else historical[weekIdx].b2c += (r.Grand_Total || 0);
                });
            } else { // week
                for (let i = 0; i < 7; i++) historical.push({ b2b: 0, b2c: 0 });
                records.forEach(r => {
                    let dIdx = new Date(r.Invoice_Date).getDay();
                    dIdx = (dIdx === 0) ? 6 : dIdx - 1; // Mon-Sun
                    if (r["Account_Name.Scope"] === "B2B") historical[dIdx].b2b += (r.Grand_Total || 0);
                    else historical[dIdx].b2c += (r.Grand_Total || 0);
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
            console.error("Aggregation Error:", error);
            return {
                b2b: 0,
                b2c: 0,
                total: 0,
                prevB2B: 0,
                prevB2C: 0,
                prevTotal: 0,
                b2bTrend: 0,
                b2cTrend: 0,
                totalTrend: 0,
                historical: []
            };
        }
    },

    fetchTopClients: async () => {
        // Step 1: Get top 10 accounts by sales from Invoices
        const query = `SELECT Account_Name, SUM(Grand_Total), COUNT(Account_Name) FROM Invoices WHERE Grand_Total > 0 GROUP BY Account_Name ORDER BY Grand_Total DESC LIMIT 10`;
        
        try {
            const response = await callCoqlV8(query);
            const clientsData = response.data || [];
            
            if (clientsData.length === 0) return [];

            // Step 2: Extract IDs and fetch additional Account-level summary data in one bulk call
            const ids = clientsData
                .map(item => item.Account_Name && item.Account_Name.id)
                .filter(id => !!id);

            let accountExtrasMap = {};
            if (ids.length > 0) {
                try {
                    // Bulk fetch Account balances
                    const criteria = ids.map(id => `(id:equals:${id})`).join('or');
                    const searchRes = await ZOHO.CRM.API.searchRecord({
                        Entity: "Accounts",
                        Type: "criteria",
                        Query: criteria
                    });
                    (searchRes.data || []).forEach(acc => {
                        accountExtrasMap[acc.id] = { due: acc.Sum_of_Balance || 0, lastOrder: "N/A", lastOrderId: null };
                    });

                    // Search Invoices for these 10 accounts to find the LATEST order date
                    const invCriteria = ids.map(id => `(Account_Name:equals:${id})`).join('or');
                    const invRes = await ZOHO.CRM.API.searchRecord({
                        Entity: "Invoices",
                        Type: "criteria",
                        Query: invCriteria
                    });
                    
                    const invoiceData = invRes.data || [];
                    invoiceData.forEach(inv => {
                        const accId = inv.Account_Name ? inv.Account_Name.id : null;
                        const date = inv.Invoice_Date;
                        // Manual 'MAX' check since searchRecord doesn't sort by date natively
                        if (accId && accountExtrasMap[accId] && date) {
                            if (accountExtrasMap[accId].lastOrder === "N/A" || date > accountExtrasMap[accId].lastOrder) {
                                accountExtrasMap[accId].lastOrder = date;
                                accountExtrasMap[accId].lastOrderId = inv.id;
                            }
                        }
                    });
                } catch(accError) {
                    console.warn("SearchRecord Error for Client Extras:", accError);
                }
            }
            
            return clientsData.map(item => {
                const accId = item.Account_Name ? item.Account_Name.id : null;
                const extras = accountExtrasMap[accId] || { due: 0, lastOrder: "N/A", lastOrderId: null };
                return {
                    name: (item.Account_Name && item.Account_Name.name) ? item.Account_Name.name : "Unknown Client",
                    id: accId,
                    orders: item["COUNT(Account_Name)"] || 0,
                    sales: item["SUM(Grand_Total)"] || 0,
                    due: extras.due,
                    lastOrder: extras.lastOrder,
                    lastOrderId: extras.lastOrderId
                };
            });
        } catch (error) {
            console.error("Top Clients Fetch Error:", error);
            return [];
        }
    },

    fetchOrderPatterns: async () => {
        // Fetch most recent invoices to have history for gap analysis
        const query = `SELECT Account_Name, Invoice_Date, id FROM Invoices WHERE Grand_Total > 0 ORDER BY Invoice_Date DESC LIMIT 200`;
        
        try {
            const response = await callCoqlV8(query);
            const invoices = response.data || [];
            
            // 1. Group records by client
            const grouped = {};
            invoices.forEach(inv => {
                const acc = inv.Account_Name;
                if (!acc) return;
                
                const accId = acc.id;
                if (!grouped[accId]) {
                    grouped[accId] = {
                        name: acc.name || "Unknown",
                        id: accId,
                        dates: [],
                        invoiceIds: []
                    };
                }
                grouped[accId].dates.push(new Date(inv.Invoice_Date));
                grouped[accId].invoiceIds.push(inv.id);
            });

            // 2. Calculate Stats
            const stats = [];
            for (const [id, client] of Object.entries(grouped)) {
                const dates = client.dates;
                if (dates.length < 2) continue; // Need at least 2 orders for a gap

                // Ensure dates (and invoice mapping) are sorted chronologically
                // We'll map them first to keep them together
                const items = dates.map((d, i) => ({ date: d, invId: client.invoiceIds[i] }));
                items.sort((a, b) => a.date - b.date);

                const sortedDates = items.map(x => x.date);
                const latestInvId = items[items.length - 1].invId;

                // Calculate gaps between consecutive orders
                let gaps = [];
                for (let i = 1; i < sortedDates.length; i++) {
                    const diffDays = Math.floor((sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24));
                    gaps.push(diffDays);
                }

                // Overall Avg (Lifetime Gap)
                const overallAvg = gaps.reduce((a, b) => a + b, 0) / gaps.length;

                // Recent Avg (Last 3 gaps)
                const recentGaps = gaps.slice(-3);
                const recentAvg = recentGaps.reduce((a, b) => a + b, 0) / recentGaps.length;

                // Days Since Last Order
                const lastOrderDate = sortedDates[sortedDates.length - 1];
                const daysSince = Math.floor((new Date() - lastOrderDate) / (1000 * 60 * 60 * 24));

                stats.push({
                    name: client.name,
                    id: client.id,
                    overallAvg: overallAvg.toFixed(1),
                    recentAvg: recentAvg.toFixed(1),
                    daysSince: daysSince,
                    lastOrderId: latestInvId
                });
            }

            return stats.sort((a,b) => b.daysSince - a.daysSince); // Most stale clients at top
            
        } catch (error) {
            console.error("Order Pattern Fetch Error:", error);
            return [];
        }
    },

    // 4. Average Order Size
    fetchAverageOrderSize: async () => {
        const query = `select Account_Name, sum(Invoice_Amount), count(id) from Invoices group by Account_Name`;
        return mockData.getAverageOrderSize();
    },

    fetchProductTrends: async () => {
        const getDates = (monthsAgo) => {
            const start = new Date();
            start.setMonth(start.getMonth() - monthsAgo);
            start.setDate(1);
            start.setHours(0,0,0,0);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
            return {
                start: start.toISOString().replace('.000Z', '+05:45'),
                end: end.toISOString().replace('.000Z', '+05:45')
            };
        };

        const curr = getDates(0);
        const prev = getDates(1);

        const buildQuery = (dates) => `SELECT Product_Name, SUM(Quantity) FROM Invoiced_Items WHERE Created_Time >= '${dates.start}' AND Created_Time <= '${dates.end}' GROUP BY Product_Name`;

        try {
            const [currRes, prevRes] = await Promise.all([
                callCoqlV8(buildQuery(curr)),
                callCoqlV8(buildQuery(prev))
            ]);

            const currData = currRes.data || [];
            const prevData = prevRes.data || [];

            const trendMap = {};
            currData.forEach(item => {
                const name = item.Product_Name ? item.Product_Name.name : "Unknown";
                trendMap[name] = { curr: item["SUM(Quantity)"] || 0, prev: 0 };
            });

            prevData.forEach(item => {
                const name = item.Product_Name ? item.Product_Name.name : "Unknown";
                if (!trendMap[name]) trendMap[name] = { curr: 0, prev: 0 };
                trendMap[name].prev = item["SUM(Quantity)"] || 0;
            });

            return Object.entries(trendMap).map(([name, vals]) => {
                const growth = vals.prev === 0 ? (vals.curr > 0 ? 100 : 0) : Math.round(((vals.curr - vals.prev) / vals.prev) * 100);
                return {
                    name,
                    currQty: vals.curr,
                    prevQty: vals.prev,
                    growth
                };
            }).sort((a,b) => b.growth - a.growth);

        } catch (error) {
            console.error("Trend Fetch Error:", error);
            return [];
        }
    },
    fetchProductSales: async () => {
        const query = `SELECT Product_Name, SUM(Quantity), SUM(Total) FROM Invoiced_Items WHERE Quantity > 0 GROUP BY Product_Name`;
        
        try {
            const response = await callCoqlV8(query);
            const items = response.data || [];
            
            return items.map(item => {
                const qty = item["SUM(Quantity)"] || 0;
                const total = item["SUM(Total)"] || 0;
                const productObj = item.Product_Name || {};
                
                return {
                    name: productObj.name || "Unknown Product",
                    id: productObj.id || null,
                    qty: qty,
                    total: total,
                    avgPrice: qty > 0 ? (total / qty) : 0
                };
            }).sort((a,b) => b.total - a.total); // Sort by highest revenue
            
        } catch (error) {
            console.error("Product Sales Fetch Error:", error);
            return [];
        }
    },

    // 6. PDC Cheque Report
    fetchPDCReport: async () => {
        const query = `SELECT Account_Name, PDC2_Date, PDC_Date, PDC2_Status, PDC_Status, Balance FROM Invoices WHERE Balance > 0 AND PDC_Date is not null`;
        try {
            const response = await callCoqlV8(query);
            return response.data || [];
        } catch (error) {
            console.error("PDC Fetch Error:", error);
            return [];
        }
    }
};

/**
 * Navigation
 */
function showLoading() {
    document.getElementById('content').innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 60vh;">
            <div style="text-align: center;">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--primary); margin-bottom: 1rem;"></i>
                <p>Fetching Live Data...</p>
            </div>
        </div>
    `;
}

async function switchReport(reportId) {
    state.currentReport = reportId;
    
    // Show Loading
    showLoading();

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
    showLoading();
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
    showLoading();
    if (reports[state.currentReport]) {
        reports[state.currentReport]();
    }
}

async function handleSort(columnIndex) {
    if (state.sortColumn === columnIndex) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortColumn = columnIndex;
        state.sortDir = 'desc'; // Default to desc for new columns
    }
    
    if (reports[state.currentReport]) {
        reports[state.currentReport]();
    }
}

function toggleSidebar() {
    document.body.classList.toggle('collapsed');
}

function showRevenueMixModal(data) {
    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    
    body.innerHTML = `
        <h2 style="margin-bottom: 2rem; text-align: center; color: var(--primary);">Product Revenue Mix Analysis</h2>
        <div style="height: 400px; width: 100%;">
            <canvas id="modal-pie-chart"></canvas>
        </div>
        <p style="text-align: center; color: var(--text-muted); margin-top: 2rem; font-size: 0.9rem;">
            Hover over the segments to see contribution percentages.
        </p>
    `;
    
    overlay.classList.add('active');

    setTimeout(() => {
        const ctx = document.getElementById('modal-pie-chart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(p => p.name),
                datasets: [{
                    data: data.map(p => p.total),
                    backgroundColor: [
                        '#10b981', '#3b82f6', '#f59e0b', '#ef4444', 
                        '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'
                    ],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            font: { size: 11 },
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${percentage}%`;
                            }
                        }
                    }
                },
                cutout: '70%',
                animation: { duration: 1000 }
            }
        });
    }, 100);
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
    // 1. Handle dynamic trend modal (removes from DOM)
    const trendModal = document.getElementById('trend-modal');
    if (trendModal) {
        trendModal.classList.remove('active');
        setTimeout(() => trendModal.remove(), 300);
    }

    // 2. Handle static modal overlay (hides via class)
    const staticModal = document.getElementById('modal-overlay');
    if (staticModal) {
        staticModal.classList.remove('active');
    }
}

window.switchReport = switchReport;
window.switchFilter = switchFilter;
window.movePeriod = movePeriod;
window.refreshData = refreshData;
window.showTrendDetails = showTrendDetails;
window.closeModal = closeModal;
window.detectEnvironment = detectEnvironment;

