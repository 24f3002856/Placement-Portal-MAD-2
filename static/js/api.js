const API = {
    BASE_URL: "/api",
    async request(url, method = "GET", body = null) {
        const options = {
            method: method,
            credentials: "include",      // Flask Session Authentication
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(this.BASE_URL + url, options);
        let data = {};
        try{
            data = await response.json();
        }
        catch(err){
            data = {};
        }

        if(!response.ok){
            throw data;
        }

        return data;
    },

    //-------------------------
    // LOGIN/LOGOUT
    //-------------------------
    login(credentials){
        return this.request("/login","POST",credentials);
    },
    logout(){
        return this.request("/logout", "POST");
    },

    //-------------------------
    // ADMIN
    //-------------------------
    getAdminDashboard(){
        return this.request("/admin/dashboard");
    },
    searchAdmin(query){
        return this.request(`/admin/search?q=${encodeURIComponent(query)}`); // encodeURIComponent() - Converts special characters into URL-safe encoding
    },
    approveCompany(company_id){
        return this.request(`/admin/company/${company_id}/approve`, "PUT");
    },
    rejectCompany(company_id){
        return this.request(`/admin/company/${company_id}/reject`, "PUT");
    },
    blacklistCompany(company_id){
        return this.request(`/admin/company/${company_id}/blacklist`, "PUT");
    },
    whitelistCompany(company_id){
        return this.request(`/admin/company/${company_id}/whitelist`, "PUT");
    },
    approveDrive(drive_id){
        return this.request(`/admin/drive/${drive_id}/approve`, "PUT");
    },
    rejectDrive(drive_id){
        return this.request(`/admin/drive/${drive_id}/reject`, "PUT");
    },
    blacklistStudent(student_id){
        return this.request(`/admin/student/${student_id}/blacklist`, "PUT");
    },
    whitelistStudent(student_id){
        return this.request(`/admin/student/${student_id}/whitelist`, "PUT");
    },

    //-------------------------
    // COMPANY
    //-------------------------
    getCompanyDashboard(){
        return this.request("/company/dashboard");
    },
    getCompany(company_id){
        return this.request(`/company/${company_id}`); // Inserts a variable or expression into a template literal
    },
    registerCompany(data){
        return this.request(`/company`,"POST", data);
    },
    updateCompany(company_id,data){
        return this.request(`/company/${company_id}`,"PUT",data);
    },
    getCompanyList(filters = {}) {
        const params = new URLSearchParams(filters); // URLSearchParams() creates for eg: approval=Approved&blacklist=No
        return this.request(`/companies?${params.toString()}`); // toString() converts params to string
    },
    // Eg function call:    
    // await API.getCompanyList({
    //     approval: "Approved",
    //     blacklist: "No"
    // })

    //-------------------------
    // STUDENT
    //-------------------------
    getStudentDashboard(){
        return this.request("/student/dashboard");
    },
    searchStudent(query){
        return this.request(`/student/search?q=${encodeURIComponent(query)}`);
    },
    getStudent(student_id){
        return this.request(`/student/${student_id}`);
    },
    async updateStudent(student_id, formData){
        return fetch(`/api/student/${student_id}`,{
            method:"PUT",
            credentials:"include",
            body:formData
        }).then(async response=>{
            const data = await response.json();        
            if(!response.ok){
                throw data;
            }
            return data;
        });
    },
    registerStudent(data){
        return this.request(`/student`,"POST",data);
    },
    getStudentList(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/students?${params.toString()}`);
    },
    

    //-------------------------
    // DRIVES
    //-------------------------
    getDrive(drive_id){
        return this.request(`/drive/${drive_id}`)
    },
    closeDrive(drive_id){
        return this.request(`/drive/${drive_id}`, "PUT");
    },
    getDriveList(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/drives?${params.toString()}`);
    },
    createDrive(data){
        return this.request("/drive","POST",data)
    },

    //-------------------------
    // APPLICATIONS
    //-------------------------
    apply(data){
        return this.request("/application","POST",data)
    },
    getApplication(application_id){
        return this.request(`/application/${application_id}`)
    },
    updateApplication(application_id,data){
        return this.request(`/application/${application_id}`,"PUT",data)
    },
    getApplicationList(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/applications?${params.toString()}`);
    },

    //-------------------------
    // INTERVIEW
    //-------------------------
    getInterview(interview_id){
        return this.request(`/interview/${interview_id}`)
    },
    scheduleInterview(data){
        return this.request("/interview", "POST", data)
    },
    updateInterview(interview_id,data){
        return this.request(`/interview/${interview_id}`,"PUT",data)
    },

    //-------------------------
    // PLACEMENT
    //-------------------------
    getPlacement(placement_id){
        return this.request(`/placement/${placement_id}`)
    },
    createPlacement(data){
        return this.request("/placement","POST",data)
    },
    updateOfferStatus(placement_id,data){
        return this.request(`/placement/${placement_id}`,"PUT",data)
    },
    getPlacementList(filters = {}){
        const params = new URLSearchParams(filters);
        return this.request(`/placements?${params.toString()}`);
    },

    //-------------------------
    // OFFER LETTER
    //-------------------------
    getOfferLetter(placement_id){
        return this.request(`/offer_letter/${placement_id}`)
    },    
    async createOfferLetter(formData){
        const response = await fetch(
            "/api/offer_letter",
            {
                method:"POST",
                body:formData,
                credentials:"include"
            }
        );
        const data = await response.json();
        if(!response.ok){
            throw data;
        }
        return data;
    }
}