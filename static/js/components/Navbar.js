const Navbar = {
    props: {
        title: {
            type: String,
            default: "Placement Portal"
        },
        showLogout: {
            type:Boolean,
            default:false
        }
    },
    methods: {
        async logout(){
            await API.logout();
            this.$router.push("/");
        }
    },
    template: `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
            <div class="container-fluid">
                <router-link class="navbar-brand fw-bold" to="/">
                    {{ title }}
                </router-link>

                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <router-link class="nav-link"to="/">
                                Home
                            </router-link>
                        </li>

                        <li class="nav-item">
                            <router-link class="nav-link" to="/login">
                                Login
                            </router-link>
                        </li>

                        <li class="nav-item">
                            <button class="btn btn-dark" @click="logout" v-if="showLogout">
                                Logout
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        `
}