const SearchBar = {
    props: {
        placeholder: {
            type: String,
            default: "Search..."
        }
    },
    data() {
        return {
            searchText: ""
        }
    },
    emits: ["search"],
    methods: {
        performSearch() {
            this.$emit(
                "search",
                this.searchText
            );
        }
    },
    template: `
    <div class="input-group">
        <input class="form-control" type="text" :placeholder="placeholder" v-model="searchText" @keyup.enter="performSearch">

        <button class="btn btn-primary" @click="performSearch"> 
            Search
        </button>
    </div>
    `
}