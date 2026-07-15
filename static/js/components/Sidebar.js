const Sidebar = {
    props: {
        menuItems: {
            type: Array,
            default() {
                return []
            }
        }
    },
    methods:{
        scrollTo(id){
            document.getElementById(id)?.scrollIntoView({
                behavior:"smooth"
            });
        }
    },  
    template: `
        <div class="bg-light border-end vh-100 p-3">
            <h5 class="mb-4">
                Menu
            </h5>
            <ul class="nav flex-column">
                <li class="nav-item mb-2" v-for="item in menuItems" :key="item.path">
                    <a class="nav-link" href="#" @click.prevent="scrollTo(item.id)">
                        {{item.name}}
                    </a>
                </li>
            </ul>
        </div>
        `
}