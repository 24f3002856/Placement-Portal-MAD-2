const routes=[
    {
        path:"/",
        component:Home
    },
    {
        path:"/login",
        component:Login
    },
    {
        path: "/register/student",
        component: RegisterStudent
    },
    {
        path: "/register/company",
        component: RegisterCompany
    },
    {
        path:"/admin",
        component:AdminDashboard
    },
    {
        path:"/company/:id",
        component:CompanyDashboard
    },
    {
        path:"/student/:id",
        component:StudentDashboard
    },
    {
        path:"/drive/:id",
        component:ViewDrive
    },
    {
        path:"/application/:id",
        component:ViewApplication
    },
    {
        path:"/create_drive",
        component:CreateDrive
    },
    {
        path:"/company_profile/:id",
        component:CompanyProfile
    },
    {
        path:"/schedule_interview/:id",
        component:InterviewScheduler
    },
    {
        path:"/view_interview/:id",
        component:ViewInterview
    },
    {
        path:"/placement/:id",
        component:Placement
    },
    {
        path:"/student_profile/:id",
        component:StudentProfile
    },
    {
        path:"/view_offer/:id",
        component:ViewOffer
    },
];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes // routes : routes
})