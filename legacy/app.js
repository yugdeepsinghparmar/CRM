const APP_NAME = "Enterprise Sales Control Tower";
const PPU_RATE = 5000;
const NPU_RATE = 30000;
const STORAGE_KEY = "enterprise-sales-control-tower-v1";

const navItems = [
  ["dashboard", "Dashboard", "⌂"],
  ["leads", "Lead Management", "+"],
  ["meetings", "Meeting Tracking", "◎"],
  ["activities", "Daily Activity", "◷"],
  ["ppu", "PPU Tracking", "P"],
  ["npu", "NPU Tracking", "N"],
  ["targets", "Target Management", "◎"],
  ["revenue", "Revenue Tracking", "₹"],
  ["followups", "Follow-ups", "↗"],
  ["reports", "Reports", "⇩"],
  ["settings", "Settings", "⚙"]
];

const stages = ["Lead", "Qualified", "Demo Scheduled", "Demo Done", "Negotiation", "Closed Won", "Closed Lost"];
const statuses = ["Open", "Won", "Lost"];
const clientTypes = ["PPU", "NPU"];
const cities = ["All", "Delhi", "Gurgaon", "Noida", "Mumbai", "Bengaluru"];
const sources = ["Referral", "Inbound", "Outbound", "Partner", "Event", "Walk-in"];

const today = new Date("2026-05-16T10:00:00+05:30");
const fmtDate = (date) => new Date(date).toISOString().slice(0, 10);
const todayIso = fmtDate(today);

const sampleManagers = [
  { id: "00000000-0000-0000-0000-000000000101", name: "Soniya", email: "soniya@sales.local", role: "sales_manager", activeFrom: "2026-01-01", targetFrom: "2026-01-01", status: "Active" },
  { id: "00000000-0000-0000-0000-000000000102", name: "Rishi", email: "rishi@sales.local", role: "sales_manager", activeFrom: "2026-01-01", targetFrom: "2026-01-01", status: "Active" },
  { id: "00000000-0000-0000-0000-000000000103", name: "Sales Manager 3", email: "sm3@sales.local", role: "sales_manager", activeFrom: "2026-06-01", targetFrom: "2026-07-01", status: "Joining June" },
  { id: "00000000-0000-0000-0000-000000000104", name: "Sales Manager 4", email: "sm4@sales.local", role: "sales_manager", activeFrom: "2026-07-01", targetFrom: "2026-08-01", status: "Joining July" }
];

const sampleLeads = [
  ["Tikka Junction", "Tikka Junction", "Delhi", "PPU", 10, "Soniya", "Qualified", "Open", "2026-05-16", "2026-05-20", "2026-05-31", "Physical", "Referral"],
  ["Burger Monk", "Burger Monk", "Delhi", "PPU", 33, "Rishi", "Demo Done", "Open", "2026-05-15", "2026-05-16", "2026-05-25", "Virtual", "Inbound"],
  ["Nukkad", "Nukkad", "Delhi", "PPU", 10, "Soniya", "Closed Won", "Won", "2026-05-10", "2026-05-18", "2026-05-15", "Call", "Outbound"],
  ["Fat Tiger", "Fat Tiger", "Delhi", "PPU", 73, "Rishi", "Negotiation", "Open", "2026-05-04", "2026-05-17", "2026-06-03", "Physical", "Partner"],
  ["Sagar Ratna", "Sagar Ratna", "Delhi", "NPU", 100, "Soniya", "Demo Scheduled", "Open", "2026-05-01", "2026-05-16", "2026-06-14", "Physical", "Event"],
  ["Urban Kulhad", "Urban Kulhad", "Noida", "NPU", 45, "Rishi", "Closed Won", "Won", "2026-04-25", "2026-05-21", "2026-05-09", "Virtual", "Referral"],
  ["Dosa Works", "Dosa Works", "Gurgaon", "PPU", 18, "Soniya", "Closed Lost", "Lost", "2026-05-02", "2026-05-13", "2026-05-12", "Call", "Outbound"]
];

const state = {
  view: "dashboard",
  role: "admin",
  sessionUserId: new URLSearchParams(window.location.search).has("logout") ? null : localStorage.getItem("esc-session-user"),
  currentManagerId: "00000000-0000-0000-0000-000000000101",
  editingUserId: null,
  editingTargetId: null,
  activeReport: "summary-mtd",
  chartTypes: {
    managerChart: "bar",
    typeChart: "donut",
    trendChart: "line",
    activityChart: "bar",
    funnelChart: "horizontal",
    cityChart: "pie",
    sourceChart: "bar"
  },
  filters: { from: "2026-05-01", to: "2026-05-31", manager: "All", city: "All", type: "All", stage: "All" },
  supabase: null,
  live: false,
  data: loadData()
};

function seedData() {
  const leads = sampleLeads.map((item, index) => {
    const [client, brand, city, clientType, outlets, managerName, stage, status, date, followUp, expectedClose, meetingType, source] = item;
    const manager = sampleManagers.find((sm) => sm.name === managerName);
    const dealValue = outlets * (clientType === "PPU" ? PPU_RATE : NPU_RATE);
    return {
      id: crypto.randomUUID(),
      date,
      salesManagerId: manager.id,
      clientName: client,
      brandName: brand,
      city,
      contactPerson: `${client.split(" ")[0]} Owner`,
      contactNumber: `98${String(76000000 + index * 13759).slice(0, 8)}`,
      clientType,
      outlets,
      leadSource: source,
      meetingType,
      stage,
      status,
      dealValue,
      followUpDate: followUp,
      expectedClosureDate: expectedClose,
      remarks: status === "Won" ? "Commercials accepted." : "Manager follow-up required.",
      nextAction: stage === "Negotiation" ? "Send revised proposal" : "Schedule next conversation",
      updatedAt: index === 3 ? "2026-05-06T12:00:00+05:30" : `2026-05-${String(10 + index).padStart(2, "0")}T11:30:00+05:30`
    };
  });

  const targets = sampleManagers.flatMap((manager) => [
    {
      id: crypto.randomUUID(),
      salesManagerId: manager.id,
      periodType: "Monthly",
      periodStart: "2026-05-01",
      clientType: "PPU",
      outletTarget: manager.name.startsWith("Sales Manager") ? 0 : 30,
      brandTarget: 0,
      targetValue: manager.name.startsWith("Sales Manager") ? 0 : 150000
    },
    {
      id: crypto.randomUUID(),
      salesManagerId: manager.id,
      periodType: "Quarterly",
      periodStart: "2026-04-01",
      clientType: "NPU",
      outletTarget: manager.name.startsWith("Sales Manager") ? 0 : 90,
      brandTarget: manager.name.startsWith("Sales Manager") ? 0 : 3,
      targetValue: manager.name.startsWith("Sales Manager") ? 0 : 2700000
    }
  ]);

  return {
    managers: sampleManagers,
    users: [
      { id: "admin-1", name: "Admin", email: "admin@sales.local", role: "admin", password: "admin123", status: "Active" },
      ...sampleManagers.map((m) => ({ id: m.id, name: m.name, email: m.email, role: "sales_manager", password: "sales123", status: m.status }))
    ],
    leads,
    targets,
    meetings: leads.map((lead) => ({
      id: crypto.randomUUID(),
      leadId: lead.id,
      salesManagerId: lead.salesManagerId,
      meetingDate: lead.followUpDate,
      meetingType: lead.meetingType,
      status: lead.stage.includes("Demo") || lead.status === "Won" ? "Done" : "Planned",
      notes: lead.nextAction
    })),
    activities: leads.map((lead) => ({
      id: crypto.randomUUID(),
      salesManagerId: lead.salesManagerId,
      leadId: lead.id,
      activityDate: lead.date,
      type: lead.meetingType,
      summary: `${lead.stage} update for ${lead.clientName}`
    })),
    followups: leads.map((lead) => ({
      id: crypto.randomUUID(),
      leadId: lead.id,
      salesManagerId: lead.salesManagerId,
      dueDate: lead.followUpDate,
      status: lead.status === "Won" || lead.status === "Lost" ? "Closed" : "Pending",
      nextAction: lead.nextAction
    })),
    revenue: leads.filter((lead) => lead.status === "Won").map((lead) => ({
      id: crypto.randomUUID(),
      leadId: lead.id,
      salesManagerId: lead.salesManagerId,
      clientType: lead.clientType,
      amount: lead.dealValue,
      revenueDate: lead.expectedClosureDate
    })),
    reports: []
  };
}

function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return seedData();
  try {
    return normalizeData(JSON.parse(stored));
  } catch {
    return seedData();
  }
}

