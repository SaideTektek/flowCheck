/**
 * FlowCheck - Database Simulation
 * This file simulates the backend API by wrapping LocalStorage interactions.
 */

const DB_KEY = 'flowcheck_db';

const defaultData = {
    Users: [
        { id: 'u1', name: 'Tech Corp (Patron)', role: 'Employer', walletAddress: 'TR1234567890', email: 'patron@tech.com', password: '123' },
        { id: 'u2', name: 'Ali Veli (Freelancer)', role: 'Freelancer', walletAddress: 'TR0987654321', email: 'ali@dev.com', password: '123' }
    ],
    Jobs: [
        {
            id: 'j1',
            employerId: 'u1',
            freelancerId: 'u2',
            title: 'Frontend Login Page',
            description: 'FlowCheck login sayfası tasarımı yapılacak.',
            githubRepoUrl: 'https://github.com/aliveli/flowcheck-login',
            price: 500,
            status: 'Assigned', // Assigned, Review, Revision, Paid
            issueDate: '2026-05-01',
            dueDate: '2026-05-10',
            revisionStartDate: null,
            revisionEndDate: null
        }
    ],
    GithubCommitLogs: [
        // { id: 'c1', jobId: 'j1', freelancerId: 'u2', message: 'Initial commit', timestamp: '2026-05-02T10:00:00Z', hash: 'a1b2c3d' }
    ]
};

// Initialize DB
function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
    }
}

// Get entire DB
function getDB() {
    return JSON.parse(localStorage.getItem(DB_KEY));
}

// Save entire DB
function saveDB(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// User Functions
const UserAPI = {
    login: (email, password) => {
        const db = getDB();
        const user = db.Users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        }
        return null;
    },
    register: (userData) => {
        const db = getDB();
        // MSSQL Database entegrasyonu yapıldığında bu kısmın çalışmasına gerek kalmayacaktır.
        // Frontend doğrudan backend'e fetch atıp sonucu bekleyecektir.
        const exists = db.Users.find(u => u.email === userData.email);
        if (exists) return null; // Email already taken

        const newUser = {
            id: 'u' + Date.now(),
            ...userData
        };
        db.Users.push(newUser);
        saveDB(db);
        return newUser;
    },
    logout: () => {
        localStorage.removeItem('currentUser');
    },
    updateProfile: (id, updates) => {
        const db = getDB();
        const userIndex = db.Users.findIndex(u => u.id === id);
        if (userIndex !== -1) {
            db.Users[userIndex] = { ...db.Users[userIndex], ...updates };
            saveDB(db);
            // Update current user in local storage
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser && currentUser.id === id) {
                localStorage.setItem('currentUser', JSON.stringify(db.Users[userIndex]));
            }
        }
    },
    getCurrentUser: () => {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },
    getAllFreelancers: () => {
        return getDB().Users.filter(u => u.role === 'Freelancer');
    },
    getUserById: (id) => {
        return getDB().Users.find(u => u.id === id);
    }
};

// Job Functions
const JobAPI = {
    getJobsByEmployer: (employerId) => {
        return getDB().Jobs.filter(j => j.employerId === employerId);
    },
    getJobsByFreelancer: (freelancerId) => {
        return getDB().Jobs.filter(j => j.freelancerId === freelancerId);
    },
    createJob: (job) => {
        const db = getDB();
        const newJob = { ...job, id: 'j' + Date.now(), status: 'Assigned', issueDate: new Date().toISOString().split('T')[0] };
        db.Jobs.push(newJob);
        saveDB(db);
        return newJob;
    },
    updateJobStatus: (jobId, newStatus, revisionStart = null, revisionEnd = null) => {
        const db = getDB();
        const jobIndex = db.Jobs.findIndex(j => j.id === jobId);
        if (jobIndex !== -1) {
            db.Jobs[jobIndex].status = newStatus;
            if (revisionStart && revisionEnd) {
                db.Jobs[jobIndex].revisionStartDate = revisionStart;
                db.Jobs[jobIndex].revisionEndDate = revisionEnd;
            }
            saveDB(db);
        }
    }
};

// Commit Log Functions
const CommitLogAPI = {
    getLogsByJob: (jobId) => {
        return getDB().GithubCommitLogs.filter(c => c.jobId === jobId).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    },
    addCommit: (jobId, freelancerId, message) => {
        const db = getDB();
        const newCommit = {
            id: 'c' + Date.now(),
            jobId,
            freelancerId,
            message,
            timestamp: new Date().toISOString(),
            hash: Math.random().toString(16).substring(2, 9)
        };
        db.GithubCommitLogs.push(newCommit);
        saveDB(db);
        return newCommit;
    }
};

// Run init on load
initDB();
