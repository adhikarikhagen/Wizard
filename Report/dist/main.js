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
    sortDir: 'desc',
    clientFilter: 'top10',
    patternsPeriod: '365'
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
    `,

    renderSparkline: (points, width = 80, height = 30) => {
        if (!points || points.length < 2) return '';
        const max = Math.max(...points, 1);
        const min = Math.min(...points);
        const range = max - min || 1;
        
        // Normalize points to SVG coordinates
        const coords = points.map((p, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - ((p - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        const color = points[points.length - 1] >= points[points.length - 2] ? '#10b981' : '#ef4444';

        return `<svg width="${width}" height="${height}" style="overflow: visible;">
            <path d="M ${coords}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="${width}" cy="${height - ((points[points.length-1]-min)/range)*height}" r="3" fill="${color}" />
        </svg>`;
    }
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
            // Fixed Monthly Week Slots: Day 1-7, 8-14, 15-21, 22-28, 29-End
            const d = new Date(date);
            const dayNum = d.getDate();
            const slotIdx = Math.min(Math.floor((dayNum - 1) / 7), 4);
            const startDay = slotIdx * 7 + 1;
            let endDay = (slotIdx + 1) * 7;
            const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            if (slotIdx === 4 || endDay > lastDayOfMonth) endDay = lastDayOfMonth;
            
            return `${date.toLocaleString('default', {month:'short'})} ${startDay} - ${date.toLocaleString('default', {month:'short'})} ${endDay}, ${date.getFullYear()}`;
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
        try {
            let data = await dataService.fetchTopClients(state.clientFilter);
            if (data && data.error) {
                renderError(data.message || "Failed to fetch clients");
                return;
            }
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
                    <div class="filters">
                        <button class="filter-btn ${state.clientFilter === 'top10' ? 'active' : ''}" onclick="switchClientFilter('top10')">Top 10</button>
                        <button class="filter-btn ${state.clientFilter === 'all' ? 'active' : ''}" onclick="switchClientFilter('all')">All Clients</button>
                    </div>
                </div>
                <div class="dashboard-grid">
                    ${components.renderCard("Highest Revenue", topRevenue, 0)}
                    ${components.renderCard("Active Clients", data.filter(c => {
                        if (!c.lastOrder || c.lastOrder === 'N/A') return false;
                        const lastOrder = new Date(c.lastOrder);
                        const oneMonthAgo = new Date();
                        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                        return lastOrder >= oneMonthAgo;
                    }).length, 0)}
                    ${components.renderCard("Avg Orders/Client", avgOrders, 0)}
                </div>
                ${components.renderTable(headers, rows, state.sortColumn)}
            `;
            document.getElementById('content').innerHTML = html;
        } catch (err) {
            console.error("Renderer Error (Clients):", err);
            renderError(err.message || "UI Error Loading Clients");
        }
    },

    patterns: async () => {
        let data = await dataService.fetchOrderPatterns(state.patternsPeriod);
        const headers = ["Client Name", "Total Orders", "Overall Frequency", "Recent Frequency", "Days Since Last", "Action"];
        
        // Sorting Logic
        if (state.sortColumn !== null) {
            data.sort((a, b) => {
                let valA, valB;
                switch (state.sortColumn) {
                    case 0: valA = a.name; valB = b.name; break;
                    case 1: valA = a.count; valB = b.count; break;
                    case 2: valA = parseFloat(a.overallAvg); valB = parseFloat(b.overallAvg); break;
                    case 3: valA = parseFloat(a.recentAvg); valB = parseFloat(b.recentAvg); break;
                    case 4: valA = a.daysSince; valB = b.daysSince; break;
                    case 5: valA = a.count; valB = b.count; break; // Use total orders as fallback for action col sort
                    default: return 0;
                }
                if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
                if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // Shared function for Overall Trend Modal to use current data
        window.tempPatternData = data;

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
                `<span style="font-weight: 700; color: var(--text-muted); opacity: 0.8;">${c.count}</span>`,
                `<span class="clickable-cell" onclick="showFrequencyModal(\`${c.name}\`, 'Overall Frequency', ${JSON.stringify(c.overallObj).replace(/"/g, '&quot;')}, '${c.overallAvg}')">${c.overallAvg} days</span>`,
                `<span class="clickable-cell" onclick="showFrequencyModal(\`${c.name}\`, 'Recent Activity', ${JSON.stringify(c.recentObj).replace(/"/g, '&quot;')}, '${c.recentAvg}')"><strong>${c.recentAvg} days</strong></span>`,
                `<a href="${orderLink}" target="_blank" class="client-link" style="font-size: 0.8rem; font-weight: 500; ${lastOrderStyle}">
                    ${c.daysSince} days ago <i class="fas fa-external-link-alt" style="font-size: 0.6rem;"></i>
                </a>`,
                `<button class="filter-btn" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="showClientTrendModal(\`${c.name}\`, ${JSON.stringify(c.gaps).replace(/"/g, '&quot;')}, ${JSON.stringify(c.gapDates).replace(/"/g, '&quot;')})">
                    <i class="fas fa-chart-line"></i> View Trend
                </button>`
            ];
        });

        const html = `
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem;">
                    <div class="page-title">
                        <h1>Order Patterns</h1>
                        <p>Analyzing client ordering frequency for proactive sales</p>
                    </div>
                    <button class="filter-btn active" style="border: 1px dashed var(--primary); background: rgba(99, 102, 241, 0.05); color: var(--primary); padding: 0.75rem 1.5rem;" onclick="showOverallTrendModal()">
                        <i class="fas fa-layer-group"></i> Compare All Patterns
                    </button>
                </div>
                
                <div class="filters" style="margin-bottom: 2rem;">
                    <button class="filter-btn ${state.patternsPeriod === '90' ? 'active' : ''}" onclick="switchPatternPeriod('90')">Past 3M</button>
                    <button class="filter-btn ${state.patternsPeriod === '180' ? 'active' : ''}" onclick="switchPatternPeriod('180')">Past 6M</button>
                    <button class="filter-btn ${state.patternsPeriod === '365' ? 'active' : ''}" onclick="switchPatternPeriod('365')">Past 1Y</button>
                    <button class="filter-btn ${state.patternsPeriod === 'all' ? 'active' : ''}" onclick="switchPatternPeriod('all')">All Time</button>
                </div>
            <div class="dashboard-grid">
                ${components.renderCard("Avg Frequency", (data.reduce((acc, c) => acc + parseFloat(c.overallAvg), 0) / data.length || 0).toFixed(0) + " Days", 0)}
                ${components.renderCard("At-Risk Clients", data.filter(c => {
                    const threshold = Math.max(parseFloat(c.overallAvg), parseFloat(c.recentAvg));
                    return c.daysSince > threshold;
                }).length, 0)}
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
        
        // Fetch Stock Data
        const stockData = await dataService.fetchProductsStock();
        const stockMap = {};
        if (Array.isArray(stockData)) {
            stockData.forEach(item => { if(item.Product_Name) stockMap[item.Product_Name] = item.Qty_in_Stock || 0; });
        }

        const headers = ["Product", "Sold", "Stock", "Coverage", "Category", "Contrib.", "Action"];
        
        // Sorting Logic
        if (state.sortColumn !== null) {
            data.sort((a, b) => {
                let valA, valB;
                const stockA = stockMap[a.name] || 0;
                const stockB = stockMap[b.name] || 0;
                const m1A = (trendMap[a.name] || { m1: 0 }).m1;
                const m1B = (trendMap[b.name] || { m1: 0 }).m1;

                switch (state.sortColumn) {
                    case 0: valA = a.name; valB = b.name; break;
                    case 1: valA = a.qty; valB = b.qty; break;
                    case 2: valA = stockA; valB = stockB; break;
                    case 3: // Coverage
                        const dailyA = m1A / 30;
                        const dailyB = m1B / 30;
                        valA = dailyA > 0 ? (stockA / dailyA) : 999;
                        valB = dailyB > 0 ? (stockB / dailyB) : 999;
                        break;
                    case 4: valA = m1A; valB = m1B; break; // Category (use volume)
                    case 5: valA = a.total; valB = b.total; break; // Contribution
                    default: return 0;
                }
                if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
                if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const rows = data.map(p => {
            const contribution = totalRevenue > 0 ? (p.total / totalRevenue * 100) : 0;
            const t = trendMap[p.name] || { m1: 0 };
            const stock = stockMap[p.name] || 0;
            
            // Coverage calculation (based on last 30 days)
            const dailyAvg = (t.m1 / 30);
            const coverage = dailyAvg > 0 ? Math.round(stock / dailyAvg) : (stock > 0 ? 999 : 0);
            
            // Categorization
            const isFast = dailyAvg > 10; // Threshold for "Fast"
            const category = isFast ? '<span class="badge badge-green">Fast 🔥</span>' : '<span class="badge badge-yellow">Slow 🐢</span>';
            
            // Action Logic
            let actionHtml = '';
            if (coverage < 15) {
                actionHtml = '<span class="badge badge-red" style="padding: 4px 8px; font-weight: 700;">Reorder</span>';
            } else if (coverage > 60) {
                actionHtml = '<span class="badge" style="background: #6366f1; color: white;">Push Sales</span>';
            } else {
                actionHtml = '<span style="color: var(--text-muted); font-size: 0.75rem;">Stable</span>';
            }

            const productLink = p.id 
                ? `${state.baseUrl}/crm/${state.portal}/tab/Products/${p.id}`
                : "javascript:void(0)";

            return [
                `<a href="${productLink}" target="_blank" class="client-link">
                    <strong>${p.name}</strong> <i class="fas fa-external-link-alt"></i>
                </a>`,
                `<strong>${p.qty.toLocaleString()}</strong>`,
                stock.toLocaleString(),
                `<div style="display: flex; flex-direction: column;">
                    <strong>${coverage === 999 ? '∞' : coverage} days</strong>
                    <span style="font-size: 0.61rem; color: var(--text-muted);">Stock Life</span>
                </div>`,
                category,
                `<strong>${contribution.toFixed(1)}%</strong>`,
                actionHtml
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
        labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
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
                },
                {
                    label: 'Total Sales',
                    data: data.historical.map(h => (h.b2b || 0) + (h.b2c || 0)),
                    backgroundColor: '#f59e0b',
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
            onClick: async (event, elements) => {
                if (elements && elements.length > 0) {
                    const idx = elements[0].index;
                    const datasetIdx = elements[0].datasetIndex;
                    let scope = "B2B";
                    if (datasetIdx === 1) scope = "B2C";
                    else if (datasetIdx === 2) scope = "ALL"; // Special case for Total
                    
                    const label = labels[idx];
                    
                    if (window.handleChartClick) {
                        await window.handleChartClick(idx, scope, label);
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

/**
 * Handle Bar Chart Click
 */
async function handleChartClick(index, scope, label) {
    const referenceDate = state.referenceDate;
    let start, end;

    if (state.currentFilter === 'year') {
        const year = referenceDate.getFullYear();
        const month = index; // 0-11
        const first = new Date(year, month, 1);
        const last = new Date(year, month + 1, 0);
        // ISO date strings for date objects
        const getYMD = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
        start = getYMD(first);
        end = getYMD(last);
    } else if (state.currentFilter === 'month') {
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth();
        // Index 0: 1-7, 1: 8-14, 2: 15-21, 3: 22-28, 4: 29-end
        const dStart = index * 7 + 1;
        let dEnd = (index + 1) * 7;
        
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        if (index === 4 || dEnd > lastDayOfMonth) dEnd = lastDayOfMonth;

        const getYMD = (y, m, d) => y + "-" + String(m + 1).padStart(2, '0') + "-" + String(d).padStart(2, '0');
        start = getYMD(year, month, dStart);
        end = getYMD(year, month, dEnd);
    } else { // week
        // Drilling into a specific day of the monthly Week slot
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth();
        const dayNum = referenceDate.getDate();
        const slotIdx = Math.min(Math.floor((dayNum - 1) / 7), 4);
        const startDay = slotIdx * 7 + 1;
        const endDay = Math.min((slotIdx + 1) * 7, new Date(year, month + 1, 0).getDate());

        // We need to find the specific date in this slot [startDay, endDay] that corresponds to the clicked dayOfWeek (index)
        // index 0=Sun, 1=Mon, ..., 5=Fri
        let foundDate = null;
        for (let d = startDay; d <= endDay; d++) {
            const current = new Date(year, month, d);
            if (current.getDay() === index) {
                const getYMD = (dt) => dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, '0') + "-" + String(dt.getDate()).padStart(2, '0');
                foundDate = getYMD(current);
                break;
            }
        }

        if (!foundDate) {
            console.warn("Date not found in current week slot for day index:", index);
            return;
        }
        start = foundDate;
        end = foundDate;
    }

    const scopeFilter = (scope === "ALL") ? "" : `Account_Name.Scope = '${scope}' AND `;
    const query = `SELECT Account_Name, Subject, Balance, Account_Name.Scope, Grand_Total, Invoice_Date FROM Invoices WHERE ${scopeFilter}(Invoice_Date >= '${start}' AND Invoice_Date <= '${end}')`;
    
    const overlay = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    
    if (overlay) overlay.classList.add('active');
    if (modalBody) {
        modalBody.innerHTML = `
            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 4rem 2rem; gap: 1.5rem;">
                <i class="fas fa-circle-notch fa-spin" style="font-size: 2.5rem; color: var(--primary);"></i>
                <p style="font-weight: 500; font-size: 1.1rem;">Fetching Invoice Details...</p>
                <p style="color: var(--text-muted); font-size: 0.85rem;">Drilling down into ${label} for ${scope}</p>
            </div>
        `;
    }

    try {
        const response = await callCoqlV8(query);
        const invoices = response.data || [];
        const dateDisplay = (start === end) ? start : `${start} to ${end}`;
        showInvoiceListModal(invoices, `${label} (${scope})`, dateDisplay);
    } catch (error) {
        console.error("Chart Drilldown Error:", error);
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="color: #ef4444; padding: 3rem; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
                    <p style="font-weight: 600;">Data Retrieval Failed</p>
                    <p style="font-size: 0.85rem; opacity: 0.8; margin-top: 0.5rem;">Failed to execute drilldown query.</p>
                </div>
            `;
        }
    }
}