function normalizeData(data) {
  data.users = data.users || [];
  data.users = data.users.map((user) => ({ ...user, password: user.password || (user.role === "admin" ? "admin123" : "sales123"), status: user.status || "Active" }));
  if (!data.users.some((user) => user.role === "admin")) {
    data.users.unshift({ id: "admin-1", name: "Admin", email: "admin@sales.local", role: "admin", password: "admin123", status: "Active" });
  }
  data.managers = data.managers || [];
  data.targets = data.targets || [];
  return data;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function rupee(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function pct(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function managerName(id) {
  return state.data.managers.find((m) => m.id === id)?.name || "Unassigned";
}

function visibleLeads() {
  let leads = [...state.data.leads];
  if (state.role === "sales_manager") leads = leads.filter((lead) => lead.salesManagerId === state.currentManagerId);
  const f = state.filters;
  return leads.filter((lead) => {
    if (f.from && lead.date < f.from) return false;
    if (f.to && lead.date > f.to) return false;
    if (f.manager !== "All" && lead.salesManagerId !== f.manager) return false;
    if (f.city !== "All" && lead.city !== f.city) return false;
    if (f.type !== "All" && lead.clientType !== f.type) return false;
    if (f.stage !== "All" && lead.stage !== f.stage) return false;
    return true;
  });
}

function getMetrics(leads = visibleLeads()) {
  const meetings = state.data.meetings.filter((meeting) => leads.some((lead) => lead.id === meeting.leadId));
  const totalPipeline = leads.filter((l) => l.status === "Open").reduce((sum, l) => sum + l.dealValue, 0);
  const won = leads.filter((l) => l.status === "Won");
  const wonRevenue = won.reduce((sum, l) => sum + l.dealValue, 0);
  const ppuRevenue = won.filter((l) => l.clientType === "PPU").reduce((sum, l) => sum + l.dealValue, 0);
  const npuRevenue = won.filter((l) => l.clientType === "NPU").reduce((sum, l) => sum + l.dealValue, 0);
  const targetScope = state.role === "admin" ? state.data.targets : state.data.targets.filter((t) => t.salesManagerId === state.currentManagerId);
  const monthlyTarget = targetScope.filter((t) => t.periodType === "Monthly").reduce((sum, t) => sum + t.targetValue, 0);
  const quarterlyTarget = targetScope.filter((t) => t.periodType === "Quarterly").reduce((sum, t) => sum + t.targetValue, 0);
  const totalTarget = monthlyTarget + quarterlyTarget;
  return {
    totalLeads: leads.length,
    totalMeetings: meetings.length,
    meetingsToday: meetings.filter((m) => m.meetingDate === todayIso && m.status === "Done").length,
    ppuMeetings: meetings.filter((m) => leads.find((l) => l.id === m.leadId)?.clientType === "PPU").length,
    npuMeetings: meetings.filter((m) => leads.find((l) => l.id === m.leadId)?.clientType === "NPU").length,
    totalPipeline,
    wonRevenue,
    ppuRevenue,
    npuRevenue,
    monthlyTarget,
    quarterlyTarget,
    achievement: totalTarget ? (wonRevenue / totalTarget) * 100 : 0,
    remaining: Math.max(totalTarget - wonRevenue, 0),
    conversion: leads.length ? (won.length / leads.length) * 100 : 0
  };
}

function filteredManagerOptions(includeAll = true, selected = "") {
  const managers = state.role === "sales_manager" ? state.data.managers.filter((m) => m.id === state.currentManagerId) : state.data.managers;
  return `${includeAll ? `<option value="All" ${selected === "All" ? "selected" : ""}>All Sales Managers</option>` : ""}${managers.map((m) => `<option value="${m.id}" ${selected === m.id ? "selected" : ""}>${m.name}</option>`).join("")}`;
}

function render() {
  if (new URLSearchParams(window.location.search).has("logout")) {
    localStorage.removeItem("esc-session-user");
    state.sessionUserId = null;
    history.replaceState({}, "", window.location.pathname);
  }
  syncSessionRole();
  if (!state.sessionUserId) {
    document.getElementById("app").innerHTML = loginView();
    bindLoginEvents();
    return;
  }
  document.getElementById("app").innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="brand">
          <h1>${APP_NAME}</h1>
          <span>Realtime sales tracking CRM</span>
        </div>
        ${navItems.map(([id, label, icon]) => `<button class="nav-button ${state.view === id ? "active" : ""}" data-nav="${id}"><span class="nav-icon">${icon}</span><span>${label}</span></button>`).join("")}
      </aside>
      <main class="main">
        ${topbar()}
        ${state.view === "dashboard" ? dashboardView() : ""}
        ${state.view === "leads" ? leadsView() : ""}
        ${state.view === "meetings" ? listView("Meeting Tracking", meetingRows(), ["Date", "Sales Manager", "Client", "Type", "Status", "Notes"]) : ""}
        ${state.view === "activities" ? listView("Daily Activity Tracking", activityRows(), ["Date", "Sales Manager", "Client", "Activity", "Summary"]) : ""}
        ${state.view === "ppu" ? trackingView("PPU") : ""}
        ${state.view === "npu" ? trackingView("NPU") : ""}
        ${state.view === "targets" ? targetsView() : ""}
        ${state.view === "revenue" ? revenueView() : ""}
        ${state.view === "followups" ? listView("Follow-up Management", followupRows(), ["Due Date", "Sales Manager", "Client", "Status", "Next Action"]) : ""}
        ${state.view === "reports" ? reportsView() : ""}
        ${state.view === "settings" ? settingsView() : ""}
      </main>
    </div>`;
  bindEvents();
  if (state.view === "dashboard") renderCharts();
}

function syncSessionRole() {
  const user = state.data.users.find((item) => item.id === state.sessionUserId);
  if (!user) {
    state.sessionUserId = null;
    localStorage.removeItem("esc-session-user");
    return;
  }
  state.role = user.role;
  if (user.role === "sales_manager") state.currentManagerId = user.id;
}

function loginView() {
  return `<main class="login-screen">
    <section class="login-panel panel">
      <div class="brand-light">
        <h1>${APP_NAME}</h1>
        <p>Sign in with your email ID and password.</p>
      </div>
      <form id="loginForm" class="grid">
        ${field("Email ID", "email", "email", "admin@sales.local")}
        ${field("Password", "password", "password", "admin123")}
        <button class="btn" type="submit">Login</button>
      </form>
      <p class="login-help">Master demo login: admin@sales.local / admin123</p>
    </section>
  </main>`;
}

function bindLoginEvents() {
  document.getElementById("loginForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const user = state.data.users.find((item) => item.email.toLowerCase() === values.email.trim().toLowerCase() && item.password === values.password);
    if (!user) {
      alert("Invalid email or password.");
      return;
    }
    state.sessionUserId = user.id;
    localStorage.setItem("esc-session-user", user.id);
    render();
  });
}

function topbar() {
  const title = navItems.find(([id]) => id === state.view)?.[1] || "Dashboard";
  const activeUser = state.data.users.find((user) => user.id === state.sessionUserId);
  return `
    <div class="topbar">
      <button class="btn secondary mobile-menu" id="mobileMenu">☰</button>
      <div class="page-title">
        <h2>${title}</h2>
        <p>${state.role === "admin" ? "Admin view across all sales managers" : `Sales Manager view for ${managerName(state.currentManagerId)}`}</p>
      </div>
      <div class="toolbar">
        <span class="status-pill"><span class="status-dot ${state.live ? "live" : ""}"></span>${state.live ? "Supabase realtime active" : "Local mode"}</span>
        <span class="role-pill">Login: ${activeUser?.email || "demo"}</span>
        <select id="managerSelect" ${state.role === "admin" ? "" : "disabled"}>
          ${state.role === "admin" ? `<option value="">Admin View</option>` : ""}
          ${state.data.managers.map((m) => `<option value="${m.id}" ${state.currentManagerId === m.id ? "selected" : ""}>${m.name}</option>`).join("")}
        </select>
        <button class="btn secondary" id="logoutBtn">Logout</button>
      </div>
    </div>`;
}

function filters() {
  return `
    <div class="filters panel">
      <div class="field"><label>From</label><input type="date" data-filter="from" value="${state.filters.from}"></div>
      <div class="field"><label>To</label><input type="date" data-filter="to" value="${state.filters.to}"></div>
      <div class="field"><label>Sales Person</label><select data-filter="manager">${filteredManagerOptions(true, state.filters.manager)}</select></div>
      <div class="field"><label>City</label><select data-filter="city">${cities.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></div>
      <div class="field"><label>PPU / NPU</label><select data-filter="type"><option>All</option>${clientTypes.map((c) => `<option>${c}</option>`).join("")}</select></div>
      <div class="field"><label>Stage</label><select data-filter="stage"><option>All</option>${stages.map((s) => `<option>${s}</option>`).join("")}</select></div>
    </div>`;
}

function dashboardView() {
  const m = getMetrics();
  return `
    ${filters()}
    <div class="grid kpi-grid">
      ${kpi("Total Leads", m.totalLeads, "Filtered active pipeline")}
      ${kpi("Total Meetings", m.totalMeetings, `${m.meetingsToday} done today`)}
      ${kpi("PPU Meetings", m.ppuMeetings, "Petpooja users")}
      ${kpi("NPU Meetings", m.npuMeetings, "Non-Petpooja users")}
      ${kpi("Total Pipeline ₹", rupee(m.totalPipeline), "Open deal value")}
      ${kpi("Closed Won Revenue ₹", rupee(m.wonRevenue), "Booked revenue")}
      ${kpi("PPU Revenue ₹", rupee(m.ppuRevenue), "₹5,000 per outlet")}
      ${kpi("NPU Revenue ₹", rupee(m.npuRevenue), "₹30,000 per outlet")}
      ${kpi("Monthly Target ₹", rupee(m.monthlyTarget), "PPU monthly")}
      ${kpi("Quarterly Target ₹", rupee(m.quarterlyTarget), "NPU quarterly")}
      ${kpi("Achievement %", pct(m.achievement), `${rupee(m.remaining)} remaining`)}
      ${kpi("Conversion Rate %", pct(m.conversion), "Won leads / total leads")}
    </div>
    <div class="grid content-grid">
      <section class="panel">
        <div class="section-header"><h3>Performance Charts</h3><button class="btn secondary" id="printReport">Export PDF</button></div>
        <div class="section-body chart-grid">
          ${chartCard("managerChart", "Sales manager-wise target vs achievement")}
          ${chartCard("typeChart", "PPU vs NPU performance")}
          ${chartCard("trendChart", "Monthly revenue trend")}
          ${chartCard("activityChart", "Daily activity trend")}
          ${chartCard("funnelChart", "Sales funnel by stage")}
          ${chartCard("cityChart", "City-wise prospects")}
          ${chartCard("sourceChart", "Lead source performance")}
        </div>
      </section>
      <aside class="grid">
        <section class="panel">
          <div class="section-header"><h3>AI Insight Panel</h3></div>
          <div class="section-body insight-list">${aiInsights().map((i) => `<div class="insight"><strong>${i.title}</strong><p>${i.body}</p></div>`).join("")}</div>
        </section>
        <section class="panel">
          <div class="section-header"><h3>Automation Alerts</h3></div>
          <div class="section-body alert-list">${alerts().map((a) => `<div class="alert ${a.level}"><strong>${a.title}</strong><p>${a.body}</p></div>`).join("")}</div>
        </section>
      </aside>
    </div>`;
}

function kpi(label, value, note) {
  return `<div class="kpi-card panel"><small>${label}</small><strong>${value}</strong><span>${note}</span></div>`;
}

function chartCard(id, title) {
  const options = ["bar", "horizontal", "line", "pie", "donut"];
  return `<div class="chart-card">
    <div class="chart-card-head">
      <p class="chart-title">${title}</p>
      <select class="chart-type-select" data-chart-type="${id}">
        ${options.map((type) => `<option value="${type}" ${state.chartTypes[id] === type ? "selected" : ""}>${type[0].toUpperCase()}${type.slice(1)}</option>`).join("")}
      </select>
    </div>
    <canvas id="${id}" width="520" height="260"></canvas>
  </div>`;
}

function leadsView() {
  return `
    <section class="panel">
      <div class="section-header"><h3>Add / Update Lead</h3><button class="btn secondary" id="resetLeadForm">New Lead</button></div>
      <div class="section-body">${leadForm()}</div>
    </section>
    <section class="panel" style="margin-top:14px">
      <div class="section-header"><h3>Lead Register</h3><button class="btn secondary" data-export="leads">Export Excel</button></div>
      <div class="section-body table-wrap">${leadTable(visibleLeads())}</div>
    </section>`;
}

function leadForm(lead = {}) {
  const selectedManager = lead.salesManagerId || (state.role === "sales_manager" ? state.currentManagerId : "00000000-0000-0000-0000-000000000101");
  const clientType = lead.clientType || "PPU";
  const outlets = lead.outlets || 1;
  const dealValue = lead.dealValue || outlets * (clientType === "PPU" ? PPU_RATE : NPU_RATE);
  return `
    <form id="leadForm" class="form-grid">
      <input type="hidden" name="id" value="${lead.id || ""}">
      ${field("Date", "date", "date", lead.date || todayIso)}
      <div class="field"><label>Sales Manager Name</label><select name="salesManagerId" ${state.role === "sales_manager" ? "disabled" : ""}>${filteredManagerOptions(false, selectedManager)}</select></div>
      ${field("Client / Restaurant Name", "text", "clientName", lead.clientName || "", "wide")}
      ${field("Brand Name", "text", "brandName", lead.brandName || "", "wide")}
      ${field("City", "text", "city", lead.city || "Delhi")}
      ${field("Contact Person", "text", "contactPerson", lead.contactPerson || "")}
      ${field("Contact Number", "tel", "contactNumber", lead.contactNumber || "")}
      <div class="field"><label>Client Type</label><select name="clientType" id="clientType">${clientTypes.map((c) => `<option ${clientType === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
      ${field("Number of Outlets", "number", "outlets", outlets)}
      <div class="field"><label>Lead Source</label><select name="leadSource">${sources.map((s) => `<option ${lead.leadSource === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      <div class="field"><label>Meeting Type</label><select name="meetingType">${["Physical", "Virtual", "Call"].map((s) => `<option ${lead.meetingType === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      <div class="field"><label>Stage</label><select name="stage">${stages.map((s) => `<option ${lead.stage === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      <div class="field"><label>Status</label><select name="status">${statuses.map((s) => `<option ${lead.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      ${field("Deal Value ₹", "number", "dealValue", dealValue)}
      ${field("Follow-up Date", "date", "followUpDate", lead.followUpDate || todayIso)}
      ${field("Expected Closure Date", "date", "expectedClosureDate", lead.expectedClosureDate || todayIso)}
      <div class="field wide"><label>Remarks</label><textarea name="remarks">${lead.remarks || ""}</textarea></div>
      <div class="field wide"><label>Next Action</label><textarea name="nextAction">${lead.nextAction || ""}</textarea></div>
      <div class="field full actions">
        <button class="btn" type="submit">Save Lead</button>
        <button class="btn secondary" type="button" id="recalculateDeal">Recalculate Deal Value</button>
      </div>
    </form>`;
}

function field(label, type, name, value, cls = "") {
  return `<div class="field ${cls}"><label>${label}</label><input type="${type}" name="${name}" value="${value ?? ""}"></div>`;
}

function leadTable(leads) {
  if (!leads.length) return `<div class="empty">No leads match the selected filters.</div>`;
  return `<table><thead><tr>${["Date", "Sales Manager", "Client", "City", "Type", "Outlets", "Stage", "Status", "Deal Value", "Follow-up", "Action"].map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>
    ${leads.map((l) => `<tr>
      <td>${l.date}</td><td>${managerName(l.salesManagerId)}</td><td><strong>${l.clientName}</strong><br>${l.brandName}</td><td>${l.city}</td>
      <td><span class="badge ${l.clientType.toLowerCase()}">${l.clientType}</span></td><td>${l.outlets}</td><td>${l.stage}</td>
      <td><span class="badge ${l.status.toLowerCase()}">${l.status}</span></td><td>${rupee(l.dealValue)}</td><td>${l.followUpDate}</td>
      <td><button class="btn secondary" data-edit="${l.id}">Edit</button></td>
    </tr>`).join("")}</tbody></table>`;
}

function trackingView(type) {
  const leads = visibleLeads().filter((l) => l.clientType === type);
  const won = leads.filter((l) => l.status === "Won").reduce((s, l) => s + l.dealValue, 0);
  const pipeline = leads.filter((l) => l.status === "Open").reduce((s, l) => s + l.dealValue, 0);
  return `
    <div class="grid kpi-grid">
      ${kpi(`${type} Leads`, leads.length, "Filtered count")}
      ${kpi(`${type} Pipeline ₹`, rupee(pipeline), "Open value")}
      ${kpi(`${type} Revenue ₹`, rupee(won), type === "PPU" ? "₹5,000 per outlet" : "₹30,000 per outlet")}
      ${kpi(`${type} Conversion`, pct(leads.length ? leads.filter((l) => l.status === "Won").length / leads.length * 100 : 0), "Won / total")}
    </div>
    <section class="panel" style="margin-top:14px"><div class="section-header"><h3>${type} Lead Register</h3><button class="btn secondary" data-export="${type.toLowerCase()}">Export Excel</button></div><div class="section-body table-wrap">${leadTable(leads)}</div></section>`;
}

function targetsView() {
  const targets = state.role === "admin" ? state.data.targets : state.data.targets.filter((target) => target.salesManagerId === state.currentManagerId);
  return `<section class="panel"><div class="section-header"><h3>Targets</h3>${state.role === "admin" ? `<button class="btn" id="addTarget">Add Target</button>` : ""}</div><div class="section-body">
    ${state.editingTargetId && state.role === "admin" ? targetForm(state.editingTargetId === "new" ? null : state.data.targets.find((target) => target.id === state.editingTargetId)) : ""}
    <div class="table-wrap"><table><thead><tr>${["Sales Manager", "Period", "Client Type", "Outlet Target", "Brand Target", "Target Value", "Achievement", "Variance", "Action"].map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>
      ${targets.map((t) => {
        const leads = state.data.leads.filter((l) => l.salesManagerId === t.salesManagerId && l.clientType === t.clientType && l.status === "Won");
        const achieved = leads.reduce((s, l) => s + l.dealValue, 0);
        const variance = achieved - t.targetValue;
        return `<tr>
          <td>${managerName(t.salesManagerId)}</td>
          <td>${t.periodType}<br>${t.periodStart}</td>
          <td><span class="badge ${t.clientType.toLowerCase()}">${t.clientType}</span></td>
          <td>${t.outletTarget}</td>
          <td>${t.brandTarget}</td>
          <td>${rupee(t.targetValue)}</td>
          <td>${rupee(achieved)}<div class="progress"><span style="width:${t.targetValue ? Math.min(achieved / t.targetValue * 100, 100) : 0}%"></span></div></td>
          <td>${rupee(variance)}</td>
          <td>${state.role === "admin" ? `<button class="btn secondary small" data-edit-target="${t.id}">Edit</button>` : "-"}</td>
        </tr>`;
      }).join("")}
    </tbody></table></div></div></section>`;
}

function targetForm(target) {
  const selectedManager = target?.salesManagerId || state.data.managers[0]?.id || "";
  const periodType = target?.periodType || "Monthly";
  const clientType = target?.clientType || "PPU";
  return `
    <form id="targetForm" class="form-grid" style="margin-bottom:16px">
      <input type="hidden" name="id" value="${target?.id || ""}">
      <div class="field"><label>Sales Manager</label><select name="salesManagerId">${state.data.managers.map((m) => `<option value="${m.id}" ${selectedManager === m.id ? "selected" : ""}>${m.name}</option>`).join("")}</select></div>
      <div class="field"><label>Period Type</label><select name="periodType"><option ${periodType === "Monthly" ? "selected" : ""}>Monthly</option><option ${periodType === "Quarterly" ? "selected" : ""}>Quarterly</option></select></div>
      ${field("Period Start", "date", "periodStart", target?.periodStart || todayIso)}
      <div class="field"><label>Client Type</label><select name="clientType"><option ${clientType === "PPU" ? "selected" : ""}>PPU</option><option ${clientType === "NPU" ? "selected" : ""}>NPU</option></select></div>
      ${field("Outlet Target", "number", "outletTarget", target?.outletTarget ?? 30)}
      ${field("Brand Target", "number", "brandTarget", target?.brandTarget ?? 0)}
      ${field("Target Value ₹", "number", "targetValue", target?.targetValue ?? 150000)}
      <div class="field full actions"><button class="btn" type="submit">Save Target</button><button class="btn secondary" type="button" id="cancelTargetEdit">Cancel</button></div>
    </form>`;
}

function revenueView() {
  const rows = state.data.revenue.map((r) => {
    const lead = state.data.leads.find((l) => l.id === r.leadId);
    return [r.revenueDate, managerName(r.salesManagerId), lead?.clientName || "", r.clientType, rupee(r.amount)];
  });
  return listView("Revenue Tracking", rows, ["Date", "Sales Manager", "Client", "Type", "Amount"]);
}

function listView(title, rows, headers) {
  return `<section class="panel"><div class="section-header"><h3>${title}</h3><button class="btn secondary" data-export="${state.view}">Export Excel</button></div><div class="section-body table-wrap">
    ${rows.length ? `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>` : `<div class="empty">No records available.</div>`}
  </div></section>`;
}

function meetingRows() {
  return state.data.meetings.map((m) => {
    const lead = state.data.leads.find((l) => l.id === m.leadId);
    return [m.meetingDate, managerName(m.salesManagerId), lead?.clientName || "", m.meetingType, m.status, m.notes];
  });
}

function activityRows() {
  return state.data.activities.map((a) => {
    const lead = state.data.leads.find((l) => l.id === a.leadId);
    return [a.activityDate, managerName(a.salesManagerId), lead?.clientName || "", a.type, a.summary];
  });
}

function followupRows() {
  return state.data.followups.map((f) => {
    const lead = state.data.leads.find((l) => l.id === f.leadId);
    return [f.dueDate, managerName(f.salesManagerId), lead?.clientName || "", f.status, f.nextAction];
  });
}

function reportsView() {
  const reports = reportDefinitions();
  const active = reports.find((report) => report.id === state.activeReport) || reports[0];
  return `<section class="panel">
    <div class="section-header"><h3>Reports</h3><div class="actions"><button class="btn secondary" data-export="report">Export Excel</button><button class="btn secondary" id="printReport">Export PDF</button></div></div>
    <div class="report-tabs">${reports.map((report) => `<button class="report-tab ${active.id === report.id ? "active" : ""}" data-report="${report.id}">${report.name}</button>`).join("")}</div>
    <div class="section-body">${reportContent(active.id)}</div>
  </section>`;
}

function reportDefinitions() {
  return [
    { id: "summary-mtd", name: "Summary MTD" },
    { id: "daily-activity", name: "Daily Activity" },
    { id: "sales-person", name: "Sales Person-wise" },
    { id: "ppu", name: "PPU Report" },
    { id: "npu", name: "NPU Report" },
    { id: "target-achievement", name: "Target vs Achievement" },
    { id: "quarter-manager", name: "Quarter-wise Manager" },
    { id: "quarter-combined", name: "Quarter Combined" },
    { id: "followup-pending", name: "Follow-up Pending" },
    { id: "closed-won", name: "Closed Won" },
    { id: "lost-deal", name: "Lost Deals" },
    { id: "pipeline", name: "Pipeline" }
  ];
}

function reportContent(reportId) {
  const leads = visibleLeads();
  const mtdLeads = leads.filter((lead) => lead.date >= "2026-05-01" && lead.date <= todayIso);
  if (reportId === "summary-mtd") return summaryMtdReport(mtdLeads);
  if (reportId === "daily-activity") return reportTable(["Date", "Sales Manager", "Client", "Activity", "Summary"], activityRows());
  if (reportId === "sales-person") return reportTable(["Sales Manager", "Leads", "Meetings", "PPU Revenue", "NPU Revenue", "Total Revenue", "Conversion"], managerSummaryRows(leads));
  if (reportId === "ppu") return reportTable(["Date", "Sales Manager", "Client", "City", "Type", "Outlets", "Stage", "Status", "Deal Value"], leadReportRows(leads.filter((lead) => lead.clientType === "PPU")));
  if (reportId === "npu") return reportTable(["Date", "Sales Manager", "Client", "City", "Type", "Outlets", "Stage", "Status", "Deal Value"], leadReportRows(leads.filter((lead) => lead.clientType === "NPU")));
  if (reportId === "target-achievement") return reportTable(["Sales Manager", "Type", "Period", "Target", "Actual", "Achievement", "Variance"], targetActualRows("all"));
  if (reportId === "quarter-manager") return reportTable(["Sales Manager", "Quarter", "PPU Target", "PPU Actual", "NPU Target", "NPU Actual", "Total Target", "Total Actual"], quarterRows(false));
  if (reportId === "quarter-combined") return reportTable(["Quarter", "PPU Target", "PPU Actual", "NPU Target", "NPU Actual", "Total Target", "Total Actual", "Achievement"], quarterRows(true));
  if (reportId === "followup-pending") return reportTable(["Due Date", "Sales Manager", "Client", "Status", "Next Action"], followupRows().filter((row) => row[3] === "Pending"));
  if (reportId === "closed-won") return reportTable(["Date", "Sales Manager", "Client", "City", "Type", "Outlets", "Stage", "Status", "Deal Value"], leadReportRows(leads.filter((lead) => lead.status === "Won")));
  if (reportId === "lost-deal") return reportTable(["Date", "Sales Manager", "Client", "City", "Type", "Outlets", "Stage", "Status", "Deal Value"], leadReportRows(leads.filter((lead) => lead.status === "Lost")));
  if (reportId === "pipeline") return reportTable(["Date", "Sales Manager", "Client", "City", "Type", "Outlets", "Stage", "Status", "Deal Value"], leadReportRows(leads.filter((lead) => lead.status === "Open")));
  return `<div class="empty">Select a report.</div>`;
}

function summaryMtdReport(leads) {
  const metrics = getMetrics(leads);
  return `
    <div class="grid kpi-grid" style="margin-bottom:14px">
      ${kpi("MTD Total Meetings", metrics.totalMeetings, "Month to date")}
      ${kpi("MTD PPU Meetings", metrics.ppuMeetings, "Petpooja users")}
      ${kpi("MTD NPU Meetings", metrics.npuMeetings, "Non-Petpooja users")}
      ${kpi("MTD Revenue", rupee(metrics.wonRevenue), "Closed won")}
    </div>
    ${reportTable(["Sales Manager", "Leads", "Meetings", "PPU Revenue", "NPU Revenue", "Total Revenue", "Conversion"], managerSummaryRows(leads))}`;
}

function reportTable(headers, rows) {
  return `<div class="table-wrap">${rows.length ? `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>` : `<div class="empty">No records available for this report.</div>`}</div>`;
}

function leadReportRows(leads) {
  return leads.map((lead) => [lead.date, managerName(lead.salesManagerId), lead.clientName, lead.city, lead.clientType, lead.outlets, lead.stage, lead.status, rupee(lead.dealValue)]);
}

function managerSummaryRows(leads) {
  const managers = state.role === "admin" ? state.data.managers : state.data.managers.filter((manager) => manager.id === state.currentManagerId);
  return managers.map((manager) => {
    const owned = leads.filter((lead) => lead.salesManagerId === manager.id);
    const meetings = state.data.meetings.filter((meeting) => owned.some((lead) => lead.id === meeting.leadId)).length;
    const won = owned.filter((lead) => lead.status === "Won");
    const ppu = won.filter((lead) => lead.clientType === "PPU").reduce((sum, lead) => sum + lead.dealValue, 0);
    const npu = won.filter((lead) => lead.clientType === "NPU").reduce((sum, lead) => sum + lead.dealValue, 0);
    return [manager.name, owned.length, meetings, rupee(ppu), rupee(npu), rupee(ppu + npu), pct(owned.length ? won.length / owned.length * 100 : 0)];
  });
}

function targetActualRows(type = "all") {
  const targets = (state.role === "admin" ? state.data.targets : state.data.targets.filter((target) => target.salesManagerId === state.currentManagerId))
    .filter((target) => type === "all" || target.clientType === type);
  return targets.map((target) => {
    const actual = state.data.leads.filter((lead) => lead.salesManagerId === target.salesManagerId && lead.clientType === target.clientType && lead.status === "Won").reduce((sum, lead) => sum + lead.dealValue, 0);
    return [managerName(target.salesManagerId), target.clientType, `${target.periodType} ${target.periodStart}`, rupee(target.targetValue), rupee(actual), pct(target.targetValue ? actual / target.targetValue * 100 : 0), rupee(actual - target.targetValue)];
  });
}

function quarterRows(combined) {
  const rows = {};
  const targets = state.role === "admin" ? state.data.targets : state.data.targets.filter((target) => target.salesManagerId === state.currentManagerId);
  targets.forEach((target) => {
    const quarter = quarterLabel(target.periodStart);
    const key = combined ? quarter : `${target.salesManagerId}-${quarter}`;
    if (!rows[key]) rows[key] = { manager: target.salesManagerId, quarter, ppuTarget: 0, ppuActual: 0, npuTarget: 0, npuActual: 0 };
    if (target.clientType === "PPU") rows[key].ppuTarget += target.targetValue;
    if (target.clientType === "NPU") rows[key].npuTarget += target.targetValue;
  });
  state.data.leads.filter((lead) => lead.status === "Won").forEach((lead) => {
    if (state.role !== "admin" && lead.salesManagerId !== state.currentManagerId) return;
    const quarter = quarterLabel(lead.expectedClosureDate || lead.date);
    const key = combined ? quarter : `${lead.salesManagerId}-${quarter}`;
    if (!rows[key]) rows[key] = { manager: lead.salesManagerId, quarter, ppuTarget: 0, ppuActual: 0, npuTarget: 0, npuActual: 0 };
    if (lead.clientType === "PPU") rows[key].ppuActual += lead.dealValue;
    if (lead.clientType === "NPU") rows[key].npuActual += lead.dealValue;
  });
  return Object.values(rows).map((row) => {
    const totalTarget = row.ppuTarget + row.npuTarget;
    const totalActual = row.ppuActual + row.npuActual;
    return combined
      ? [row.quarter, rupee(row.ppuTarget), rupee(row.ppuActual), rupee(row.npuTarget), rupee(row.npuActual), rupee(totalTarget), rupee(totalActual), pct(totalTarget ? totalActual / totalTarget * 100 : 0)]
      : [managerName(row.manager), row.quarter, rupee(row.ppuTarget), rupee(row.ppuActual), rupee(row.npuTarget), rupee(row.npuActual), rupee(totalTarget), rupee(totalActual)];
  });
}

function quarterLabel(date) {
  const value = new Date(date);
  const quarter = Math.floor(value.getMonth() / 3) + 1;
  return `Q${quarter} ${value.getFullYear()}`;
}

function settingsView() {
  if (state.role !== "admin") {
    const user = state.data.users.find((item) => item.id === state.sessionUserId);
    return `<section class="panel"><div class="section-header"><h3>Settings</h3></div><div class="section-body">
      <div class="insight"><strong>Login details</strong><p>${user?.name} is signed in as Sales Manager. User, password, and target changes are controlled by the master/admin login.</p></div>
    </div></section>`;
  }
  const cfg = JSON.parse(localStorage.getItem("esc-supabase-config") || "{}");
  return `<section class="panel"><div class="section-header"><h3>Settings</h3></div><div class="section-body">
    <p>Connect Supabase to activate shared backend storage, RLS policies, and realtime dashboard updates. Local mode remains available for offline demos.</p>
    <form id="supabaseForm" class="form-grid">
      ${field("Supabase URL", "url", "url", cfg.url || "", "wide")}
      ${field("Supabase anon key", "text", "anon", cfg.anon || "", "wide")}
      <div class="field full actions"><button class="btn" type="submit">Save Supabase Config</button><button class="btn secondary" type="button" id="resetData">Reset Sample Data</button></div>
    </form>
    <section class="panel" style="margin-top:16px">
      <div class="section-header"><h3>User Management</h3><button class="btn" type="button" id="addUser">Add User</button></div>
      <div class="section-body">
        <div class="insight" style="margin-bottom:14px"><strong>Login setup</strong><p>Use each user's email and password as their app login. The master/admin account can create, edit, delete, and reset passwords for users.</p></div>
        ${state.editingUserId ? userForm(state.editingUserId === "new" ? null : state.data.users.find((u) => u.id === state.editingUserId)) : ""}
        <div class="table-wrap">${usersTable()}</div>
      </div>
    </section>
  </div></section>`;
}

function usersTable() {
  return `<table><thead><tr><th>User</th><th>Email/Login ID</th><th>Password</th><th>Role</th><th>Status</th><th>Active From</th><th>Target Starts</th><th>Action</th></tr></thead><tbody>
    ${state.data.users.map((user) => {
      const manager = state.data.managers.find((m) => m.id === user.id);
      return `<tr>
        <td><strong>${user.name}</strong></td>
        <td>${user.email}</td>
        <td>${user.password ? "Set" : "Not set"}</td>
        <td>${user.role === "admin" ? "Admin / Manager" : "Sales Manager"}</td>
        <td>${manager?.status || user.status || "Active"}</td>
        <td>${manager?.activeFrom || "-"}</td>
        <td>${manager?.targetFrom || "-"}</td>
        <td><div class="actions" style="margin:0"><button class="btn secondary small" data-edit-user="${user.id}">Edit</button><button class="btn danger small" data-delete-user="${user.id}">Delete</button></div></td>
      </tr>`;
    }).join("")}
  </tbody></table>`;
}

function userForm(user) {
  const manager = user ? state.data.managers.find((m) => m.id === user.id) : null;
  const role = user?.role || "sales_manager";
  return `
    <form id="userForm" class="form-grid" style="margin-bottom:16px">
      <input type="hidden" name="id" value="${user?.id || ""}">
      ${field("Full Name", "text", "name", user?.name || "", "wide")}
      ${field("Email", "email", "email", user?.email || "", "wide")}
      ${field("Login Password", "text", "password", user?.password || "", "wide")}
      <div class="field">
        <label>Role</label>
        <select name="role" id="userRole">
          <option value="sales_manager" ${role === "sales_manager" ? "selected" : ""}>Sales Manager</option>
          <option value="admin" ${role === "admin" ? "selected" : ""}>Admin / Manager</option>
        </select>
      </div>
      ${field("Status", "text", "status", manager?.status || user?.status || "Active")}
      ${field("Active From", "date", "activeFrom", manager?.activeFrom || todayIso)}
      ${field("Target Starts", "date", "targetFrom", manager?.targetFrom || todayIso)}
      <div class="field full actions">
        <button class="btn" type="submit">Save User</button>
        <button class="btn secondary" type="button" id="cancelUserEdit">Cancel</button>
      </div>
    </form>`;
}

function aiInsights() {
  const byManager = state.data.managers.map((m) => {
    const leads = state.data.leads.filter((l) => l.salesManagerId === m.id);
    const revenue = leads.filter((l) => l.status === "Won").reduce((s, l) => s + l.dealValue, 0);
    const target = state.data.targets.filter((t) => t.salesManagerId === m.id).reduce((s, t) => s + t.targetValue, 0);
    return { manager: m.name, revenue, target, achievement: target ? revenue / target : 0, leads };
  });
  const best = [...byManager].sort((a, b) => b.revenue - a.revenue)[0];
  const behind = [...byManager].filter((m) => m.target > 0).sort((a, b) => a.achievement - b.achievement)[0];
  const stuck = state.data.leads.filter((l) => l.status === "Open" && daysSince(l.updatedAt) >= 7).sort((a, b) => b.dealValue - a.dealValue)[0];
  const ppu = state.data.leads.filter((l) => l.clientType === "PPU" && l.status === "Won").reduce((s, l) => s + l.dealValue, 0);
  const npu = state.data.leads.filter((l) => l.clientType === "NPU" && l.status === "Won").reduce((s, l) => s + l.dealValue, 0);
  const city = topGroup(state.data.leads, "city", "dealValue");
  return [
    { title: "Best performer", body: `${best.manager} is leading with ${rupee(best.revenue)} closed won revenue.` },
    { title: "Behind target", body: `${behind.manager} is at ${pct(behind.achievement * 100)} achievement and needs focused pipeline conversion.` },
    { title: "Stuck deal", body: stuck ? `${stuck.clientName} has had no update for ${daysSince(stuck.updatedAt)} days. Next action: ${stuck.nextAction}.` : "No stuck deals older than 7 days." },
    { title: "Client type performance", body: `${npu >= ppu ? "NPU" : "PPU"} is performing better with ${rupee(Math.max(npu, ppu))} won revenue.` },
    { title: "Highest opportunity city", body: `${city.label} has the highest opportunity at ${rupee(city.value)} pipeline and won value.` },
    { title: "Recommended manager action", body: "Review high-value NPU follow-ups today, then push negotiation-stage PPU outlets toward closure before month end." }
  ];
}

function alerts() {
  const dueToday = state.data.followups.filter((f) => f.status === "Pending" && f.dueDate === todayIso);
  const stale = state.data.leads.filter((l) => l.status === "Open" && daysSince(l.updatedAt) >= 7);
  const lowActivity = state.data.managers.filter((m) => state.data.activities.filter((a) => a.salesManagerId === m.id && a.activityDate >= "2026-05-14").length < 2 && !m.name.startsWith("Sales Manager"));
  const highValue = state.data.leads.filter((l) => l.status === "Open" && l.dealValue >= 1000000);
  const items = [
    ...dueToday.map((f) => ({ level: "medium", title: "Follow-up due today", body: `${managerName(f.salesManagerId)} must follow up on ${state.data.leads.find((l) => l.id === f.leadId)?.clientName}.` })),
    ...stale.map((l) => ({ level: "high", title: "No update for 7 days", body: `${l.clientName} is stale with ${rupee(l.dealValue)} pipeline.` })),
    ...lowActivity.map((m) => ({ level: "medium", title: "Low activity alert", body: `${m.name} has fewer than 2 logged activities in the last 3 days.` })),
    ...highValue.map((l) => ({ level: "low", title: "High-value deal alert", body: `${l.clientName} is worth ${rupee(l.dealValue)} and needs senior review.` }))
  ];
  return items.length ? items : [{ level: "low", title: "All clear", body: "No automation alerts for the selected period." }];
}

function daysSince(date) {
  return Math.floor((today - new Date(date)) / 86400000);
}

function topGroup(rows, key, valueKey) {
  const grouped = {};
  rows.forEach((row) => grouped[row[key]] = (grouped[row[key]] || 0) + (Number(row[valueKey]) || 0));
  const [label, value] = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0] || ["None", 0];
  return { label, value };
}

function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach((btn) => btn.addEventListener("click", () => {
    state.view = btn.dataset.nav;
    document.getElementById("sidebar")?.classList.remove("open");
    render();
  }));
  document.getElementById("mobileMenu")?.addEventListener("click", () => document.getElementById("sidebar").classList.add("open"));
  document.getElementById("managerSelect")?.addEventListener("change", (e) => { state.currentManagerId = e.target.value; render(); });
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    state.sessionUserId = null;
    localStorage.removeItem("esc-session-user");
    render();
  });
  document.querySelectorAll("[data-filter]").forEach((el) => {
    el.value = state.filters[el.dataset.filter];
    el.addEventListener("change", () => { state.filters[el.dataset.filter] = el.value; render(); });
  });
  document.querySelectorAll("[data-edit]").forEach((btn) => btn.addEventListener("click", () => {
    const lead = state.data.leads.find((l) => l.id === btn.dataset.edit);
    document.querySelector(".section-body").innerHTML = leadForm(lead);
    bindLeadForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));
  document.querySelectorAll("[data-export]").forEach((btn) => btn.addEventListener("click", () => exportCsv(btn.dataset.export)));
  document.getElementById("printReport")?.addEventListener("click", () => window.print());
  document.getElementById("leadForm") && bindLeadForm();
  document.getElementById("resetLeadForm")?.addEventListener("click", render);
  document.getElementById("supabaseForm")?.addEventListener("submit", saveSupabaseConfig);
  document.getElementById("resetData")?.addEventListener("click", () => { state.data = seedData(); persist(); render(); });
  document.getElementById("addUser")?.addEventListener("click", () => { state.editingUserId = "new"; render(); });
  document.getElementById("cancelUserEdit")?.addEventListener("click", () => { state.editingUserId = null; render(); });
  document.getElementById("userForm")?.addEventListener("submit", saveUser);
  document.getElementById("addTarget")?.addEventListener("click", () => { state.editingTargetId = "new"; render(); });
  document.getElementById("cancelTargetEdit")?.addEventListener("click", () => { state.editingTargetId = null; render(); });
  document.getElementById("targetForm")?.addEventListener("submit", saveTarget);
  document.querySelectorAll("[data-chart-type]").forEach((select) => select.addEventListener("change", () => {
    state.chartTypes[select.dataset.chartType] = select.value;
    renderCharts();
  }));
  document.querySelectorAll("[data-edit-user]").forEach((btn) => btn.addEventListener("click", () => {
    state.editingUserId = btn.dataset.editUser;
    render();
  }));
  document.querySelectorAll("[data-delete-user]").forEach((btn) => btn.addEventListener("click", () => deleteUser(btn.dataset.deleteUser)));
  document.querySelectorAll("[data-edit-target]").forEach((btn) => btn.addEventListener("click", () => {
    state.editingTargetId = btn.dataset.editTarget;
    render();
  }));
  document.querySelectorAll("[data-report]").forEach((btn) => btn.addEventListener("click", () => {
    state.activeReport = btn.dataset.report;
    render();
  }));
}

function bindLeadForm() {
  const form = document.getElementById("leadForm");
  const elements = form.elements;
  const calc = () => {
    const outlets = Number(elements.outlets.value || 0);
    const rate = elements.clientType.value === "PPU" ? PPU_RATE : NPU_RATE;
    elements.dealValue.value = outlets * rate;
  };
  elements.clientType.addEventListener("change", calc);
  elements.outlets.addEventListener("input", calc);
  document.getElementById("recalculateDeal")?.addEventListener("click", calc);
  form.addEventListener("submit", saveLead);
  if (elements.salesManagerId && !elements.salesManagerId.value) elements.salesManagerId.value = state.currentManagerId;
}

async function saveLead(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  const calculatedDealValue = Number(values.outlets || 0) * (values.clientType === "PPU" ? PPU_RATE : NPU_RATE);
  const lead = {
    ...values,
    salesManagerId: state.role === "sales_manager" ? state.currentManagerId : values.salesManagerId,
    outlets: Number(values.outlets || 0),
    dealValue: calculatedDealValue,
    updatedAt: new Date().toISOString()
  };
  if (lead.id) {
    state.data.leads = state.data.leads.map((item) => item.id === lead.id ? { ...item, ...lead } : item);
  } else {
    lead.id = crypto.randomUUID();
    state.data.leads.unshift(lead);
    state.data.meetings.unshift({ id: crypto.randomUUID(), leadId: lead.id, salesManagerId: lead.salesManagerId, meetingDate: lead.followUpDate, meetingType: lead.meetingType, status: lead.stage.includes("Demo") ? "Done" : "Planned", notes: lead.nextAction });
    state.data.activities.unshift({ id: crypto.randomUUID(), salesManagerId: lead.salesManagerId, leadId: lead.id, activityDate: lead.date, type: lead.meetingType, summary: `${lead.stage} update for ${lead.clientName}` });
    state.data.followups.unshift({ id: crypto.randomUUID(), leadId: lead.id, salesManagerId: lead.salesManagerId, dueDate: lead.followUpDate, status: lead.status === "Open" ? "Pending" : "Closed", nextAction: lead.nextAction });
  }
  if (lead.status === "Won" && !state.data.revenue.some((r) => r.leadId === lead.id)) {
    state.data.revenue.unshift({ id: crypto.randomUUID(), leadId: lead.id, salesManagerId: lead.salesManagerId, clientType: lead.clientType, amount: lead.dealValue, revenueDate: lead.expectedClosureDate });
  }
  persist();
  await syncLead(lead);
  state.view = "dashboard";
  render();
}

function exportCsv(kind) {
  if (kind === "report") {
    const report = reportDefinitions().find((item) => item.id === state.activeReport) || reportDefinitions()[0];
    const rows = reportRowsForExport(state.activeReport);
    downloadCsv(`${APP_NAME.replaceAll(" ", "-").toLowerCase()}-${report.id}.csv`, rows);
    return;
  }
  const leads = kind === "ppu" ? visibleLeads().filter((l) => l.clientType === "PPU") : kind === "npu" ? visibleLeads().filter((l) => l.clientType === "NPU") : visibleLeads();
  const rows = [["Date", "Sales Manager", "Client", "Brand", "City", "Type", "Outlets", "Stage", "Status", "Deal Value", "Follow-up", "Expected Closure", "Next Action"],
    ...leads.map((l) => [l.date, managerName(l.salesManagerId), l.clientName, l.brandName, l.city, l.clientType, l.outlets, l.stage, l.status, l.dealValue, l.followUpDate, l.expectedClosureDate, l.nextAction])];
  downloadCsv(`${APP_NAME.replaceAll(" ", "-").toLowerCase()}-${kind}.csv`, rows);
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function reportRowsForExport(reportId) {
  const leads = visibleLeads();
  const mtdLeads = leads.filter((lead) => lead.date >= "2026-05-01" && lead.date <= todayIso);
  if (reportId === "summary-mtd") return [["Sales Manager", "Leads", "Meetings", "PPU Revenue", "NPU Revenue", "Total Revenue", "Conversion"], ...managerSummaryRows(mtdLeads)];
  if (reportId === "daily-activity") return [["Date", "Sales Manager", "Client", "Activity", "Summary"], ...activityRows()];
  if (reportId === "sales-person") return [["Sales Manager", "Leads", "Meetings", "PPU Revenue", "NPU Revenue", "Total Revenue", "Conversion"], ...managerSummaryRows(leads)];
  if (reportId === "ppu") return [["Date", "Sales Manager", "Client", "City", "Type", "Outlets", "Stage", "Status", "Deal Value"], ...leadReportRows(leads.filter((lead) => lead.clientType === "PPU"))];
  if (reportId === "npu") return [["Date", "Sales Manager", "Client", "City", "Type", "Outlets", "Stage", "Status", "Deal Value"], ...leadReportRows(leads.filter((lead) => lead.clientType === "NPU"))];
  if (reportId === "target-achievement") return [["Sales Manager", "Type", "Period", "Target", "Actual", "Achievement", "Variance"], ...targetActualRows("all")];
  if (reportId === "quarter-manager") return [["Sales Manager", "Quarter", "PPU Target", "PPU Actual", "NPU Target", "NPU Actual", "Total Target", "Total Actual"], ...quarterRows(false)];
  if (reportId === "quarter-combined") return [["Quarter", "PPU Target", "PPU Actual", "NPU Target", "NPU Actual", "Total Target", "Total Actual", "Achievement"], ...quarterRows(true)];
  if (reportId === "followup-pending") return [["Due Date", "Sales Manager", "Client", "Status", "Next Action"], ...followupRows().filter((row) => row[3] === "Pending")];
  if (reportId === "closed-won") return [["Date", "Sales Manager", "Client", "City", "Type", "Outlets", "Stage", "Status", "Deal Value"], ...leadReportRows(leads.filter((lead) => lead.status === "Won"))];
  if (reportId === "lost-deal") return [["Date", "Sales Manager", "Client", "City", "Type", "Outlets", "Stage", "Status", "Deal Value"], ...leadReportRows(leads.filter((lead) => lead.status === "Lost"))];
  if (reportId === "pipeline") return [["Date", "Sales Manager", "Client", "City", "Type", "Outlets", "Stage", "Status", "Deal Value"], ...leadReportRows(leads.filter((lead) => lead.status === "Open"))];
  return [["Report"], ["No data"]];
}

async function saveSupabaseConfig(event) {
  event.preventDefault();
  const cfg = Object.fromEntries(new FormData(event.currentTarget).entries());
  localStorage.setItem("esc-supabase-config", JSON.stringify(cfg));
  await initSupabase();
  render();
}

function saveUser(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  const id = values.id || crypto.randomUUID();
  const cleanName = values.name.trim();
  const cleanEmail = values.email.trim();

  if (!cleanName || !cleanEmail) {
    alert("Please enter user name and email.");
    return;
  }

  const duplicateEmail = state.data.users.some((user) => user.email.toLowerCase() === cleanEmail.toLowerCase() && user.id !== id);
  if (duplicateEmail) {
    alert("A user with this email already exists.");
    return;
  }

  const user = {
    id,
    name: cleanName,
    email: cleanEmail,
    role: values.role,
    password: values.password || "",
    status: values.status || "Active"
  };

  const existingUser = state.data.users.find((item) => item.id === id);
  if (existingUser) {
    state.data.users = state.data.users.map((item) => item.id === id ? { ...item, ...user } : item);
  } else {
    state.data.users.push(user);
  }

  if (values.role === "sales_manager") {
    upsertSalesManager({
      id,
      name: cleanName,
      email: cleanEmail,
      activeFrom: values.activeFrom || todayIso,
      targetFrom: values.targetFrom || todayIso,
      status: values.status || "Active"
    });
    ensureDefaultTargets(id, values.targetFrom || todayIso);
    if (!state.currentManagerId) state.currentManagerId = id;
  } else {
    const hasOwnedRecords = state.data.leads.some((lead) => lead.salesManagerId === id);
    if (hasOwnedRecords) {
      upsertSalesManager({
        id,
        name: cleanName,
        email: cleanEmail,
        activeFrom: values.activeFrom || todayIso,
        targetFrom: values.targetFrom || todayIso,
        status: values.status || "Inactive"
      });
    } else {
      state.data.managers = state.data.managers.filter((manager) => manager.id !== id);
      state.data.targets = state.data.targets.filter((target) => target.salesManagerId !== id);
      if (state.currentManagerId === id) state.currentManagerId = state.data.managers[0]?.id || "";
    }
  }

  state.editingUserId = null;
  persist();
  render();
}

function deleteUser(userId) {
  const user = state.data.users.find((item) => item.id === userId);
  if (!user) return;
  const masterAdmin = state.data.users.find((item) => item.role === "admin");
  if (user.id === masterAdmin?.id && user.role === "admin") {
    alert("Master/admin login cannot be deleted.");
    return;
  }
  const ownedLeads = state.data.leads.filter((lead) => lead.salesManagerId === userId).length;
  const message = ownedLeads
    ? `${user.name} has ${ownedLeads} lead records. Delete user and keep historical records as Unassigned?`
    : `Delete ${user.name}?`;
  if (!confirm(message)) return;

  state.data.users = state.data.users.filter((item) => item.id !== userId);
  state.data.managers = state.data.managers.filter((manager) => manager.id !== userId);
  state.data.targets = state.data.targets.filter((target) => target.salesManagerId !== userId);
  state.data.leads = state.data.leads.map((lead) => lead.salesManagerId === userId ? { ...lead, salesManagerId: "" } : lead);
  state.data.meetings = state.data.meetings.map((meeting) => meeting.salesManagerId === userId ? { ...meeting, salesManagerId: "" } : meeting);
  state.data.activities = state.data.activities.map((activity) => activity.salesManagerId === userId ? { ...activity, salesManagerId: "" } : activity);
  state.data.followups = state.data.followups.map((followup) => followup.salesManagerId === userId ? { ...followup, salesManagerId: "" } : followup);
  state.data.revenue = state.data.revenue.map((revenue) => revenue.salesManagerId === userId ? { ...revenue, salesManagerId: "" } : revenue);
  if (state.currentManagerId === userId) state.currentManagerId = state.data.managers[0]?.id || "";
  if (state.filters.manager === userId) state.filters.manager = "All";
  state.editingUserId = null;
  persist();
  render();
}

function saveTarget(event) {
  event.preventDefault();
  if (state.role !== "admin") {
    alert("Only master/admin can edit targets.");
    return;
  }
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  const target = {
    id: values.id || crypto.randomUUID(),
    salesManagerId: values.salesManagerId,
    periodType: values.periodType,
    periodStart: values.periodStart,
    clientType: values.clientType,
    outletTarget: Number(values.outletTarget || 0),
    brandTarget: Number(values.brandTarget || 0),
    targetValue: Number(values.targetValue || 0)
  };
  const exists = state.data.targets.some((item) => item.id === target.id);
  state.data.targets = exists ? state.data.targets.map((item) => item.id === target.id ? target : item) : [...state.data.targets, target];
  state.editingTargetId = null;
  persist();
  render();
}

function upsertSalesManager(manager) {
  const existing = state.data.managers.find((item) => item.id === manager.id);
  if (existing) {
    state.data.managers = state.data.managers.map((item) => item.id === manager.id ? { ...item, ...manager, role: "sales_manager" } : item);
  } else {
    state.data.managers.push({ ...manager, role: "sales_manager" });
  }
}

function ensureDefaultTargets(salesManagerId, targetFrom) {
  const monthStart = `${targetFrom.slice(0, 7)}-01`;
  const month = Number(targetFrom.slice(5, 7));
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  const quarterStart = `${targetFrom.slice(0, 4)}-${String(quarterStartMonth).padStart(2, "0")}-01`;
  const hasMonthly = state.data.targets.some((target) => target.salesManagerId === salesManagerId && target.periodType === "Monthly" && target.clientType === "PPU");
  const hasQuarterly = state.data.targets.some((target) => target.salesManagerId === salesManagerId && target.periodType === "Quarterly" && target.clientType === "NPU");

  if (!hasMonthly) {
    state.data.targets.push({
      id: crypto.randomUUID(),
      salesManagerId,
      periodType: "Monthly",
      periodStart: monthStart,
      clientType: "PPU",
      outletTarget: 30,
      brandTarget: 0,
      targetValue: 150000
    });
  }

  if (!hasQuarterly) {
    state.data.targets.push({
      id: crypto.randomUUID(),
      salesManagerId,
      periodType: "Quarterly",
      periodStart: quarterStart,
      clientType: "NPU",
      outletTarget: 90,
      brandTarget: 3,
      targetValue: 2700000
    });
  }
}

const SUPABASE_URL = "https://pbnxjtqnszjwfmtwzgxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBibnhqdHFuc3pqd2ZtdHd6Z3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjgwMDEsImV4cCI6MjA5NDUwNDAwMX0.9PZAQlWIReZRFXON6xypBvTo4jJ6ZbLGN66NzNpGVBk";

async function initSupabase() {
  const stored = JSON.parse(localStorage.getItem("esc-supabase-config") || "{}");
  const cfg = { url: stored.url || SUPABASE_URL, anon: stored.anon || SUPABASE_ANON_KEY };
  if (!cfg.url || !cfg.anon || !window.supabase) return;
  // Persist defaults so Settings form shows the values
  if (!stored.url) localStorage.setItem("esc-supabase-config", JSON.stringify(cfg));
  state.supabase = window.supabase.createClient(cfg.url, cfg.anon);
  state.live = true;
  state.supabase.channel("crm-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, async () => {
      const { data } = await state.supabase.from("leads").select("*");
      if (data) {
        state.data.leads = data.map(fromSupabaseLead);
        persist();
        render();
      }
    })
    .subscribe();
}

async function syncLead(lead) {
  if (!state.supabase) return;
  await state.supabase.from("leads").upsert(toSupabaseLead(lead));
}

function toSupabaseLead(lead) {
  return {
    id: lead.id,
    lead_date: lead.date,
    sales_manager_id: lead.salesManagerId,
    client_name: lead.clientName,
    brand_name: lead.brandName,
    city: lead.city,
    contact_person: lead.contactPerson,
    contact_number: lead.contactNumber,
    client_type: lead.clientType,
    outlets: lead.outlets,
    lead_source: lead.leadSource,
    meeting_type: lead.meetingType,
    stage: lead.stage,
    status: lead.status,
    follow_up_date: lead.followUpDate,
    expected_closure_date: lead.expectedClosureDate,
    remarks: lead.remarks,
    next_action: lead.nextAction,
    updated_at: lead.updatedAt
  };
}

function fromSupabaseLead(row) {
  return {
    id: row.id,
    date: row.lead_date,
    salesManagerId: row.sales_manager_id,
    clientName: row.client_name,
    brandName: row.brand_name,
    city: row.city,
    contactPerson: row.contact_person,
    contactNumber: row.contact_number,
    clientType: row.client_type,
    outlets: row.outlets,
    leadSource: row.lead_source,
    meetingType: row.meeting_type,
    stage: row.stage,
    status: row.status,
    dealValue: row.deal_value,
    followUpDate: row.follow_up_date,
    expectedClosureDate: row.expected_closure_date,
    remarks: row.remarks,
    nextAction: row.next_action,
    updatedAt: row.updated_at
  };
}

function renderCharts() {
  const leads = visibleLeads();
  drawChart("managerChart", state.data.managers.map((m) => m.name), state.data.managers.map((m) => state.data.targets.filter((t) => t.salesManagerId === m.id).reduce((s, t) => s + t.targetValue, 0)), state.data.managers.map((m) => state.data.leads.filter((l) => l.salesManagerId === m.id && l.status === "Won").reduce((s, l) => s + l.dealValue, 0)));
  drawChart("typeChart", ["PPU", "NPU"], ["PPU", "NPU"].map((t) => leads.filter((l) => l.clientType === t).reduce((s, l) => s + l.dealValue, 0)));
  drawChart("trendChart", ["Apr", "May", "Jun"], [1400000, getMetrics(leads).wonRevenue, getMetrics(leads).totalPipeline]);
  drawChart("activityChart", ["May 12", "May 13", "May 14", "May 15", "May 16"], [2, 3, 2, 4, 3]);
  drawChart("funnelChart", stages, stages.map((stage) => leads.filter((l) => l.stage === stage).length));
  const cityEntries = Object.entries(groupCounts(leads, "city"));
  drawChart("cityChart", cityEntries.map(([k]) => k), cityEntries.map(([, v]) => v));
  const sourceEntries = Object.entries(groupCounts(leads, "leadSource"));
  drawChart("sourceChart", sourceEntries.map(([k]) => k), sourceEntries.map(([, v]) => v));
}

function groupCounts(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + 1;
    return acc;
  }, {});
}

const chartColors = ["#087f8c", "#d94f30", "#2364aa", "#18875a", "#b66b00", "#7a4fd9", "#c43d3d", "#2d9cdb"];

function drawChart(id, labels, values, secondValues = null) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  const type = state.chartTypes[id] || "bar";
  if ((type === "pie" || type === "donut") && !secondValues) {
    pieChart(ctx, w, h, labels, values, type === "donut");
    return;
  }
  if (type === "line" && !secondValues) {
    lineChart(ctx, w, h, labels, values);
    return;
  }
  if (type === "horizontal") {
    horizontalChart(ctx, w, h, labels, values, secondValues);
    return;
  }
  barChart(ctx, w, h, labels, values, secondValues);
}

function barChart(ctx, w, h, labels, values, secondValues = null) {
  const allValues = secondValues ? values.concat(secondValues) : values;
  const max = Math.max(...allValues, 1);
  const left = 42;
  const bottom = 42;
  const chartW = w - left - 18;
  const chartH = h - 28 - bottom;
  ctx.strokeStyle = "#d8dee8";
  ctx.beginPath();
  ctx.moveTo(left, 16);
  ctx.lineTo(left, h - bottom);
  ctx.lineTo(w - 12, h - bottom);
  ctx.stroke();
  labels.forEach((label, i) => {
    const slot = chartW / labels.length;
    const x = left + i * slot + slot * 0.18;
    const barW = secondValues ? slot * 0.26 : slot * 0.52;
    const drawBar = (value, offset, color) => {
      const barH = value / max * chartH;
      ctx.fillStyle = color;
      ctx.fillRect(x + offset, h - bottom - barH, barW, barH);
    };
    drawBar(values[i] || 0, 0, chartColors[i % chartColors.length]);
    if (secondValues) drawBar(secondValues[i] || 0, barW + 4, "#d94f30");
    ctx.fillStyle = "#667085";
    ctx.font = "11px sans-serif";
    ctx.save();
    ctx.translate(x, h - 22);
    ctx.rotate(-0.45);
    ctx.fillText(String(label).slice(0, 14), 0, 0);
    ctx.restore();
  });
  ctx.fillStyle = "#667085";
  ctx.font = "12px sans-serif";
  ctx.fillText(max >= 100000 ? rupee(max) : String(max), 6, 24);
}

function horizontalChart(ctx, w, h, labels, values, secondValues = null) {
  const allValues = secondValues ? values.concat(secondValues) : values;
  const max = Math.max(...allValues, 1);
  const left = 118;
  const top = 22;
  const rowH = Math.max(22, (h - 42) / Math.max(labels.length, 1));
  labels.forEach((label, i) => {
    const y = top + i * rowH;
    const primaryW = (values[i] || 0) / max * (w - left - 24);
    const secondaryW = secondValues ? (secondValues[i] || 0) / max * (w - left - 24) : 0;
    ctx.fillStyle = "#667085";
    ctx.font = "11px sans-serif";
    ctx.fillText(String(label).slice(0, 16), 8, y + 12);
    ctx.fillStyle = chartColors[i % chartColors.length];
    ctx.fillRect(left, y, primaryW, secondValues ? 8 : 14);
    if (secondValues) {
      ctx.fillStyle = "#d94f30";
      ctx.fillRect(left, y + 11, secondaryW, 8);
    }
  });
}

function lineChart(ctx, w, h, labels, values) {
  const max = Math.max(...values, 1);
  const left = 42;
  const bottom = 42;
  const chartW = w - left - 20;
  const chartH = h - 30 - bottom;
  ctx.strokeStyle = "#d8dee8";
  ctx.beginPath();
  ctx.moveTo(left, 16);
  ctx.lineTo(left, h - bottom);
  ctx.lineTo(w - 12, h - bottom);
  ctx.stroke();
  ctx.strokeStyle = "#087f8c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  values.forEach((value, i) => {
    const x = left + (labels.length === 1 ? chartW / 2 : i / (labels.length - 1) * chartW);
    const y = h - bottom - value / max * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  values.forEach((value, i) => {
    const x = left + (labels.length === 1 ? chartW / 2 : i / (labels.length - 1) * chartW);
    const y = h - bottom - value / max * chartH;
    ctx.fillStyle = chartColors[i % chartColors.length];
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#667085";
    ctx.font = "11px sans-serif";
    ctx.fillText(String(labels[i]).slice(0, 10), x - 14, h - 20);
  });
}

function pieChart(ctx, w, h, labels, values, donut) {
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  const cx = w * 0.38;
  const cy = h * 0.48;
  const radius = Math.min(w, h) * 0.32;
  let start = -Math.PI / 2;
  values.forEach((value, i) => {
    const angle = value / total * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = chartColors[i % chartColors.length];
    ctx.fill();
    start += angle;
  });
  if (donut) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  labels.forEach((label, i) => {
    const x = w * 0.72;
    const y = 42 + i * 24;
    ctx.fillStyle = chartColors[i % chartColors.length];
    ctx.fillRect(x, y - 10, 12, 12);
    ctx.fillStyle = "#172033";
    ctx.font = "12px sans-serif";
    ctx.fillText(`${String(label).slice(0, 14)} ${pct(values[i] / total * 100)}`, x + 18, y);
  });
}

initSupabase().finally(render);
