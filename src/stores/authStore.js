import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';

function readTokenFromStorage() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const decoded = jwtDecode(token);
            if (decoded.exp * 1000 > Date.now()) {
                return {
                    token: token,
                    user: decoded,
                    role: decoded.rol
                };
            } else {
                localStorage.removeItem('token');
            }
        } catch (e) {
            localStorage.removeItem('token');
        }
    }
    return { token: null, user: null, role: null };
}

const initialState = readTokenFromStorage();

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: initialState.token,
        user: initialState.user,
        role: initialState.role,
    }),

    getters: {
        isLoggedIn: (state) => !!state.token,

        // ✔ CORREGIDO PARA COINCIDIR CON EL BACKEND
        canModify: (state) => state.role === 'admin' || state.role === 'operator',

        isAdmin:     (state) => state.role === 'admin',
        isOperator:  (state) => state.role === 'operator',
        isViewer:    (state) => state.role === 'viewer'
    },

    actions: {
        loadUserFromToken(token) {
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    this.token = token;
                    this.user = decoded;
                    this.role = decoded.rol;
                    
                } catch (e) {
                    this.logout();
                }
            }
        },

        init() {
            const token = localStorage.getItem('token');
        if (token) {
            this.loadUserFromToken(token);
        }
        },

        logout() {
            this.token = null;
            this.user = null;
            this.role = null;
            localStorage.removeItem('token');
        },

        
    }
});