function showInvoiceListModal(invoices, title, dateRange) {
    const modalBody = document.getElementById('modal-body');
    
    if (!invoices || invoices.length === 0) {
        modalBody.innerHTML = `
            <div style="padding: 3rem; text-align: center;">
                <h2 style="color: var(--primary); margin-bottom: 0.5rem;">${title} Invoices</h2>
                <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 2rem;">[ ${dateRange} ]</div>
                <div style="margin-bottom: 2rem; font-size: 4rem; opacity: 0.1;"><i class="fas fa-file-invoice"></i></div>
                <p style="color: var(--text-muted); font-size: 1.1rem;">No matching invoices found for this specific period and criteria.</p>
            </div>
        `;
        return;
    }

    const headers = ["Account Name", "Subject", "Date", "Total", "Balance"];
    const rows = invoices.map(inv => {
        const acc = inv.Account_Name || { name: 'Unknown' };
        const accLink = acc.id ? `${state.baseUrl}/crm/${state.portal}/tab/Accounts/${acc.id}` : "#";
        const invLink = inv.id ? `${state.baseUrl}/crm/${state.portal}/tab/Invoices/${inv.id}` : "#";

        return [
            `<a href="${accLink}" target="_blank" class="client-link"><strong>${acc.name}</strong></a>`,
            `<a href="${invLink}" target="_blank" class="client-link" style="font-size: 0.85rem; opacity: 0.9;">${inv.Subject || '-'}</a>`,
            `<span style="font-family: monospace;">${inv.Invoice_Date || '-'}</span>`,
            `<strong>${components.formatCurrency(inv.Grand_Total || 0)}</strong>`,
            `<span style="color: ${inv.Balance > 0 ? '#ef4444' : '#10b981'}; font-weight: 700;">${components.formatCurrency(inv.Balance || 0)}</span>`
        ];
    });

    const totalGrand = invoices.reduce((a,b) => a + (b.Grand_Total || 0), 0);
    const totalBalance = invoices.reduce((a,b) => a + (b.Balance || 0), 0);

    modalBody.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h2 style="color: var(--primary); font-size: 1.5rem; margin-bottom: 0.25rem;">${title} Invoices</h2>
            <div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.85rem;">
                <i class="fas fa-calendar-alt"></i>
                <span>${dateRange}</span>
                <span style="opacity: 0.5;">•</span>
                <span>Records matching selected chart segment</span>
            </div>
        </div>
        
        <div style="max-height: 60vh; overflow-y: auto; overflow-x: auto; border-radius: 12px; background: rgba(0,0,0,0.1); border: 1px solid var(--border);">
            ${components.renderTable(headers, rows)}
        </div>
        
        <div style="margin-top: 2rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
            <div class="glass-card" style="padding: 1rem; background: rgba(255,255,255,0.02);">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Total Records</div>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${invoices.length}</div>
            </div>
            <div class="glass-card" style="padding: 1rem; background: rgba(255,255,255,0.02);">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Total Amount</div>
                <div style="font-size: 1.25rem; font-weight: 700; color: #6366f1;">${components.formatCurrency(totalGrand)}</div>
            </div>
            <div class="glass-card" style="padding: 1rem; background: rgba(255,255,255,0.02);">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Total Balance</div>
                <div style="font-size: 1.25rem; font-weight: 700; color: #ef4444;">${components.formatCurrency(totalBalance)}</div>
            </div>
        </div>
    `;
}


/**
 * COQL v8 API Helper
 */
async function callCoqlV8(query) {
    
    const coqlRes = await zrc.post("/crm/v8/coql", {
        select_query: query
    });
    
    
    if (coqlRes && coqlRes.status === "error") {
        const msg = coqlRes.message || "COQL Query Failed";
        const code = coqlRes.code || "UNKNOWN";
        throw new Error(`${code}: ${msg}`);
    }

    // zrc.post returns an object with {status, data, headers}
    // We want the inner data which contains {data: [], info: {}}
    const body = coqlRes.data || coqlRes;
    
    if (Array.isArray(body)) {
        return { data: body, info: { more_records: false } };
    }
    return body;
}

/**
 * Fetch All Records with Pagination
 */
async function fetchAllCoql(query) {
    let allData = [];
    let moreRecords = true;
    let offset = 0;

    // Remove any trailing LIMIT if present to manage it manually
    const baseQuery = query.replace(/\s+LIMIT\s+\d+,\s*\d+$/i, "").replace(/\s+LIMIT\s+\d+$/i, "");

    while (moreRecords) {
        const paginatedQuery = `${baseQuery} LIMIT ${offset}, 200`;
        const res = await callCoqlV8(paginatedQuery);
        
        if (res && res.data) {
            allData = allData.concat(res.data);
        }

        if (res && res.info && res.info.more_records) {
            offset += 200;
            // Cap at 5000 for safety in a widget
            if (offset >= 5000) break;
        } else {
            moreRecords = false;
        }
    }
    return allData;
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
                const year = date.getFullYear();
                const month = date.getMonth();
                const dayNum = date.getDate();
                const slotIdx = Math.min(Math.floor((dayNum - 1) / 7), 4);
                
                const startDay = slotIdx * 7 + 1;
                let endDay = (slotIdx + 1) * 7;
                const lastDay = new Date(year, month + 1, 0).getDate();
                if (slotIdx === 4 || endDay > lastDay) endDay = lastDay;

                start = `${year}-${String(month+1).padStart(2,'0')}-${String(startDay).padStart(2,'0')}`;
                end = `${year}-${String(month+1).padStart(2,'0')}-${String(endDay).padStart(2,'0')}`;
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
            const records = await fetchAllCoql(detailedQuery);
            const prevRes = await callCoqlV8(prevTotalQuery);

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
                for (let i = 0; i < 6; i++) historical.push({ b2b: 0, b2c: 0 });
                records.forEach(r => {
                    let dIdx = new Date(r.Invoice_Date).getDay();
                    if (dIdx >= 6) return; // Skip Saturday for Sun-Fri week
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

    fetchTopClients: async (limitType = 'top10') => {
        try {
            const getYMD = (date) => {
                const d = new Date(date);
                return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
            };

            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            const oneMonthAgoStr = getYMD(oneMonthAgo);

            // 1. Identify clients with recent activity (within last 30 days)
            // Note: Since MAX(Invoice_Date) is unsupported, we fetch all active IDs first
            const activeQuery = `SELECT Account_Name FROM Invoices WHERE Invoice_Date >= '${oneMonthAgoStr}' GROUP BY Account_Name`;
            const activeRes = await fetchAllCoql(activeQuery);
            const activeIdSet = new Set(activeRes.map(item => item.Account_Name.id));

            // 2. Fetch lifetime revenue for all clients
            const revenueQuery = `SELECT Account_Name, SUM(Grand_Total), COUNT(Account_Name) FROM Invoices WHERE Grand_Total > 0 GROUP BY Account_Name`;
            const allClientsData = await fetchAllCoql(revenueQuery);

            if (allClientsData.length === 0) return [];

            // 3. Filter for active clients and Sort by revenue
            let resultList = allClientsData
                .filter(item => activeIdSet.has(item.Account_Name.id))
                .sort((a, b) => {
                    const valA = a["SUM(Grand_Total)"] || 0;
                    const valB = b["SUM(Grand_Total)"] || 0;
                    return valB - valA;
                });

            if (limitType === 'top10') {
                resultList = resultList.slice(0, 10);
            }

            if (resultList.length === 0) return [];

            // 4. Fetch additional details for these specific clients
            const ids = resultList.map(item => item.Account_Name?.id).filter(id => !!id);
            let accountExtrasMap = {};

            if (ids.length > 0) {
                // Fetch Account balances
                const criteria = ids.map(id => `(id:equals:${id})`).join('or');
                const searchRes = await ZOHO.CRM.API.searchRecord({
                    Entity: "Accounts",
                    Type: "criteria",
                    Query: criteria
                });
                (searchRes.data || []).forEach(acc => {
                    accountExtrasMap[acc.id] = { due: acc.Sum_of_Balance || 0, lastOrder: "N/A" };
                });

                // Fetch LATEST invoice date for these top clients via search (ordered by date)
                // searchRecord results for Invoices to find the most recent one for each
                const invCriteria = ids.map(id => `(Account_Name:equals:${id})`).join('or');
                const invRes = await ZOHO.CRM.API.searchRecord({
                    Entity: "Invoices",
                    Type: "criteria",
                    Query: invCriteria
                });
                
                (invRes.data || []).forEach(inv => {
                    const accId = inv.Account_Name?.id;
                    const date = inv.Invoice_Date;
                    if (accId && accountExtrasMap[accId]) {
                        if (accountExtrasMap[accId].lastOrder === "N/A" || date > accountExtrasMap[accId].lastOrder) {
                            accountExtrasMap[accId].lastOrder = date;
                            accountExtrasMap[accId].lastOrderId = inv.id;
                        }
                    }
                });
            }

            return resultList.map(item => {
                const accId = item.Account_Name?.id || null;
                const extras = accountExtrasMap[accId] || { due: 0, lastOrder: "N/A", lastOrderId: null };
                return {
                    name: item.Account_Name?.name || "Unknown Client",
                    id: accId,
                    orders: item["COUNT(Account_Name)"] || 0,
                    sales: item["SUM(Grand_Total)"] || 0,
                    due: extras.due,
                    lastOrder: extras.lastOrder,
                    lastOrderId: extras.lastOrderId
                };
            });
        } catch (error) {
            console.error("Top Clients Data Failure:", error);
            // Propagate error object for UI rendering
            return { error: true, message: error.message };
        }
    },

    fetchOrderPatterns: async (days) => {
        let where = "WHERE Grand_Total > 0";
        if (days && days !== 'all') {
            const date = new Date();
            date.setDate(date.getDate() - parseInt(days));
            const dateStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0');
            where += ` AND Invoice_Date >= '${dateStr}'`;
        }

        const query = `SELECT Account_Name, Invoice_Date, id FROM Invoices ${where} ORDER BY Invoice_Date DESC`;
        
        try {
            const allInvoices = await fetchAllCoql(query);
            if (allInvoices.length === 0) return [];
            
            const clientGroups = {};
            allInvoices.forEach(inv => {
                const accId = inv.Account_Name?.id;
                if (!accId) return;
                if (!clientGroups[accId]) clientGroups[accId] = [];
                clientGroups[accId].push(inv);
            });

            const results = [];
            const today = new Date();

            for (const [accId, invoices] of Object.entries(clientGroups)) {
                const count = invoices.length;
                if (count < 2) continue;

                // invoices are already DESC by Invoice_Date from query
                const latest = new Date(invoices[0].Invoice_Date);
                const earliest = new Date(invoices[count - 1].Invoice_Date);
                const totalDays = Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24));
                const overallAvg = (totalDays / (count - 1)).toFixed(0);

                // Detailed Gap Analysis (Chronological for Graph)
                const gaps = [];
                const gapDates = [];
                for (let i = 0; i < invoices.length - 1; i++) {
                    const d1 = new Date(invoices[i].Invoice_Date);
                    const d2 = new Date(invoices[i+1].Invoice_Date);
                    gaps.push(Math.max(0, Math.ceil((d1 - d2) / (1000 * 60 * 60 * 24))));
                    gapDates.push(invoices[i].Invoice_Date); // The date of the later invoice in the pair
                }
                const chronologicalGaps = gaps.reverse(); 
                const chronologicalDates = gapDates.reverse();
                
                const getYMD = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
                
                const overallObj = {
                    start: getYMD(earliest),
                    end: getYMD(latest),
                    days: totalDays,
                    intervals: count - 1,
                    orders: count
                };

                // Recent (last 5)
                let recentAvg = overallAvg;
                let recentObj = overallObj;
                if (count >= 3) {
                    const recentCount = Math.min(count, 5);
                    const lastInWindow = new Date(invoices[recentCount-1].Invoice_Date);
                    const recentDays = Math.ceil((latest - lastInWindow) / (1000 * 60 * 60 * 24));
                    recentAvg = (recentDays / (recentCount - 1)).toFixed(0);
                    recentObj = {
                        start: getYMD(lastInWindow),
                        end: getYMD(latest),
                        days: recentDays,
                        intervals: recentCount - 1,
                        orders: recentCount
                    };
                }

                results.push({
                    name: invoices[0].Account_Name?.name || "Unknown",
                    id: accId,
                    count,
                    overallAvg,
                    recentAvg,
                    overallObj,
                    recentObj,
                    gaps: chronologicalGaps,
                    gapDates: chronologicalDates,
                    daysSince: Math.max(0, Math.floor((today.setHours(0,0,0,0) - latest.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))),
                    lastOrderId: invoices[0].id
                });
            }

            return results.sort((a,b) => b.daysSince - a.daysSince);
            
        } catch (error) {
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
            const date = new Date(state.referenceDate);
            const start = new Date(date.getFullYear(), date.getMonth() - monthsAgo, 1, 0, 0, 0);
            const end = new Date(date.getFullYear(), date.getMonth() - monthsAgo + 1, 0, 23, 59, 59);
            return {
                start: start.toISOString().split('T')[0] + 'T00:00:00+05:45',
                end: end.toISOString().split('T')[0] + 'T23:59:59+05:45'
            };
        };

        const m1 = getDates(1); // 1 month back
        const m2 = getDates(2); // 2 months back
        const m3 = getDates(3); // 3 months back

        const buildQuery = (dates) => `SELECT Product_Name, SUM(Quantity) FROM Invoiced_Items WHERE Created_Time >= '${dates.start}' AND Created_Time <= '${dates.end}' GROUP BY Product_Name`;

        try {
            const [r1, r2, r3] = await Promise.all([
                callCoqlV8(buildQuery(m1)),
                callCoqlV8(buildQuery(m2)),
                callCoqlV8(buildQuery(m3))
            ]);

            const d1 = r1.data || [];
            const d2 = r2.data || [];
            const d3 = r3.data || [];

            const trendMap = {};
            const process = (data, key) => {
                data.forEach(item => {
                    const name = item.Product_Name ? item.Product_Name.name : "Unknown";
                    if (!trendMap[name]) trendMap[name] = { m1: 0, m2: 0, m3: 0 };
                    trendMap[name][key] = item["SUM(Quantity)"] || 0;
                });
            };

            process(d1, 'm1');
            process(d2, 'm2');
            process(d3, 'm3');

            return Object.entries(trendMap).map(([name, vals]) => {
                const growthM2M1 = vals.m2 === 0 ? (vals.m1 > 0 ? 1 : 0) : ((vals.m1 - vals.m2) / vals.m2);
                const growthM3M2 = vals.m3 === 0 ? (vals.m2 > 0 ? 1 : 0) : ((vals.m2 - vals.m3) / vals.m3);
                
                // Forecast for next month using weighted growth
                const weightedGrowth = (growthM2M1 * 0.7) + (growthM3M2 * 0.3);
                let forecast = vals.m1 * (1 + weightedGrowth);
                if (forecast < 0) forecast = 0;

                return {
                    name,
                    m1: vals.m1,
                    m2: vals.m2,
                    m3: vals.m3,
                    growth: Math.round(growthM2M1 * 100),
                    forecast: Math.round(forecast)
                };
            }).sort((a,b) => b.m1 - a.m1);

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
    },
    // Smart inventory fetch using V4 API
    fetchProductsStock: async () => {
        try {
            const resp = await zrc.get("/crm/v4/Products?fields=Qty_in_Stock,Product_Name");
            // Standard V4 response: { data: { data: [], info: {} }, status: 200 }
            if (resp && resp.data && Array.isArray(resp.data.data)) return resp.data.data;
            // Fallback for { data: [] } or direct array
            if (resp && Array.isArray(resp.data)) return resp.data;
            if (Array.isArray(resp)) return resp;
            return [];
        } catch (error) {
            console.error("Stock Fetch Error:", error);
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
    const date = new Date(state.referenceDate);
    if (state.currentFilter === 'year') {
        date.setFullYear(date.getFullYear() + direction);
    } else if (state.currentFilter === 'month') {
        date.setMonth(date.getMonth() + direction);
    } else {
        // Navigate through Monthly Relative Slots (1-7, 8-14, 15-21, 22-28, 29-End)
        const dayNum = date.getDate();
        const currentSlotIdx = Math.min(Math.floor((dayNum - 1) / 7), 4);
        
        if (direction > 0) {
            // Next Week
            if (currentSlotIdx === 4) {
                date.setMonth(date.getMonth() + 1);
                date.setDate(1);
            } else {
                date.setDate((currentSlotIdx + 1) * 7 + 1);
            }
        } else {
            // Previous Week
            if (currentSlotIdx === 0) {
                date.setMonth(date.getMonth() - 1);
                date.setDate(29); // Land in the last week slot (29 - end) of the previous month
            } else {
                date.setDate((currentSlotIdx - 1) * 7 + 1);
            }
        }
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

function renderError(message) {
    document.getElementById('content').innerHTML = `
        <div style="padding: 4rem; text-align: center; color: #ef4444; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; margin: 2rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1.5rem;"></i>
            <h2 style="margin-bottom: 1rem;">Service Error Detected</h2>
            <p style="margin-bottom: 2rem; color: var(--text-muted);">${message}</p>
            <button onclick="refreshData()" class="filter-btn active" style="background: var(--primary); color: white;">Try Reconnecting</button>
        </div>
    `;
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

function showFrequencyModal(clientName, type, details, result) {
    const modalHtml = `
        <div id="freq-modal" class="modal-overlay" onclick="closeModal()">
            <div class="modal-content glass-card" style="max-width: 500px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${type} Analysis</h3>
                    <button class="close-btn" onclick="closeModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.9rem;">Calculation proof for <strong>${clientName}</strong></p>
                    
                    <div class="freq-detail-table" style="background: rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; border: 1px solid var(--border);">
                        <table style="width: 100%; font-size: 0.85rem;">
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 1rem; color: var(--text-muted);">Period Start</td>
                                <td style="padding: 1rem; font-weight: 700; text-align: right;">${details.start}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 1rem; color: var(--text-muted);">Period End</td>
                                <td style="padding: 1rem; font-weight: 700; text-align: right;">${details.end}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 1rem; color: var(--text-muted);">Total Duration</td>
                                <td style="padding: 1rem; font-weight: 700; text-align: right;">${details.days} Days</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border);">
                                <td style="padding: 1rem; color: var(--text-muted);">Invoices Analyzed</td>
                                <td style="padding: 1rem; font-weight: 700; text-align: right;">${details.orders}</td>
                            </tr>
                            <tr>
                                <td style="padding: 1rem; color: var(--text-muted);">Gaps (Intervals)</td>
                                <td style="padding: 1rem; font-weight: 700; text-align: right;">${details.intervals}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(99, 102, 241, 0.05); border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.2); display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; font-size: 0.9rem;">Average Frequency:</span>
                        <div style="text-align: right;">
                            <div style="font-size: 1.5rem; font-weight: 850; color: #10b981; line-height: 1;">${result} Days</div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; margin-top: 4px;">Calculated Average</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    setTimeout(() => document.getElementById('freq-modal').classList.add('active'), 10);
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
    // 1. Handle dynamic frequency modal
    const freqModal = document.getElementById('freq-modal');
    if (freqModal) {
        freqModal.classList.remove('active');
        setTimeout(() => freqModal.remove(), 300);
    }

    // 2. Handle dynamic trend modal
    const staticModal = document.getElementById('modal-overlay');
    if (staticModal) {
        staticModal.classList.remove('active');
    }

    // 3. Handle trend graph modal
    const graphModal = document.getElementById('trend-graph-modal');
    if (graphModal) {
        graphModal.classList.remove('active');
        setTimeout(() => graphModal.remove(), 300);
    }
    
    // 4. Handle overall trend modal
    const overallModal = document.getElementById('overall-trend-modal');
    if (overallModal) {
        overallModal.classList.remove('active');
        setTimeout(() => overallModal.remove(), 300);
    }
}

