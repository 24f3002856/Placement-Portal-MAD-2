function registerComponents(app){
    app.component("navbar-component", Navbar);
    app.component("sidebar-component",Sidebar);
    app.component("footer-component", Footer);
    app.component("loader",Loader);
    app.component("status-badge",StatusBadge);
    app.component("notification-toast",NotificationToast);
    app.component("dashboard-card",DashboardCard)
    app.component("search-bar",SearchBar)
}