window.switchReport = switchReport;
window.switchFilter = switchFilter;
window.movePeriod = movePeriod;
window.refreshData = refreshData;
window.showClientTrendModal = (clientName, gaps, dates) => {
    const modalHtml = `
        <div id="trend-graph-modal" class="modal-overlay" onclick="closeModal()">
            <div class="modal-content glass-card" style="max-width: 95vw; height: 90vh; display: flex; flex-direction: column;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Order Frequency Trend: ${clientName}</h3>
                    <button class="close-btn" onclick="closeModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" style="flex: 1; display: flex; flex-direction: column;">
                    <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.9rem;">Days between orders over time (Lower is better)</p>
                    <div style="flex: 1; min-height: 0;">
                        <canvas id="clientTrendChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    setTimeout(() => {
        document.getElementById('trend-graph-modal').classList.add('active');
        const ctx = document.getElementById('clientTrendChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(d => {
                    const dt = new Date(d);
                    return dt.toLocaleString('default', { month: 'short', day: 'numeric' });
                }),
                datasets: [{
                    label: 'Days Gap',
                    data: gaps,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Days' } },
                    x: { ticks: { maxRotation: 45, minRotation: 45 } }
                }
            }
        });
    }, 10);
};

window.showOverallTrendModal = () => {
    const data = window.tempPatternData || [];
    if (data.length === 0) return;

    // Use absolute dates for the overall comparison to keep it synced
    const allDatesSet = new Set();
    data.forEach(c => c.gapDates.forEach(d => allDatesSet.add(d)));
    const sortedDates = Array.from(allDatesSet).sort();

    const datasets = data.map((c, index) => {
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
        
        // Map gaps to their specific dates for the common X-axis
        const dataMapped = sortedDates.map(d => {
            const idx = c.gapDates.indexOf(d);
            return idx !== -1 ? c.gaps[idx] : null;
        });

        return {
            label: c.name,
            data: dataMapped,
            borderColor: colors[index % colors.length],
            borderWidth: 1.5,
            fill: false,
            tension: 0.3,
            spanGaps: true // Connect lines even if dates are missing for a client
        };
    });

    const labels = sortedDates.map(d => {
        const dt = new Date(d);
        return dt.toLocaleString('default', { month: 'short', day: 'numeric' });
    });

    const modalHtml = `
        <div id="overall-trend-modal" class="modal-overlay" onclick="closeModal()">
            <div class="modal-content glass-card" style="max-width: 90vw; height: 90vh; display: flex; flex-direction: column;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Multi-Client Timeline Comparison</h3>
                    <button class="close-btn" onclick="closeModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" style="flex: 1; display: flex; flex-direction: column;">
                    <p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.9rem;">Ordering gaps across a shared calendar timeline. Hover over points to see specific client dates.</p>
                    <div style="flex: 1; min-height: 0;">
                        <canvas id="globalTrendChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    setTimeout(() => {
        document.getElementById('overall-trend-modal').classList.add('active');
        const ctx = document.getElementById('globalTrendChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Days Gap' } },
                    x: { ticks: { autoSkip: true, maxTicksLimit: 20 } }
                }
            }
        });
    }, 10);
};

window.switchClientFilter = (filter) => {
    state.clientFilter = filter;
    showLoading();
    reports.clients();
};
window.switchPatternPeriod = (period) => {
    state.patternsPeriod = period;
    showLoading();
    reports.patterns();
};
window.showTrendDetails = showTrendDetails;
window.showFrequencyModal = showFrequencyModal;
window.closeModal = closeModal;
window.detectEnvironment = detectEnvironment;
window.handleChartClick = handleChartClick;
window.showInvoiceListModal = showInvoiceListModal;

